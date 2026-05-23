import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carregar URL de conexão obtida de forma segura via variável de ambiente
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback de segurança dinâmico sem credenciais sensíveis gravadas no código fonte.
    # Em produção ou no Docker, a variável DATABASE_URL é injetada obrigatoriamente pelo ambiente.
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5433")
    db_name = os.getenv("DB_NAME", "orbital_db")
    DATABASE_URL = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

# Criar a engine de conexão do SQLAlchemy
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Configurar fábrica de sessões
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para declaração dos modelos ORM
Base = declarative_base()

def get_db():
    """Função utilitária para obter sessão do banco (Dependency Injection do FastAPI)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
