from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal, engine
import models, schemas, auth

#models.Base.metadata.drop_all(bind=engine) # USE UMA VEZ PARA RESETAR O NEON
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Self-Fit")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal(); 
    try: yield db
    finally: db.close()

@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    senha_hash = auth.gerar_hash_senha(usuario.senha)
    db_usuario = models.Usuario(**usuario.dict(exclude={'senha'}), senha=senha_hash)
    db.add(db_usuario); db.commit(); db.refresh(db_usuario)
    return db_usuario

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not u or not auth.verificar_senha(form_data.password, u.senha):
        raise HTTPException(status_code=401, detail="Incorreto")
    return {"access_token": auth.criar_token_acesso({"sub": u.email, "perfil": u.tipo_perfil}), "token_type": "bearer"}

@app.post("/professores")
def criar_perfil_professor(perfil: schemas.ProfessorCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    db_p = models.Professor(usuario_id=u.id, cref=perfil.cref)
    db.add(db_p); db.commit(); return db_p

@app.post("/alunos")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    db_a = models.Aluno(usuario_id=u.id, objetivo=perfil.objetivo)
    db.add(db_a); db.commit(); return db_a

@app.post("/alunos/evolucao", response_model=schemas.EvolucaoResponse, summary="Registrar ou atualizar medidas do dia")
def registrar_medidas(dados: schemas.EvolucaoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno_id = u.perfil_aluno.id
    hoje = date.today()

    # 1. Verificar se já existe uma medição hoje
    medida_existente = db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == aluno_id,
        models.Evolucao.data_registro == hoje
    ).first()

    if medida_existente:
        # 2. Se já existe, apenas atualizamos os valores (o famoso "Upsert")
        medida_existente.peso = dados.peso
        medida_existente.porcentagem_gordura = dados.porcentagem_gordura
        medida_existente.massa_muscular = dados.massa_muscular
        db.commit()
        db.refresh(medida_existente)
        return medida_existente
    
    # 3. Se não existe, criamos uma nova
    nova = models.Evolucao(aluno_id=aluno_id, **dados.dict())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def ver_historico(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    return u.perfil_aluno.historico_evolucao

@app.put("/alunos/vincular-professor/{professor_id}")
def vincular(professor_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    p = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    u.perfil_aluno.professor_id = p.id
    db.commit(); return {"mensagem": "Vinculado!"}