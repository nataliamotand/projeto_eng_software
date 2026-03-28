from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    tipo_perfil = Column(String, nullable=False) # 'aluno' ou 'professor'

class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(Integer, primary_key=True, index=True)
    # A Chave Estrangeira que liga o Aluno ao seu perfil de Usuário
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True) 
    peso = Column(Float)
    altura = Column(Float)
    objetivo = Column(String)

    # Relacionamentos para facilitar as buscas no Python
    fichas = relationship("FichaTreino", back_populates="aluno")

class FichaTreino(Base):
    __tablename__ = "fichas_treino"

    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id")) # Ligação com o Aluno
    titulo = Column(String, nullable=False)
    status = Column(String, default="ativa") # Pode ser 'ativa', 'inativa', 'proposta'

    aluno = relationship("Aluno", back_populates="fichas")
    exercicios = relationship("Exercicio", back_populates="ficha")

class Exercicio(Base):
    __tablename__ = "exercicios"

    id = Column(Integer, primary_key=True, index=True)
    ficha_id = Column(Integer, ForeignKey("fichas_treino.id")) # Ligação com a Ficha
    nome = Column(String, nullable=False)
    grupo_muscular = Column(String)
    series = Column(Integer)
    repeticoes_base = Column(Integer)
    carga_estimada = Column(Float)

    ficha = relationship("FichaTreino", back_populates="exercicios")