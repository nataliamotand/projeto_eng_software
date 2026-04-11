from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal, engine
import models
import schemas
import auth

# Cria as tabelas no banco de dados Neon
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
    # Verifica se o email já existe
    email_existe = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if email_existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")

    # Criptografa a senha e salva
    senha_criptografada = auth.gerar_hash_senha(usuario.senha)
    
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
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()

    if not usuario or not auth.verificar_senha(form_data.password, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Cria o token
    token = auth.criar_token_acesso(dados={"sub": usuario.email, "perfil": usuario.tipo_perfil})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/perfil", summary="Área VIP: Ver meu próprio perfil")
def ler_perfil_logado(email_usuario: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email_usuario).first()
    return {
        "mensagem": "Você está na Área VIP!",
        "dados": {
            "nome": usuario.nome,
            "email": usuario.email,
            "perfil": usuario.tipo_perfil
        }
    }


# --- ROTAS DE COMPLEMENTO DE PERFIL ---

@app.post("/professores", summary="Completar perfil de Professor")
def criar_perfil_professor(perfil: schemas.ProfessorCreate, email_usuario: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email_usuario).first()
    
    if usuario.tipo_perfil != "TEACHER":
        raise HTTPException(status_code=403, detail="Apenas professores podem criar este perfil.")
    
    if usuario.perfil_professor:
        raise HTTPException(status_code=400, detail="Você já possui um perfil de professor ativo.")

    db_professor = models.Professor(usuario_id=usuario.id, cref=perfil.cref)
    db.add(db_professor)
    db.commit()
    db.refresh(db_professor)
    return db_professor

@app.post("/alunos", summary="Completar perfil de Aluno")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email_usuario: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email_usuario).first()
    
    if usuario.tipo_perfil != "STUDENT":
        raise HTTPException(status_code=403, detail="Apenas alunos podem criar este perfil.")
        
    if usuario.perfil_aluno:
        raise HTTPException(status_code=400, detail="Você já possui um perfil de aluno ativo.")

    db_aluno = models.Aluno(
        usuario_id=usuario.id,
        peso=perfil.peso,
        altura=perfil.altura,
        objetivo=perfil.objetivo
    )
    db.add(db_aluno)
    db.commit()
    db.refresh(db_aluno)
    return db_aluno


# --- A ROTA DO VÍNCULO MÁGICO ---

@app.put("/alunos/vincular-professor/{professor_id}", summary="Vincular Aluno logado a um Professor")
def vincular_professor(professor_id: int, email_usuario: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email_usuario).first()
    aluno = usuario.perfil_aluno

    if not aluno:
        raise HTTPException(status_code=404, detail="Complete seu perfil de corpo (peso/altura) primeiro.")

    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="O ID desse Professor não existe.")

    aluno.professor_id = professor.id
    db.commit()
    
    return {"mensagem": f"Sucesso! Você agora é aluno do professor {professor.usuario.nome}."}