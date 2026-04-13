from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=False)
    tipo_perfil = Column(String, nullable=False) # 'STUDENT' ou 'TEACHER'

    perfil_aluno = relationship("Aluno", back_populates="usuario", uselist=False)
    perfil_professor = relationship("Professor", back_populates="usuario", uselist=False)

class Professor(Base):
    __tablename__ = "professores"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    usuario = relationship("Usuario", back_populates="perfil_professor")
    alunos = relationship("Aluno", back_populates="professor")

class Aluno(Base):
    __tablename__ = "alunos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=True) 
    
    # --- O APERTO DE MÃO (BACK-POPULATES) ESTÁ TODO AQUI ---
    usuario = relationship("Usuario", back_populates="perfil_aluno")
    professor = relationship("Professor", back_populates="alunos")
    rotinas = relationship("Rotina", back_populates="aluno")
    historico_evolucao = relationship("Evolucao", back_populates="aluno")
    fichas = relationship("FichaTreino", back_populates="aluno")

class Evolucao(Base):
    __tablename__ = "evolucoes"
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    data_registro = Column(Date, default=date.today)
    peso = Column(Float, nullable=False)
    porcentagem_gordura = Column(Float, nullable=True)
    massa_muscular = Column(Float, nullable=True)

    aluno = relationship("Aluno", back_populates="historico_evolucao")

class FichaTreino(Base):
    __tablename__ = "fichas_treino"
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    titulo = Column(String)
    status = Column(String, default="ativa")

    aluno = relationship("Aluno", back_populates="fichas")
    exercicios = relationship("ItemExercicio", back_populates="ficha", cascade="all, delete-orphan")

class ItemExercicio(Base):
    __tablename__ = "itens_exercicio"
    id = Column(Integer, primary_key=True, index=True)
    ficha_id = Column(Integer, ForeignKey("fichas_treino.id"))
    exercicio_referencia_id = Column(Integer, nullable=False)
    series = Column(Integer)
    repeticoes = Column(Integer)
    carga = Column(Float)
    observacao = Column(String, nullable=True)

    ficha = relationship("FichaTreino", back_populates="exercicios")

class Rotina(Base):
    __tablename__ = "rotinas"
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    title = Column(String)
    criado_por_professor = Column(Boolean, default=False)
    status = Column(String, default="pending")

    aluno = relationship("Aluno", back_populates="rotinas")