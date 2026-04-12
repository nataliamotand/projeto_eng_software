from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import date, datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=False)
    tipo_perfil = Column(String, nullable=False) # 'STUDENT' ou 'TEACHER'

    # Relacionamentos de Perfil
    perfil_aluno = relationship("Aluno", back_populates="usuario", uselist=False)
    perfil_professor = relationship("Professor", back_populates="usuario", uselist=False)
    
    # Relacionamentos de Notificação e Seguidores
    notificacoes_recebidas = relationship("Notificacao", foreign_keys="[Notificacao.destinatario_id]", back_populates="destinatario")
    seguidores = relationship("Seguidor", foreign_keys="[Seguidor.seguido_id]", back_populates="seguido")
    seguindo = relationship("Seguidor", foreign_keys="[Seguidor.seguidor_id]", back_populates="seguidor")

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
    criado_por_professor = Column(Boolean, default=False) # Nova flag para sua regra de negócio

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

# --- NOVAS TABELAS PARA NOTIFICAÇÕES E SOCIAL ---

class Seguidor(Base):
    __tablename__ = "seguidores"
    id = Column(Integer, primary_key=True, index=True)
    seguidor_id = Column(Integer, ForeignKey("usuarios.id"))
    seguido_id = Column(Integer, ForeignKey("usuarios.id"))
    status = Column(String, default="PENDENTE") # PENDENTE, ACEITO
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
    
    # Tipos: 'SOLICITACAO_SEGUIR', 'VINCULO_PROFESSOR', 'NOVA_ROTINA', 'SOLICITACAO_ROTINA'
    tipo = Column(String, nullable=False)
    
    # Status: 'PENDENTE', 'LIDO', 'ACEITO', 'REJEITADO'
    status = Column(String, default="PENDENTE")
    
    # ID de referência (ex: ID da ficha de treino ou ID do pedido de seguir)
    referencia_id = Column(Integer, nullable=True)
    
    data_criacao = Column(DateTime, default=datetime.utcnow)

    destinatario = relationship("Usuario", foreign_keys=[destinatario_id], back_populates="notificacoes_recebidas")
    remetente = relationship("Usuario", foreign_keys=[remetente_id])