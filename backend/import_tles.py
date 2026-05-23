import sys
import os

# Adicionar a pasta raiz do backend ao path do Python para evitar erros de importação
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.collector import APIConector
from app.models import CategoriaObjeto

def main():
    print("==============================================================")
    print("   MOTOR DE COLETA DE DADOS ORBITAIS (APIConector) - MANUAL   ")
    print("==============================================================")
    
    # Criar uma sessão local com o banco de dados
    db = SessionLocal()
    conector = APIConector()

    try:
        # 1. Validar ou alertar se as categorias básicas estão presentes no banco
        categorias_no_banco = db.query(CategoriaObjeto).count()
        if categorias_no_banco == 0:
            print("[ERRO] Nenhuma categoria cadastrada no banco de dados!")
            print("Certifique-se de que o container do Postgres subiu e o script init.sql rodou.")
            return

        print(f"[INFO] Conexão com banco de dados saudável. Categorias ativas: {categorias_no_banco}")

        # 2. Coletar dados das Estações Espaciais (Stations -> ISS, Tiangong, etc.)
        print("\n--> Iniciando coleta de Estações Espaciais (Stations)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="stations", 
            categoria_nome="Estação Espacial"
        )

        # 3. Coletar catálogo geral de Satélites Ativos (Active)
        # Nota: O CelesTrak pode aplicar bloqueios temporários HTTP 403 para o grupo massivo 'active'
        # devido a limites de tráfego. Por isso, usamos também subgrupos dedicados em seguida como fallback/garantia.
        print("\n--> Iniciando coleta do catálogo geral de Satélites Ativos (Active)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="active", 
            categoria_nome="Satélite Ativo"
        )

        # 4. Coletar subgrupo massivo Starlink como garantia (Starlink -> ~5.000 satélites ativos)
        print("\n--> Iniciando coleta do subgrupo massivo Starlink (Garantia de satélites ativos)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="starlink", 
            categoria_nome="Satélite Ativo"
        )

        # 5. Coletar subgrupo de Interesse Visual (Visual -> NOAA, GPS, telescópios operacionais)
        print("\n--> Iniciando coleta de Satélites de Interesse Visual (Visual)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="visual", 
            categoria_nome="Satélite Ativo"
        )

        # 5.1. Coletar subgrupos ativos menores e altamente resilientes (Garantia de volume e resistência anti-403)
        subgrupos_ativos = [
            "weather", "noaa", "goes", "resource", "amateur", 
            "cubesat", "tle-new", "gps-ops", "galileo", "beidou"
        ]
        for sub in subgrupos_ativos:
            print(f"\n--> Iniciando coleta preventiva do subgrupo ativo '{sub}'...")
            conector.coletar_e_processar(db=db, grupo=sub, categoria_nome="Satélite Ativo")

        # 6. Coletar detritos do evento de colisão do Iridium 33 (iridium-33-debris)
        print("\n--> Iniciando coleta de Detritos do evento Iridium 33 (iridium-33-debris)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="iridium-33-debris", 
            categoria_nome="Detrito Espacial"
        )

        # 7. Coletar detritos do evento de colisão do Cosmos 2251 (cosmos-2251-debris)
        print("\n--> Iniciando coleta de Detritos do evento Cosmos 2251 (cosmos-2251-debris)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="cosmos-2251-debris", 
            categoria_nome="Detrito Espacial"
        )

        # 8. Coletar dados de Corpos de Foguetes e Carga Científica (Science)
        print("\n--> Iniciando coleta de Corpos de Foguetes / Científicos (Science)...")
        conector.coletar_e_processar(
            db=db, 
            grupo="science", 
            categoria_nome="Detrito Espacial"
        )

        print("\n==============================================================")
        print("   Sincronização de dados orbitais concluída com sucesso!     ")
        print("==============================================================")

    except Exception as e:
        print(f"\n[ERRO CRÍTICO] Falha durante o processo de importação: {e}")
    finally:
        db.close()



if __name__ == "__main__":
    main()
