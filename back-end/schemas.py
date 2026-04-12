from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- USUÁRIOS ---
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

    class Config:
        from_attributes = True # ESSA LINHA É OBRIGATÓRIA

# --- PERFIS ---
class ProfessorCreate(BaseModel):
    cref: str

class AlunoCreate(BaseModel):
    objetivo: str

# --- EVOLUÇÃO (O "Array" da Gabi) ---
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
    class Config:
        from_attributes = True

class AlunoResponse(BaseModel):
    id: int
    objetivo: str
    historico_evolucao: List[EvolucaoResponse] = []
    class Config:
        from_attributes = True


class ItemExercicioCreate(BaseModel):
    exercicio_referencia_id: int
    series: int
    repeticoes: int
    carga: float
    observacao: Optional[str] = None

class FichaTreinoCreate(BaseModel):
    aluno_id: int
    titulo: str
    exercicios: List[ItemExercicioCreate] # Uma lista de exercícios já na criação

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
    exercicios: List[ItemExercicioResponse]
    class Config: from_attributes = True