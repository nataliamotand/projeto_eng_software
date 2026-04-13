from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database import SessionLocal, engine
import models, schemas, auth

# Cria as tabelas no Neon (agora com a tabela de rotinas incluída)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Self-Fit")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- USUÁRIOS E AUTH ---

@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    
    senha_hash = auth.gerar_hash_senha(usuario.senha)
    db_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=senha_hash,
        data_nascimento=usuario.data_nascimento,
        tipo_perfil=usuario.tipo_perfil
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@app.get("/usuarios/me", response_model=schemas.UsuarioResponse)
def ler_usuario_atual(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not u or not auth.verificar_senha(form_data.password, u.senha):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    return {
        "access_token": auth.criar_token_acesso({"sub": u.email, "perfil": u.tipo_perfil}), 
        "token_type": "bearer"
    }

# --- PERFIS ---

@app.post("/alunos")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    # Evita duplicidade de perfil
    if u.perfil_aluno:
        return u.perfil_aluno
    db_a = models.Aluno(usuario_id=u.id, objetivo=perfil.objetivo)
    db.add(db_a); db.commit(); db.refresh(db_a)
    return db_a

# --- EVOLUÇÃO ---

@app.post("/alunos/evolucao")
def registrar_evolucao(dados: schemas.EvolucaoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = u.perfil_aluno
    if not aluno:
        raise HTTPException(status_code=400, detail="Perfil de aluno não encontrado.")
    
    hoje = date.today()
    registro_hoje = db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == aluno.id,
        models.Evolucao.data_registro == hoje
    ).first()

    if registro_hoje:
        registro_hoje.peso = dados.peso
        registro_hoje.porcentagem_gordura = dados.porcentagem_gordura
        registro_hoje.massa_muscular = dados.massa_muscular
    else:
        novo_registro = models.Evolucao(aluno_id=aluno.id, data_registro=hoje, **dados.model_dump())
        db.add(novo_registro)
    
    db.commit()
    return {"message": "Medida processada com sucesso!"}

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def ver_historico(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        return []
    return u.perfil_aluno.historico_evolucao

# --- ROTINAS (Onde estava o bug) ---

@app.get("/alunos/minhas-rotinas", response_model=List[schemas.RotinaResponse])
def listar_minhas_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not user or not user.perfil_aluno:
        return []
    
    # Busca todas as rotinas (pessoais e do professor)
    return user.perfil_aluno.rotinas

# --- FEEDS (Placeholders) ---

@app.get("/aluno/feed-amigos")
def feed_aluno(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    return []