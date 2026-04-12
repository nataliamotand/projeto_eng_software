from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
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
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    cref = Column(String, unique=True, nullable=False)

    usuario = relationship("Usuario", back_populates="perfil_professor")
    alunos = relationship("Aluno", back_populates="professor")

class Aluno(Base):
    __tablename__ = "alunos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=True)
    objetivo = Column(String)

    usuario = relationship("Usuario", back_populates="perfil_aluno")
    professor = relationship("Professor", back_populates="alunos")
    historico_evolucao = relationship("Evolucao", back_populates="aluno", cascade="all, delete-orphan")
    
    # ADICIONE ESTA LINHA AQUI EMBAIXO:
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
    titulo = Column(String) # Ex: "Treino A - Peito"
    status = Column(String, default="ativa") # ativa / inativa

    aluno = relationship("Aluno", back_populates="fichas")
    exercicios = relationship("ItemExercicio", back_populates="ficha", cascade="all, delete-orphan")

class ItemExercicio(Base):
    __tablename__ = "itens_exercicio"

    id = Column(Integer, primary_key=True, index=True)
    ficha_id = Column(Integer, ForeignKey("fichas_treino.id"))
    
    # Este é o ID que vem do JSON da Gabi!
    exercicio_referencia_id = Column(Integer, nullable=False)
    
    series = Column(Integer)
    repeticoes = Column(Integer)
    carga = Column(Float)
    observacao = Column(String, nullable=True)

    ficha = relationship("FichaTreino", back_populates="exercicios")