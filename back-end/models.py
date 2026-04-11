from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base

# --- MODELOS DE USUÁRIOS E PERFIS ---

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False) # O email será o "Login"
    senha = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=False)
    tipo_perfil = Column(String, nullable=False) # 'STUDENT' ou 'TEACHER'

    # Ligações bi-direcionais para o Python achar os dados fácil
    perfil_aluno = relationship("Aluno", back_populates="usuario", uselist=False)
    perfil_professor = relationship("Professor", back_populates="usuario", uselist=False)

class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True) # Herança do Usuário
    cref = Column(String, unique=True, nullable=False)

    usuario = relationship("Usuario", back_populates="perfil_professor")
    alunos = relationship("Aluno", back_populates="professor") # Um professor tem vários alunos

class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True) # Herança do Usuário
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=True) # Vínculo com o Professor (pode começar sem)
    peso = Column(Float)
    altura = Column(Float)
    objetivo = Column(String)

    usuario = relationship("Usuario", back_populates="perfil_aluno")
    professor = relationship("Professor", back_populates="alunos")
    fichas = relationship("FichaTreino", back_populates="aluno")


# --- MODELOS DE TREINOS ---

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