from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# --- ESQUEMAS PARA USUÁRIOS ---
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    data_nascimento: date # Formato: YYYY-MM-DD
    tipo_perfil: str # 'STUDENT' ou 'TEACHER'

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    data_nascimento: date
    tipo_perfil: str

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA PROFESSORES ---
class ProfessorCreate(BaseModel):
    usuario_id: int
    cref: str

class ProfessorResponse(BaseModel):
    id: int
    usuario_id: int
    cref: str

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA ALUNOS ---
class AlunoCreate(BaseModel):
    usuario_id: int
    professor_id: Optional[int] = None # Opcional no início
    peso: float
    altura: float
    objetivo: str

class AlunoResponse(BaseModel):
    id: int
    usuario_id: int
    professor_id: Optional[int] = None
    peso: float
    altura: float
    objetivo: str

    class Config:
        from_attributes = True

# (Abaixo disso, pode manter os esquemas de FichaTreino e Exercicio que já estavam no arquivo)