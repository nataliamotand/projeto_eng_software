from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- ESQUEMAS DE USUÁRIO (Criação de Conta) ---
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

# --- ESQUEMAS DE PERFIS (Completar o Perfil) ---
class ProfessorCreate(BaseModel):
    cref: str

class AlunoCreate(BaseModel):
    peso: float
    altura: float
    objetivo: str

# (E aqui embaixo continua com aqueles esquemas de Exercicio e FichaTreino que te mandei antes...)