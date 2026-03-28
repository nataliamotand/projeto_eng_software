from pydantic import BaseModel
from typing import List, Optional

# --- ESQUEMAS PARA USUÁRIOS ---
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    tipo_perfil: str

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    tipo_perfil: str

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA ALUNOS ---
class AlunoCreate(BaseModel):
    usuario_id: int
    peso: float
    altura: float
    objetivo: str

class AlunoResponse(BaseModel):
    id: int
    usuario_id: int
    peso: float
    altura: float
    objetivo: str

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA EXERCÍCIOS ---
class ExercicioCreate(BaseModel):
    nome: str
    grupo_muscular: str
    series: int
    repeticoes_base: int
    carga_estimada: float

class ExercicioResponse(ExercicioCreate):
    id: int
    ficha_id: int

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA FICHAS DE TREINO ---
class FichaTreinoCreate(BaseModel):
    aluno_id: int
    titulo: str
    status: Optional[str] = "ativa"

class FichaTreinoResponse(FichaTreinoCreate):
    id: int
    exercicios: List[ExercicioResponse] = []

    class Config:
        from_attributes = True