import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text, cast, Date as SQLDate, case
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal, get_db
from app.collector import APIConector
from app.models import ObjetoOrbital, CategoriaObjeto, TLEHistorico
from app import schemas

# Configuração de Logs detalhados no terminal do Docker
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MonitoramentoOrbital")


def executar_coleta_diaria():
    """Tarefa periódica que consome os TLEs e atualiza o PostgreSQL."""
    logger.info("LOG: Iniciando sincronização diária automática com CelesTrak...")
    db = SessionLocal()
    conector = APIConector()
    try:
        # 1. Estações Espaciais (Estação Espacial)
        conector.coletar_e_processar(db=db, grupo="stations", categoria_nome="Estação Espacial")
        
        # 2. Catálogo Geral de Satélites Ativos (Satélite Ativo - Tenta obter tudo)
        conector.coletar_e_processar(db=db, grupo="active", categoria_nome="Satélite Ativo")
        
        # 3. Subgrupo Starlink como garantia (Satélite Ativo - Fallback de volume)
        conector.coletar_e_processar(db=db, grupo="starlink", categoria_nome="Satélite Ativo")
        
        # 4. Satélites de Interesse Visual (Satélite Ativo - Educacionais)
        conector.coletar_e_processar(db=db, grupo="visual", categoria_nome="Satélite Ativo")

        # 4.1. Subgrupos Ativos Menores e Altamente Resilientes (Garantia de volumetria ativa anti-403)
        subgrupos_ativos = [
            "weather", "noaa", "goes", "resource", "amateur", 
            "cubesat", "tle-new", "gps-ops", "galileo", "beidou"
        ]
        for sub in subgrupos_ativos:
            logger.info(f"LOG: Iniciando coleta preventiva do subgrupo ativo '{sub}'...")
            conector.coletar_e_processar(db=db, grupo=sub, categoria_nome="Satélite Ativo")
        
        # 5. Detritos do evento Iridium 33 (Detrito Espacial)
        conector.coletar_e_processar(db=db, grupo="iridium-33-debris", categoria_nome="Detrito Espacial")
        
        # 6. Detritos do evento Cosmos 2251 (Detrito Espacial)
        conector.coletar_e_processar(db=db, grupo="cosmos-2251-debris", categoria_nome="Detrito Espacial")
        
        # 7. Corpos de Foguetes e Carga Científica (Detrito Espacial)
        conector.coletar_e_processar(db=db, grupo="science", categoria_nome="Detrito Espacial")
        
        logger.info("LOG: Sincronização automática concluída com sucesso no Scheduler.")
    except Exception as e:
        logger.error(f"LOG: Falha crítica na sincronização automática do Scheduler: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP EVENT ---
    logger.info("LOG: Inicializando servidor e agendador automático (Scheduler)...")
    
    # Criar o scheduler de segundo plano
    scheduler = BackgroundScheduler()
    
    # Adicionar o job de coleta periódica de TLEs a cada 24 horas (cumprindo RNF04)
    # Definimos next_run_time como datetime.now() para disparar uma carga inicial imediatamente no boot!
    scheduler.add_job(
        executar_coleta_diaria,
        trigger="interval",
        hours=24,
        next_run_time=datetime.now(),
        id="coleta_diaria_tles"
    )
    
    scheduler.start()
    logger.info("LOG: Scheduler iniciado com sucesso. Executando primeira carga imediata no boot...")
    
    yield
    
    # --- SHUTDOWN EVENT ---
    logger.info("LOG: Encerrando servidor e desligando agendador...")
    scheduler.shutdown()
    logger.info("LOG: Scheduler finalizado de forma limpa.")


app = FastAPI(
    title="Monitoramento Orbital Educacional - API",
    description="Backend para plataforma de visualização didática de objetos em órbita terrestre.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuração de CORS para permitir requisições do frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do Monitoramento Orbital Educacional!",
        "status": "online",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    db = SessionLocal()
    try:
        # Teste de conectividade real do banco de dados no health_check!
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    finally:
        db.close()

    return {
        "status": "healthy",
        "database": db_status
    }


# ==========================================
#          ENDPOINTS DA API REST
# ==========================================

@app.get("/api/objetos", response_model=List[schemas.ObjetoOrbitalResponse])
def listar_objetos(
    skip: int = Query(0, ge=0, description="Offset para paginação"),
    limit: int = Query(100, ge=1, le=500, description="Limite máximo de registros a retornar"),
    categoria_id: Optional[int] = Query(None, description="Filtro opcional por ID da categoria"),
    busca: Optional[str] = Query(None, description="Filtro de texto opcional para Nome ou NORAD ID"),
    db: Session = Depends(get_db)
):
    """
    Retorna a lista paginada de objetos orbitais contendo a categoria correspondente
    e o seu último registro de TLE correspondente (se disponível), otimizado para evitar N+1 queries (RNF01).
    Garante que as Estações Espaciais didáticas estejam 100% inclusas no cinturão do simulador.
    """
    try:
        # Definir prioridade de ordenação: prioriza objetos com país identificado (valor 0)
        # em detrimento de nulos, vazios ou genéricos "Não Identificado" (valor 1)
        prioridade_pais = case(
            (ObjetoOrbital.pais.is_(None), 1),
            (ObjetoOrbital.pais == "", 1),
            (ObjetoOrbital.pais.ilike("%não identificado%"), 1),
            (ObjetoOrbital.pais.ilike("%desconhecido%"), 1),
            (ObjetoOrbital.pais.ilike("%unknown%"), 1),
            else_=0
        )

        # 1. Subquery para recuperar o ID do TLE mais recente de cada objeto para evitar duplicidades na junção
        subq = db.query(
            TLEHistorico.objeto_id,
            func.max(TLEHistorico.id).label("max_id")
        ).group_by(TLEHistorico.objeto_id).subquery()

        # 2. Obter ID da categoria de Estação Espacial didática
        cat_estacao = db.query(CategoriaObjeto).filter(CategoriaObjeto.nome == "Estação Espacial").first()
        id_estacao = cat_estacao.id if cat_estacao else 4

        # 3. Lógica de amostragem inteligente para a visualização padrão (sem filtros de busca ou categoria)
        if categoria_id is None and not busca:
            # Query das Estações Espaciais
            query_estacoes = db.query(ObjetoOrbital, TLEHistorico).outerjoin(
                subq, ObjetoOrbital.id == subq.c.objeto_id
            ).outerjoin(
                TLEHistorico,
                TLEHistorico.id == subq.c.max_id
            ).filter(ObjetoOrbital.categoria_id == id_estacao)
            
            estacoes = query_estacoes.all()
            
            # Calcular o limite restante para preencher o cinturão
            saldo = max(0, limit - len(estacoes))
            
            # Query dos outros objetos priorizando países definidos de forma pseudo-aleatória
            query_outros = db.query(ObjetoOrbital, TLEHistorico).outerjoin(
                subq, ObjetoOrbital.id == subq.c.objeto_id
            ).outerjoin(
                TLEHistorico,
                TLEHistorico.id == subq.c.max_id
            ).filter(ObjetoOrbital.categoria_id != id_estacao)
            
            outros = query_outros.order_by(prioridade_pais.asc(), func.random()).offset(skip).limit(saldo).all()
            results = estacoes + outros
        else:
            # Se houver algum filtro, faz a consulta filtrada padrão priorizando países definidos
            query = db.query(ObjetoOrbital, TLEHistorico).outerjoin(
                subq, ObjetoOrbital.id == subq.c.objeto_id
            ).outerjoin(
                TLEHistorico,
                TLEHistorico.id == subq.c.max_id
            )

            if categoria_id is not None:
                query = query.filter(ObjetoOrbital.categoria_id == categoria_id)
                
            if busca:
                busca_limpa = busca.strip()
                query = query.filter(
                    ObjetoOrbital.nome.ilike(f"%{busca_limpa}%") | 
                    ObjetoOrbital.norad_id.like(f"%{busca_limpa}%")
                )

            results = query.order_by(prioridade_pais.asc(), func.random()).offset(skip).limit(limit).all()

        # 4. Mapear os resultados da tupla (ObjetoOrbital, TLEHistorico) para a estrutura do Pydantic
        response_data = []
        for objeto, tle in results:
            # Atribuição dinâmica para o schema Pydantic carregar via model_config (from_attributes=True)
            objeto.ultimo_tle = tle
            response_data.append(objeto)

        return response_data
    except Exception as e:
        logger.error(f"LOG: Erro ao listar objetos orbitais: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor ao processar a listagem")


@app.get("/api/objetos/{norad_id}", response_model=schemas.ObjetoOrbitalResponse)
def obter_objeto_por_norad(norad_id: str, db: Session = Depends(get_db)):
    """
    Busca um objeto orbital pelo seu identificador único oficial NORAD ID,
    retornando seus metadados completos e o TLE mais atual de seu histórico.
    """
    objeto = db.query(ObjetoOrbital).filter(ObjetoOrbital.norad_id == norad_id.strip()).first()
    if not objeto:
        raise HTTPException(
            status_code=404, 
            detail=f"Objeto orbital com NORAD ID '{norad_id}' não encontrado"
        )
        
    # Buscar o último TLE associado no histórico temporal
    ultimo_tle = db.query(TLEHistorico).filter(
        TLEHistorico.objeto_id == objeto.id
    ).order_by(TLEHistorico.epoch.desc()).first()
    
    objeto.ultimo_tle = ultimo_tle
    return objeto


@app.get("/api/estatisticas", response_model=schemas.EstatisticasResponse)
def obter_estatisticas(db: Session = Depends(get_db)):
    """
    Retorna métricas agregadas dos objetos contidos na base de dados relacional
    para exibição gráfica no painel educacional principal (Dashboard).
    """
    try:
        # 1. Total Geral de objetos catalogados
        total_objetos = db.query(func.count(ObjetoOrbital.id)).scalar() or 0

        # 2. Percentual de Detritos Espaciais (cálculo defensivo baseado em buscas textuais por categoria)
        categoria_detritos_ids = db.query(CategoriaObjeto.id).filter(
            CategoriaObjeto.nome.ilike("%detrito%") | CategoriaObjeto.nome.ilike("%debris%")
        ).all()
        categoria_detritos_ids = [c[0] for c in categoria_detritos_ids]

        total_detritos = 0
        if categoria_detritos_ids:
            total_detritos = db.query(func.count(ObjetoOrbital.id)).filter(
                ObjetoOrbital.categoria_id.in_(categoria_detritos_ids)
            ).scalar() or 0

        percentual_detritos = (total_detritos / total_objetos * 100.0) if total_objetos > 0 else 0.0

        # 3. Distribuição de objetos por Nação/País de origem (agregação condicional de alta performance por categoria)
        cat_detritos = db.query(CategoriaObjeto.id).filter(
            CategoriaObjeto.nome.ilike("%detrito%") | CategoriaObjeto.nome.ilike("%debris%")
        ).first()
        id_detrito = cat_detritos[0] if cat_detritos else 3

        cat_estacao = db.query(CategoriaObjeto.id).filter(
            CategoriaObjeto.nome.ilike("%estação%") | CategoriaObjeto.nome.ilike("%stations%")
        ).first()
        id_estacao = cat_estacao[0] if cat_estacao else 4

        paises_query = db.query(
            ObjetoOrbital.pais.label("pais"),
            func.count(ObjetoOrbital.id).label("total"),
            func.count(case((ObjetoOrbital.categoria_id == 1, 1))).label("ativos"),
            func.count(case((ObjetoOrbital.categoria_id == id_detrito, 1))).label("detritos"),
            func.count(case((ObjetoOrbital.categoria_id == id_estacao, 1))).label("estacoes")
        ).group_by(
            ObjetoOrbital.pais
        ).order_by(
            func.count(ObjetoOrbital.id).desc()
        ).all()

        distribuicao_paises = [
            schemas.EstatisticasPais(
                pais=p.pais, 
                total=p.total,
                ativos=p.ativos,
                detritos=p.detritos,
                estacoes=p.estacoes
            )
            for p in paises_query
        ]

        # 4. Evolução Histórica (Volume de TLEs atualizados nos últimos 7 dias na base de dados)
        limite_data = datetime.utcnow() - timedelta(days=7)
        evolucao_query = db.query(
            cast(TLEHistorico.data_captura, SQLDate).label("data"),
            func.count(TLEHistorico.id).label("total")
        ).filter(
            TLEHistorico.data_captura >= limite_data
        ).group_by(
            cast(TLEHistorico.data_captura, SQLDate)
        ).order_by(
            cast(TLEHistorico.data_captura, SQLDate).asc()
        ).all()

        evolucao_historica = [
            schemas.EvolucaoHistorica(data=str(e[0]), total=e[1])
            for e in evolucao_query
        ]

        return schemas.EstatisticasResponse(
            total_objetos=total_objetos,
            percentual_detritos=round(percentual_detritos, 2),
            distribuicao_paises=distribuicao_paises,
            evolucao_historica=evolucao_historica
        )
    except Exception as e:
        logger.error(f"LOG: Erro ao calcular estatísticas orbitais: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao consolidar dados estatísticos")
