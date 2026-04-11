from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal, engine
import models
import schemas
import auth

# Apaga as tabelas antigas (CUIDADO: SÓ USE EM DESENVOLVIMENTO)
#models.Base.metadata.drop_all(bind=engine)

# Cria as tabelas novas com as colunas atualizadas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Self-Fit", description="Sistema de gerenciamento de treinos")

# --- PASSE LIVRE PARA O FRONT-END (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROTAS DE AUTENTICAÇÃO E USUÁRIO ---

@app.post("/usuarios", response_model=schemas.UsuarioResponse, summary="Cadastrar um novo usuário")
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Verifica se o email já existe
    email_existe = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if email_existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")

    # 2. Criptografa a senha ANTES de salvar
    senha_criptografada = auth.gerar_hash_senha(usuario.senha)

    # 3. Salva no banco
    db_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=senha_criptografada,
        data_nascimento=usuario.data_nascimento,
        tipo_perfil=usuario.tipo_perfil
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@app.post("/login", summary="Fazer login e pegar o Token JWT")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # O OAuth2 usa 'username' por padrão, mas para nós, username = email
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()

    # Se não achar o usuário ou a senha estiver errada
    if not usuario or not auth.verificar_senha(form_data.password, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Se deu tudo certo, cria o crachá com o email e o tipo de perfil
    token = auth.criar_token_acesso(dados={"sub": usuario.email, "perfil": usuario.tipo_perfil})
    return {"access_token": token, "token_type": "bearer"}

# (Rotas de Alunos, Professores e Exercícios entrarão aqui nas próximas etapas)