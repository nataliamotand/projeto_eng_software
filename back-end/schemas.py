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
        from_attributes = True 

# --- PERFIS ---
class ProfessorCreate(BaseModel):
    cref: str

class AlunoCreate(BaseModel):
    objetivo: str

# --- EVOLUÇÃO ---
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

# --- ALUNO COMPLETO ---
class AlunoResponse(BaseModel):
    id: int
    objetivo: str
    professor_id: Optional[int] = None # Adicionado para bater com o novo model
    historico_evolucao: List[EvolucaoResponse] = []
    
    class Config:
        from_attributes = True

# --- FICHAS E EXERCÍCIOS ---
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
    
    class Config: 
        from_attributes = True

class FichaTreinoResponse(BaseModel):
    id: int
    titulo: str
    status: str
    exercicios: List[ItemExercicioResponse]
    
    class Config: 
        from_attributes = True

# --- ROTINAS ---
class RotinaBase(BaseModel):
    title: str
    criado_por_professor: bool = False
    status: str = "pending"

class RotinaCreate(RotinaBase):
    pass

class RotinaResponse(RotinaBase): # Renomeado para consistência
    id: int
    aluno_id: int

    class Config:
        from_attributes = True