from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

# --- 1. USUÁRIOS E AUTH ---
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    data_nascimento: date
    tipo_perfil: str # 'STUDENT' ou 'TEACHER'

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    tipo_perfil: str
    foto_perfil: Optional[str] = None
    class Config: from_attributes = True

class UsuarioPerfilUpdate(BaseModel):
    nome: Optional[str] = None
    foto_perfil: Optional[str] = None

# --- 2. PERFIS ESPECÍFICOS ---
class ProfessorCreate(BaseModel):
    cref: str

class AlunoCreate(BaseModel):
    objetivo: str

class AlunoObjetivoRead(BaseModel):
    objetivo: Optional[str] = None

class AlunoObjetivoUpdate(BaseModel):
    objetivo: str

class AlunoMeResponse(BaseModel):
    id: int
    objetivo: Optional[str] = None
    professor_id: Optional[int] = None
    class Config: from_attributes = True

# --- 3. EVOLUÇÃO E MEDIDAS ---
class EvolucaoCreate(BaseModel):
    peso: float
    porcentagem_gordura: Optional[float] = None
    massa_muscular: Optional[float] = None

class EvolucaoResponse(BaseModel):
    id: int
    aluno_id: int
    data_registro: datetime
    peso: float
    porcentagem_gordura: Optional[float] = None
    massa_muscular: Optional[float] = None
    class Config: from_attributes = True

class AlunoResponse(BaseModel):
    id: int
    objetivo: str
    professor_id: Optional[int] = None
    historico_evolucao: List[EvolucaoResponse] = []
    class Config: from_attributes = True

# --- 4. SISTEMA DE TREINOS (Fichas e Exercícios) ---
class ItemExercicioCreate(BaseModel):
    exercicio_referencia_id: str
    series: int
    # Mudamos para str para aceitar "12-15" ou "Até a falha"
    repeticoes: str 
    # Mudamos para str para aceitar "50kg" ou "10 placas"
    carga: str      
    observacao: Optional[str] = None

class FichaTreinoCreate(BaseModel):
    # aluno_id removido daqui: pegamos pelo Token no Back-end por segurança
    titulo: str
    exercicios: List[ItemExercicioCreate]

class ItemExercicioResponse(BaseModel):
    id: int
    exercicio_referencia_id: str
    series: int
    repeticoes: str
    carga: str
    observacao: Optional[str] = None
    class Config: from_attributes = True

class FichaTreinoResponse(BaseModel):
    id: int
    titulo: str
    status: str
    criado_por_professor: bool
    data_criacao: Optional[datetime] = None
    exercicios: List[ItemExercicioResponse] = []
    class Config: from_attributes = True

# --- 5. ROTINAS (Estrutura de Listagem) ---
class RotinaBase(BaseModel):
    title: str
    criado_por_professor: bool = False
    status: str = "pending"

class RotinaCreate(RotinaBase):
    pass

class RotinaResponse(RotinaBase): 
    id: int
    aluno_id: int
    data_criacao: Optional[datetime] = None
    class Config: from_attributes = True

# --- 6. SOCIAL E NOTIFICAÇÕES (Lógica Natália) ---
class NotificacaoResponse(BaseModel):
    id: int
    titulo: str
    mensagem: str
    tipo: str
    status: str
    data_criacao: datetime
    remetente_id: Optional[int] = None
    referencia_id: Optional[int] = None
    remetente_foto: Optional[str] = None
    class Config: from_attributes = True

class RespostaNotificacao(BaseModel):
    acao: str # 'ACEITAR' ou 'RECUSAR'

class FeedItem(BaseModel):
    id: int
    tipo: str # 'TREINO', 'EVOLUCAO', 'SOCIAL'
    usuario_nome: str
    usuario_foto: Optional[str] = None
    titulo: str
    descricao: str
    data: datetime
    class Config: from_attributes = True

class ExercicioRealizadoBase(BaseModel):
    nome: str
    series: int
    repeticoes: str
    carga: str

class TreinoFinalizadoCreate(BaseModel):
    titulo: str
    duracao_minutos: int
    volume_total: float
    exercicios: List[ExercicioRealizadoBase] # A lista de exercícios feitos

class TreinoFinalizadoResponse(BaseModel):
    id: int
    titulo: str
    data_fim: datetime
    duracao_minutos: int
    volume_total: float
    exercicios: List[ExercicioRealizadoBase] = []

    class Config:
        from_attributes = True