from pydantic import BaseModel

# 1. Esquema para CRIAR um usuário
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    tipo_perfil: str

# 2. Esquema para DEVOLVER um usuário
class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    tipo_perfil: str

    class Config:
        from_attributes = True 