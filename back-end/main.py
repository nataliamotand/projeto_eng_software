from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date  # Adicionado: Necessário para as medidas
from database import SessionLocal, engine
import models, schemas, auth

# Cria as tabelas no Neon caso não existam
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Self-Fit")

# Configuração de CORS para permitir que o Front-end acesse a API
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Dependência para abrir/fechar conexão com o banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROTAS DE USUÁRIO E AUTH ---

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
def ler_usuario_atual(
    email: str = Depends(auth.obter_usuario_atual), 
    db: Session = Depends(get_db)
):
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

# --- ROTAS DE PERFIL (ALUNO / PROFESSOR) ---

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

# --- ROTAS DE EVOLUÇÃO E MÉTRICAS ---

@app.post("/alunos/evolucao")
def registrar_evolucao(dados: schemas.EvolucaoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = u.perfil_aluno
    
    hoje = date.today()
    
    # Verifica se já existe registro hoje
    registro_hoje = db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == aluno.id,
        models.Evolucao.data_registro == hoje
    ).first()

    if registro_hoje:
        # Se já existe, apenas atualiza os valores (limite de 1 entrada por data)
        registro_hoje.peso = dados.peso
        registro_hoje.porcentagem_gordura = dados.porcentagem_gordura
        registro_hoje.massa_muscular = dados.massa_muscular
    else:
        # Se não existe, cria um novo
        novo_registro = models.Evolucao(
            aluno_id=aluno.id,
            data_registro=hoje,
            **dados.dict()
        )
        db.add(novo_registro)
    
    db.commit()
    return {"message": "Medida processada com sucesso!"}

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def ver_historico(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()

    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Se o cara é STUDENT no tipo_perfil, mas não tem a linha na tabela 'alunos'
    if u.perfil_aluno is None:
        raise HTTPException(
            status_code=400, 
            detail="Perfil de aluno não completado. Você precisa definir seu objetivo primeiro."
        )

    return u.perfil_aluno.historico_evolucao

# --- ROTAS DE TREINOS E FICHAS ---

@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(ficha_dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u_professor = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u_professor.perfil_professor:
        raise HTTPException(status_code=403, detail="Apenas professores podem criar fichas.")

    nova_ficha = models.FichaTreino(aluno_id=ficha_dados.aluno_id, titulo=ficha_dados.titulo)
    db.add(nova_ficha); db.flush()

    for ex in ficha_dados.exercicios:
        item = models.ItemExercicio(ficha_id=nova_ficha.id, **ex.model_dump())
        db.add(item)
    
    db.commit(); db.refresh(nova_ficha)
    return nova_ficha

@app.get("/alunos/minhas-fichas", response_model=List[schemas.FichaTreinoResponse])
def ver_minhas_fichas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    return u.perfil_aluno.fichas

# --- ROTAS DO FEED (Necessárias para a Home não dar 404) ---

@app.get("/professor/feed-alunos")
def feed_professor(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    # Por enquanto retorna vazio para a Home carregar
    return []

@app.get("/aluno/feed-amigos")
def feed_aluno(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    # Por enquanto retorna vazio para a Home carregar
    return []