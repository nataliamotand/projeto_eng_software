from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# URL de conexão com o banco PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_GiWjug0zEvp1@ep-weathered-bonus-ant30un4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# O 'Engine' é o motor que gerencia a comunicação real com o banco de dados
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

# A 'Session' é a nossa "janela" de conversa com o banco. 
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 'Base' é a classe fundacional. Transforma classes Python em tabelas de verdade.
Base = declarative_base()