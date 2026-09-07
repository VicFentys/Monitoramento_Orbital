import httpx
from datetime import datetime, timedelta, date
import logging
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models import CategoriaObjeto, ObjetoOrbital, TLEHistorico

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("APIConector")

class APIConector:
    def __init__(self):
        self.url_base = "https://celestrak.org/NORAD/elements/gp.php"
        # Mapeamento estático didático de alguns satélites históricos/famosos para enriquecer o banco
        self.mapeamento_paises = {
            "25544": "Multi-Nacional (ISS)", # ISS
            "48274": "China",              # Tiangong
            "22823": "Brasil",             # SCD-1 (Satélite de Coleta de Dados brasileiro)
            "25400": "Brasil",             # SCD-2
            "54380": "Brasil",             # Amazonia-1
            "00011": "EUA",                # Vanguard 1
            "25546": "EUA",                # Starlink 1
        }

    def inferir_pais_por_nome(self, nome: str, norad_id: str) -> str:
        """Infere o país de origem didaticamente a partir de termos no nome ou NORAD ID."""
        norad_id = norad_id.strip()
        if norad_id in self.mapeamento_paises:
            return self.mapeamento_paises[norad_id]
            
        nome_upper = nome.upper()
        
        # Brasil
        if any(x in nome_upper for x in ["AMAZONIA", "SCD", "ITASAT", "VCUB", "FLORIPASAT", "SPORT", "NANOSATCBR", "PION"]):
            return "Brasil"
        # Brasil/China (CBERS)
        elif "CBERS" in nome_upper:
            return "Brasil/China"
        # Estados Unidos
        elif any(x in nome_upper for x in ["STARLINK", "GPS", "VANGUARD", "NOAA", "GOES", "NROL", "IRIDIUM", "EXPLORER", "TIROS", "TRANSIT", "LACROSSE", "SBIRS", "DSP", "CREW DRAGON", "DRAGON", "CYGNUS", "SKYLAB"]):
            return "Estados Unidos"
        # Rússia
        elif any(x in nome_upper for x in ["COSMOS", "SOYUZ", "GLONASS", "MOLNIYA", "RADUGA", "GRIF", "EXPRESS", "LUCH", "YANTAR", "PROGRESS", "POISK", "ZVEZDA", "ZARYA"]):
            return "Rússia"
        # China
        elif any(x in nome_upper for x in ["TIANGONG", "BEIDOU", "SHENZHOU", "CHANG'E", "YAOGAN", "GAOFEN", "SHIYAN", "YUNHAI", "JILIN", "ZONGHENG", "FENGYUN", "TIANHE", "WENTIAN", "MENGTIAN", "TIANZHOU"]):
            return "China"
        # Japão
        elif any(x in nome_upper for x in ["HIMAWARI", "ALOS", "GOSAT", "KAGUYA", "HAYABUSA", "ASNARO", "ETS", "IGS", "HTV", "KIBO", "JEM"]):
            return "Japão"
        # Índia
        elif any(x in nome_upper for x in ["INSAT", "IRS", "GSAT", "CARTOSAT", "RESOURCESAT", "OCEANSAT", "RISAT", "ASTROSAT"]):
            return "Índia"
        # União Europeia / ESA
        elif any(x in nome_upper for x in ["ARIANE", "SENTINEL", "GALILEO", "METEOP", "ENVISAT", "ERS", "ISO", "HERSCHEL", "COLUMBUS"]):
            return "União Europeia"
        # Reino Unido
        elif any(x in nome_upper for x in ["ONEWEB", "SKYNET"]):
            return "Reino Unido"
        # Canadá
        elif any(x in nome_upper for x in ["ANIK", "RADARSAT"]):
            return "Canadá"
        # Coreia do Sul
        elif any(x in nome_upper for x in ["KOREASAT", "KOMPSAT"]):
            return "Coreia do Sul"
            
        return "Não Identificado"

    def parse_tle_epoch(self, epoch_str: str) -> datetime:
        """
        Decodifica matematicamente o epoch no formato TLE (YYDDD.DDDDDDDD) para datetime.
        Exemplo: '24143.20815972' -> Ano 2024, dia 143 com fração.
        """
        try:
            year_part = int(epoch_str[0:2])
            day_part = float(epoch_str[2:])
            
            # Convenção NORAD: anos >= 57 são 19xx, senão 20xx
            year = 1900 + year_part if year_part >= 57 else 2000 + year_part
            
            base_date = datetime(year, 1, 1)
            # DDD.DDDDDDDD é 1-indexed (dia 1.0 é 1 de Janeiro às 00:00)
            return base_date + timedelta(days=day_part - 1)
        except Exception as e:
            logger.error(f"Erro ao converter epoch TLE '{epoch_str}': {e}")
            return datetime.utcnow()

    def coletar_e_processar(self, db: Session, grupo: str, categoria_nome: str):
        """
        Consome o endpoint do CelesTrak por grupo, decodifica o texto do TLE
        e salva ou atualiza de forma altamente otimizada via Bulk UPSERT no PostgreSQL.
        """
        # 1. Buscar o ID da categoria correspondente no banco
        categoria = db.query(CategoriaObjeto).filter(CategoriaObjeto.nome == categoria_nome).first()
        if not categoria:
            logger.error(f"Categoria '{categoria_nome}' não encontrada no banco. Abortando coleta.")
            return

        logger.info(f"Iniciando requisição ao CelesTrak para o grupo '{grupo}'...")
        params = {"GROUP": grupo, "FORMAT": "tle"}
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            # Consumir API via HTTPX com um timeout maior de 60 segundos para blocos gerais massivos
            with httpx.Client(timeout=60.0, headers=headers) as client:
                response = client.get(self.url_base, params=params)
                response.raise_for_status()
                texto_bruto = response.text
        except Exception as e:
            logger.error(f"Falha na requisição HTTP para o CelesTrak para o grupo '{grupo}': {e}")
            return

        # 2. Parsear o texto bruto
        linhas = [l.strip() for l in texto_bruto.splitlines() if l.strip()]
        total_linhas = len(linhas)
        logger.info(f"Resposta recebida do grupo '{grupo}'. Parseando {total_linhas} linhas de texto...")

        # Mapeamento do status didático com base na categoria
        status_objeto = "Ativo" if categoria_nome in ["Satélite Ativo", "Estação Espacial"] else "Inativo" if categoria_nome == "Satélite Inativo" else "Detrito"

        objetos_a_inserir = []
        tle_dados_temporarios = []
        starlinks_processados = 0

        # Iterar de 3 em 3 linhas (Estrutura TLE: Linha 0 (Nome), Linha 1, Linha 2)
        for i in range(0, total_linhas - 2, 3):
            linha0 = linhas[i]      # Nome do objeto
            linha1 = linhas[i+1]    # TLE Linha 1
            linha2 = linhas[i+2]    # TLE Linha 2

            # Validar integridade básica do TLE (deve começar com 1 e 2 e ter comprimentos corretos)
            if not (linha1.startswith("1 ") and linha2.startswith("2 ") and len(linha1) >= 69 and len(linha2) >= 69):
                continue

            # Limitar quantidade massiva de Starlinks a no máximo 30 por grupo para manter diversidade didática
            if "STARLINK" in linha0.upper():
                if starlinks_processados >= 30:
                    continue
                starlinks_processados += 1

            try:
                # Extrair NORAD ID (colunas 3 a 7 na Linha 1, ex: "25544")
                norad_id = linha1[2:7].strip()
                
                # Extrair o Epoch bruto do TLE (colunas 19 a 32 na Linha 1, ex: "24143.20815972")
                epoch_str = linha1[18:32].strip()
                epoch_dt = self.parse_tle_epoch(epoch_str)

                # Inferir nação de origem
                pais = self.inferir_pais_por_nome(linha0, norad_id)

                # Obter ano de lançamento das colunas 10-11 da linha 1
                ano_str = linha1[9:11].strip()
                if ano_str.isdigit():
                    ano_part = int(ano_str)
                    ano = 1900 + ano_part if ano_part >= 57 else 2000 + ano_part
                    data_lancamento = date(ano, 1, 1)
                else:
                    data_lancamento = None

                # Classificação de satélites inativos históricos
                cat_id_final = categoria.id
                status_final = status_objeto
                if categoria.id == 1 and data_lancamento and data_lancamento.year < 2005 and norad_id not in ["22823", "25400", "25544"]:
                    cat_id_final = 2  # Satélite Inativo
                    status_final = "Inativo"

                # Estruturar dados do Objeto para inserção em lote
                objetos_a_inserir.append({
                    "nome": linha0,
                    "norad_id": norad_id,
                    "pais": pais,
                    "status": status_final,
                    "data_lancamento": data_lancamento,
                    "categoria_id": cat_id_final
                })

                # Guardar dados temporários do TLE para processamento posterior
                tle_dados_temporarios.append({
                    "norad_id": norad_id,
                    "epoch": epoch_dt,
                    "linha1": linha1,
                    "linha2": linha2
                })

            except Exception as ex:
                logger.error(f"Erro ao processar bloco TLE do objeto '{linha0}': {ex}")
                continue

        if not objetos_a_inserir:
            logger.info(f"Nenhum objeto válido parseado para o grupo '{grupo}'.")
            return

        # 3. Executar o Bulk UPSERT dos Objetos Orbitais usando on_conflict_do_update no PostgreSQL
        logger.info(f"Executando Bulk UPSERT de {len(objetos_a_inserir)} objetos do grupo '{grupo}'...")
        
        # Filtrar duplicatas locais no próprio lote recebido (caso a API traga o mesmo norad_id duas vezes)
        objetos_unicos = {}
        for obj in objetos_a_inserir:
            objetos_unicos[obj["norad_id"]] = obj
        valores_objetos = list(objetos_unicos.values())

        # Instrução Bulk UPSERT nativa do PostgreSQL (retorna os IDs gerados de volta)
        stmt = pg_insert(ObjetoOrbital).values(valores_objetos)
        stmt = stmt.on_conflict_do_update(
            index_elements=["norad_id"],
            set_={
                "nome": stmt.excluded.nome,
                "pais": stmt.excluded.pais,
                "status": stmt.excluded.status,
                "data_lancamento": stmt.excluded.data_lancamento,
                "categoria_id": stmt.excluded.categoria_id
            }
        ).returning(ObjetoOrbital.id, ObjetoOrbital.norad_id)

        try:
            result = db.execute(stmt)
            # Mapear norad_id -> id no banco gerado via SERIAL
            norad_to_id = {row.norad_id: row.id for row in result}
            objetos_salvos = len(norad_to_id)
        except Exception as e:
            logger.error(f"Erro ao executar Bulk UPSERT de objetos para o grupo '{grupo}': {e}")
            db.rollback()
            return

        # 4. Executar a inserção do Histórico TLE em lote sem duplicar registros do mesmo epoch
        logger.info("Buscando TLEs históricos existentes para evitar duplicidade de epoch...")
        objeto_ids = list(norad_to_id.values())
        
        # Buscar os históricos existentes para esses objetos em uma única consulta rápida
        historicos_existentes = db.query(TLEHistorico.objeto_id, TLEHistorico.epoch).filter(
            TLEHistorico.objeto_id.in_(objeto_ids)
        ).all()
        historicos_existentes_set = {(row.objeto_id, row.epoch) for row in historicos_existentes}

        valores_historicos = []
        historicos_unicos_lote = set()

        for tle in tle_dados_temporarios:
            obj_id = norad_to_id.get(tle["norad_id"])
            if not obj_id:
                continue
            
            # Evitar duplicata idêntica dentro do próprio lote da API
            chave_lote = (obj_id, tle["epoch"])
            if chave_lote in historicos_unicos_lote:
                continue
            
            # Evitar duplicata contra dados persistidos anteriormente no banco
            if chave_lote in historicos_existentes_set:
                continue

            valores_historicos.append({
                "objeto_id": obj_id,
                "epoch": tle["epoch"],
                "linha1": tle["linha1"],
                "linha2": tle["linha2"],
                "data_captura": datetime.utcnow()
            })
            historicos_unicos_lote.add(chave_lote)

        historicos_gerados = 0
        if valores_historicos:
            logger.info(f"Inserindo em lote {len(valores_historicos)} históricos de TLE...")
            try:
                db.execute(pg_insert(TLEHistorico).values(valores_historicos))
                historicos_gerados = len(valores_historicos)
            except Exception as e:
                logger.error(f"Erro ao inserir TLEHistorico em lote: {e}")
                db.rollback()
                return

        # Commitar transação
        db.commit()
        logger.info(f"LOG: Sincronização do grupo '{grupo}' concluída. {objetos_salvos} objetos processados/atualizados. {historicos_gerados} históricos de TLE adicionados.")
