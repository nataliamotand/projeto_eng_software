from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    senha = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=False)
    tipo_perfil = Column(String, nullable=False)
    foto_perfil = Column(String, nullable=True)

    # Relacionamentos de Perfil
    perfil_aluno = relationship("Aluno", back_populates="usuario", uselist=False)
    perfil_professor = relationship("Professor", back_populates="usuario", uselist=False)
    
    # Integração Social
    notificacoes_recebidas = relationship("Notificacao", foreign_keys="[Notificacao.destinatario_id]", back_populates="destinatario")
    seguidores = relationship("Seguidor", foreign_keys="[Seguidor.seguido_id]", back_populates="seguido")
    seguindo = relationship("Seguidor", foreign_keys="[Seguidor.seguidor_id]", back_populates="seguidor")

class Professor(Base):
    __tablename__ = "professores"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    cref = Column(String, unique=True, nullable=True)
    especialidade = Column(String, nullable=True)  # ← adicionar

    usuario = relationship("Usuario", back_populates="perfil_professor")
    alunos = relationship("Aluno", back_populates="professor")

class Aluno(Base):
    __tablename__ = "alunos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    professor_id = Column(Integer, ForeignKey("professores.id"), nullable=True) 
    objetivo = Column(String, nullable=True)
    
    usuario = relationship("Usuario", back_populates="perfil_aluno")
    professor = relationship("Professor", back_populates="alunos")
    rotinas = relationship("Rotina", back_populates="aluno")
    historico_evolucao = relationship("Evolucao", back_populates="aluno", cascade="all, delete-orphan")
    fichas = relationship("FichaTreino", back_populates="aluno")
    historico_treinos = relationship("TreinoRealizado", back_populates="aluno")

class Evolucao(Base):
    __tablename__ = "evolucoes"
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    data_registro = Column(DateTime, default=datetime.utcnow)
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
    criado_por_professor = Column(Boolean, default=False)
    data_criacao = Column(DateTime, default=datetime.utcnow) # Útil para o feed e filtros

    aluno = relationship("Aluno", back_populates="fichas")
    exercicios = relationship("ItemExercicio", back_populates="ficha", cascade="all, delete-orphan")

class ItemExercicio(Base):
    __tablename__ = "itens_exercicio"
    id = Column(Integer, primary_key=True, index=True)
    ficha_id = Column(Integer, ForeignKey("fichas_treino.id"))
    exercicio_referencia_id = Column(String, nullable=False)
    series = Column(Integer)
    repeticoes = Column(String) # Mudado para String para aceitar "12-15" ou "Até a falha"
    carga = Column(String)      # Mudado para String para aceitar "10kg" ou "20lb"
    observacao = Column(String, nullable=True)
    
    ficha = relationship("FichaTreino", back_populates="exercicios")

class Rotina(Base):
    __tablename__ = "rotinas"
    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    title = Column(String)
    criado_por_professor = Column(Boolean, default=False)
    status = Column(String, default="pending")
    data_criacao = Column(DateTime, default=datetime.utcnow)

    aluno = relationship("Aluno", back_populates="rotinas")

class Seguidor(Base):
    __tablename__ = "seguidores"
    id = Column(Integer, primary_key=True, index=True)
    seguidor_id = Column(Integer, ForeignKey("usuarios.id"))
    seguido_id = Column(Integer, ForeignKey("usuarios.id"))
    status = Column(String, default="PENDENTE")
    data_criacao = Column(DateTime, default=datetime.utcnow)
    
    seguidor = relationship("Usuario", foreign_keys=[seguidor_id], back_populates="seguindo")
    seguido = relationship("Usuario", foreign_keys=[seguido_id], back_populates="seguidores")

class Notificacao(Base):
    __tablename__ = "notificacoes"
    id = Column(Integer, primary_key=True, index=True)
    destinatario_id = Column(Integer, ForeignKey("usuarios.id"), index=True)
    remetente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    titulo = Column(String, nullable=False)
    mensagem = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    status = Column(String, default="PENDENTE")
    referencia_id = Column(Integer, nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    
    destinatario = relationship("Usuario", foreign_keys=[destinatario_id], back_populates="notificacoes_recebidas")
    remetente = relationship("Usuario", foreign_keys=[remetente_id])

class TreinoRealizado(Base):
    __tablename__ = "treinos_realizados"

    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"))
    titulo = Column(String)
    data_fim = Column(DateTime, default=datetime.utcnow)
    duracao_minutos = Column(Integer)
    volume_total = Column(Float, default=0)

    # Relacionamentos
    aluno = relationship("Aluno", back_populates="historico_treinos")
    # Link com os exercícios específicos deste treino
    exercicios = relationship("ExercicioRealizado", back_populates="treino", cascade="all, delete-orphan")

class ExercicioRealizado(Base):
    __tablename__ = "exercicios_realizados"

    id = Column(Integer, primary_key=True, index=True)
    treino_id = Column(Integer, ForeignKey("treinos_realizados.id"))
    nome = Column(String) # Ex: "3_4_Sit-Up"
    series = Column(Integer)
    repeticoes = Column(String)
    carga = Column(String)

    # Relacionamento reverso
    treino = relationship("TreinoRealizado", back_populates="exercicios")