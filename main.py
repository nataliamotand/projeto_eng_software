from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from database import engine, SessionLocal

# 1. RECUPERANDO A NOSSA MÁGICA: Conecta no Neon e garante que as tabelas existem
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Self-Fit", description="Sistema de gerenciamento de treinos")

# 2. FUNÇÃO VITAL: Abre a "porta" do banco de dados a cada requisição e fecha depois
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def raiz():
    return {"mensagem": "API do Self-Fit conectada ao PostgreSQL na nuvem!"}

# --- ROTAS DE USUÁRIOS ---

@app.post("/usuarios", response_model=schemas.UsuarioResponse, summary="Cadastrar um novo usuário")
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    
    # 1. Verifica no banco se o email já existe ANTES de tentar salvar
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if usuario_existente:
        # Se existir, devolvemos um Erro 400 amigável e paramos por aqui
        raise HTTPException(status_code=400, detail="Este email já está cadastrado no Self-Fit.")
    
    # 2. Se não existir, criamos o usuário normalmente
    db_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=usuario.senha,
        tipo_perfil=usuario.tipo_perfil
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@app.get("/usuarios", response_model=list[schemas.UsuarioResponse], summary="Listar todos os usuários")
def listar_usuarios(db: Session = Depends(get_db)):
    # Faz um SELECT * FROM usuarios
    usuarios = db.query(models.Usuario).all()
    return usuarios

# --- ROTAS DE ALUNOS ---

@app.post("/alunos", response_model=schemas.AlunoResponse, summary="Cadastrar detalhes do aluno")
def cadastrar_aluno(aluno: schemas.AlunoCreate, db: Session = Depends(get_db)):
    # O **aluno.model_dump() é um atalho que desempacota o JSON direto no Model
    db_aluno = models.Aluno(**aluno.model_dump())
    db.add(db_aluno)
    db.commit()
    db.refresh(db_aluno)
    return db_aluno

@app.get("/alunos", response_model=list[schemas.AlunoResponse], summary="Listar todos os alunos")
def listar_alunos(db: Session = Depends(get_db)):
    alunos = db.query(models.Aluno).all()
    return alunos