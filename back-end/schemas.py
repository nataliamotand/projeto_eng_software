from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    data_nascimento: date
    tipo_perfil: str

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    tipo_perfil: str
    class Config: from_attributes = True

class ProfessorCreate(BaseModel):
    cref: str

class AlunoCreate(BaseModel):
    objetivo: str

class EvolucaoCreate(BaseModel):
    peso: float
    porcentagem_gordura: Optional[float] = None
    massa_muscular: Optional[float] = None

class EvolucaoResponse(BaseModel):
    id: int
    data_registro: date
    peso: float
    porcentagem_gordura: Optional[float]
    massa_muscular: Optional[float]
    class Config: from_attributes = True

class ItemExercicioCreate(BaseModel):
    exercicio_referencia_id: int
    series: int
    repeticoes: int
    carga: float
    observacao: Optional[str] = None

class FichaTreinoCreate(BaseModel):
    aluno_id: int
    titulo: str
    exercicios: List[ItemExercicioCreate]

class ItemExercicioResponse(BaseModel):
    id: int
    exercicio_referencia_id: int
    series: int
    repeticoes: int
    carga: float
    observacao: Optional[str]
    class Config: from_attributes = True

class FichaTreinoResponse(BaseModel):
    id: int
    titulo: str
    status: str
    criado_por_professor: bool
    exercicios: List[ItemExercicioResponse]
    class Config: from_attributes = True

class NotificacaoResponse(BaseModel):
    id: int
    titulo: str
    mensagem: str
    tipo: str
    status: str
    data_criacao: datetime
    remetente_id: Optional[int]
    referencia_id: Optional[int]
    class Config: from_attributes = True