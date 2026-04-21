from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, cast, Date
from typing import List, Optional
from database import SessionLocal, engine
from datetime import date, datetime
import models, schemas, auth

# --- INICIALIZAÇÃO E MIGRAÇÕES ---
models.Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    # 1. Garante que as colunas novas existam no perfil e nas fichas
    conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR"))
    conn.execute(text("ALTER TABLE fichas_treino ADD COLUMN IF NOT EXISTS criado_por_professor BOOLEAN DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE fichas_treino ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    
    # 2. CONVERSÃO DE TIPOS (O segredo para aceitar IDs como '3_4_Sit-Up')
    # Transformamos repeticoes e carga em texto
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN repeticoes TYPE VARCHAR USING repeticoes::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN carga TYPE VARCHAR USING carga::varchar"))
    
    # Transformamos o ID de referência em texto (essencial para a API de exercícios)
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN exercicio_referencia_id TYPE VARCHAR USING exercicio_referencia_id::varchar"))

app = FastAPI(title="API Self-Fit - Integrada")

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

def disparar_notificacao(db: Session, dest_id: int, rem_id: Optional[int], titulo: str, msg: str, tipo: str, ref_id: Optional[int] = None):
    nova = models.Notificacao(
        destinatario_id=dest_id, remetente_id=rem_id, 
        titulo=titulo, mensagem=msg, tipo=tipo, referencia_id=ref_id
    )
    db.add(nova)

@app.get("/")
def home():
    return {"status": "Online"}

# --- 1. USUÁRIOS E AUTH ---
@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    db_usuario = models.Usuario(
        nome=usuario.nome, email=usuario.email, senha=auth.gerar_hash_senha(usuario.senha),
        data_nascimento=usuario.data_nascimento, tipo_perfil=usuario.tipo_perfil
    )
    db.add(db_usuario); db.commit(); db.refresh(db_usuario)
    return db_usuario

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not u or not auth.verificar_senha(form_data.password, u.senha):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return {"access_token": auth.criar_token_acesso({"sub": u.email, "perfil": u.tipo_perfil}), "token_type": "bearer"}

@app.get("/usuarios/me", response_model=schemas.UsuarioResponse)
def ler_me(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

@app.put("/usuarios/me", response_model=schemas.UsuarioResponse)
def atualizar_me(dados: schemas.UsuarioPerfilUpdate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if dados.nome: u.nome = dados.nome
    if dados.foto_perfil is not None: u.foto_perfil = dados.foto_perfil
    db.commit(); db.refresh(u); return u

# --- 2. ALUNO PERFIL E EVOLUÇÃO ---
@app.post("/alunos")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.perfil_aluno: return u.perfil_aluno
    db_a = models.Aluno(usuario_id=u.id, objetivo=perfil.objetivo)
    db.add(db_a); db.commit(); db.refresh(db_a); return db_a

@app.get("/alunos/me", response_model=schemas.AlunoMeResponse)
def ler_perfil_aluno_me(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.tipo_perfil != "STUDENT" or not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")
    return u.perfil_aluno

# --- 3. SISTEMA DE TREINOS (O CORAÇÃO DA IMPLEMENTAÇÃO) ---

@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(
    ficha_dados: schemas.FichaTreinoCreate, 
    email: str = Depends(auth.obter_usuario_atual), 
    db: Session = Depends(get_db)
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")

    # Cria o cabeçalho da Ficha de Treino
    nova_ficha = models.FichaTreino(
        aluno_id=u.perfil_aluno.id, 
        titulo=ficha_dados.titulo, 
        criado_por_professor=(u.tipo_perfil == "TEACHER"),
        status="ativa"
    )
    db.add(nova_ficha)
    db.flush() # Gera o ID da ficha para os itens usarem

    # Adiciona cada exercício mapeando corretamente os campos
    for ex in ficha_dados.exercicios:
        item = models.ItemExercicio(
            ficha_id=nova_ficha.id,
            exercicio_referencia_id=ex.exercicio_referencia_id,
            series=ex.series,
            repeticoes=ex.repeticoes,
            carga=ex.carga,
            observacao=ex.observacao
        )
        db.add(item)
    
    db.commit()
    db.refresh(nova_ficha)
    return nova_ficha

@app.get("/alunos/minhas-rotinas", response_model=List[schemas.FichaTreinoResponse])
def listar_minhas_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        return []
    
    # Busca todas as fichas do aluno, carregando os exercícios (joinedload) para evitar erros de lazy loading
    return db.query(models.FichaTreino).options(joinedload(models.FichaTreino.exercicios)).filter(
        models.FichaTreino.aluno_id == u.perfil_aluno.id
    ).order_by(models.FichaTreino.data_criacao.desc()).all()

# --- 4. EVOLUÇÃO E SOCIAL (Fidelidade ao projeto Natália) ---
@app.get("/aluno/feed-amigos", response_model=List[schemas.FeedItem])
def feed(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    seguidos = db.query(models.Seguidor.seguido_id).filter(models.Seguidor.seguidor_id == meu_u.id, models.Seguidor.status == "ACEITO").all()
    ids = [s[0] for s in seguidos]
    if not ids: return []
    atividades = db.query(models.Evolucao).join(models.Aluno).filter(models.Aluno.usuario_id.in_(ids)).order_by(models.Evolucao.data_registro.desc()).limit(20).all()
    return [{"id": a.id, "tipo": "EVOLUCAO", "usuario_nome": a.aluno.usuario.nome, "usuario_foto": a.aluno.usuario.foto_perfil, "titulo": "Nova marca!", "descricao": f"Peso: {a.peso}kg", "data": a.data_registro} for a in atividades]

@app.get("/notificacoes", response_model=List[schemas.NotificacaoResponse])
def listar_notif(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    return db.query(models.Notificacao).options(joinedload(models.Notificacao.remetente)).filter(
        models.Notificacao.destinatario_id == u.id, 
        models.Notificacao.status == "PENDENTE"
    ).order_by(models.Notificacao.data_criacao.desc()).all()

# --- 5. ROTA DE EXCLUSÃO (CORRIGIDA) ---

@app.delete("/fichas/{ficha_id}", status_code=204)
def deletar_ficha(
    ficha_id: int, 
    db: Session = Depends(get_db), 
    email: str = Depends(auth.obter_usuario_atual) # Usando o mesmo padrão das outras rotas
):
    # 1. Busca o usuário para saber o ID do aluno
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")

    # 2. Busca a ficha garantindo que ela pertence ao aluno logado (Segurança!)
    ficha = db.query(models.FichaTreino).filter(
        models.FichaTreino.id == ficha_id, 
        models.FichaTreino.aluno_id == u.perfil_aluno.id
    ).first()

    if not ficha:
        raise HTTPException(status_code=404, detail="Rotina não encontrada ou acesso negado.")

    # 3. Deleta do banco
    db.delete(ficha)
    db.commit()
    return None