from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, cast, Date
from typing import List, Optional
from database import SessionLocal, engine
from datetime import date, datetime
import models, schemas, auth

# --- INICIALIZAÇÃO ---
models.Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR"))

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

# --- 2. ALUNO PERFIL E ROTINAS ---
@app.post("/alunos")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.perfil_aluno: return u.perfil_aluno
    db_a = models.Aluno(usuario_id=u.id, objetivo=perfil.objetivo)
    db.add(db_a); db.commit(); db.refresh(db_a); return db_a

@app.get("/alunos/minhas-rotinas", response_model=List[schemas.RotinaResponse])
def listar_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    return u.perfil_aluno.rotinas if u.perfil_aluno else []

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def meu_historico_evolucao(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.tipo_perfil != "STUDENT" or not u.perfil_aluno:
        return []
    return (
        db.query(models.Evolucao)
        .filter(models.Evolucao.aluno_id == u.perfil_aluno.id)
        .order_by(models.Evolucao.data_registro.asc())
        .all()
    )

@app.post("/alunos/evolucao", response_model=schemas.EvolucaoResponse)
def registrar_evolucao(
    dados: schemas.EvolucaoCreate,
    email: str = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db),
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.tipo_perfil != "STUDENT":
        raise HTTPException(status_code=403, detail="Apenas alunos podem registrar medidas.")
    if not u.perfil_aluno:
        raise HTTPException(status_code=400, detail="Crie seu perfil de aluno antes de registrar medidas.")
    aluno = u.perfil_aluno
    hoje = datetime.utcnow().date()
    existente_hoje = (
        db.query(models.Evolucao)
        .filter(
            models.Evolucao.aluno_id == aluno.id,
            cast(models.Evolucao.data_registro, Date) == hoje,
        )
        .first()
    )
    if existente_hoje:
        existente_hoje.peso = dados.peso
        existente_hoje.porcentagem_gordura = dados.porcentagem_gordura
        existente_hoje.massa_muscular = dados.massa_muscular
        db.commit()
        db.refresh(existente_hoje)
        return existente_hoje
    nova = models.Evolucao(
        aluno_id=aluno.id,
        peso=dados.peso,
        porcentagem_gordura=dados.porcentagem_gordura,
        massa_muscular=dados.massa_muscular,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

# --- 3. SOCIAL E FEED ---
@app.get("/usuarios/descobrir", response_model=List[schemas.UsuarioResponse])
def descobrir(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    status_ativos = ("PENDENTE", "ACEITO")
    ids_ja_ligados = {row[0] for row in db.query(models.Seguidor.seguido_id).filter(
        models.Seguidor.seguidor_id == meu_u.id,
        models.Seguidor.status.in_(status_ativos),
    ).all()}
    ids_ja_ligados.update(
        row[0]
        for row in db.query(models.Seguidor.seguidor_id).filter(
            models.Seguidor.seguido_id == meu_u.id,
            models.Seguidor.status.in_(status_ativos),
        ).all()
    )
    q = db.query(models.Usuario).filter(
        models.Usuario.id != meu_u.id,
        models.Usuario.tipo_perfil == "STUDENT",
    )
    if ids_ja_ligados:
        q = q.filter(~models.Usuario.id.in_(ids_ja_ligados))
    return q.all()

@app.post("/usuarios/seguir/{destino_id}")
def seguir(destino_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if destino_id == meu_u.id:
        raise HTTPException(status_code=400, detail="Não é possível seguir a si mesmo.")
    ja_existe = db.query(models.Seguidor).filter(
        models.Seguidor.seguidor_id == meu_u.id,
        models.Seguidor.seguido_id == destino_id,
        models.Seguidor.status.in_(("PENDENTE", "ACEITO")),
    ).first()
    if ja_existe:
        raise HTTPException(status_code=400, detail="Solicitação ou vínculo já existente com este usuário.")
    novo = models.Seguidor(seguidor_id=meu_u.id, seguido_id=destino_id)
    db.add(novo); db.flush()
    disparar_notificacao(db, destino_id, meu_u.id, "Novo Seguidor", f"{meu_u.nome} começou a seguir você.", "SOLICITACAO_SEGUIR", novo.id)
    db.commit(); return {"status": "ok"}

@app.get("/aluno/feed-amigos", response_model=List[schemas.FeedItem])
def feed(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    seguidos = db.query(models.Seguidor.seguido_id).filter(models.Seguidor.seguidor_id == meu_u.id, models.Seguidor.status == "ACEITO").all()
    ids = [s[0] for s in seguidos]
    if not ids: return []
    atividades = db.query(models.Evolucao).join(models.Aluno).filter(models.Aluno.usuario_id.in_(ids)).order_by(models.Evolucao.data_registro.desc()).limit(20).all()
    return [{"id": a.id, "tipo": "EVOLUCAO", "usuario_nome": a.aluno.usuario.nome, "usuario_foto": a.aluno.usuario.foto_perfil, "titulo": "Nova marca!", "descricao": f"Peso: {a.peso}kg", "data": a.data_registro} for a in atividades]

# --- 4. NOTIFICAÇÕES ---
@app.get("/notificacoes", response_model=List[schemas.NotificacaoResponse])
def listar_notif(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    rows = (
        db.query(models.Notificacao)
        .options(joinedload(models.Notificacao.remetente))
        .filter(models.Notificacao.destinatario_id == u.id, models.Notificacao.status == "PENDENTE")
        .order_by(models.Notificacao.data_criacao.desc())
        .all()
    )
    return [
        schemas.NotificacaoResponse(
            id=n.id,
            titulo=n.titulo,
            mensagem=n.mensagem,
            tipo=n.tipo,
            status=n.status,
            data_criacao=n.data_criacao,
            remetente_id=n.remetente_id,
            referencia_id=n.referencia_id,
            remetente_foto=n.remetente.foto_perfil if n.remetente else None,
        )
        for n in rows
    ]

@app.get("/notificacoes/contagem")
def contar_notif(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    c = db.query(models.Notificacao).filter(models.Notificacao.destinatario_id == u.id, models.Notificacao.status == "PENDENTE").count()
    return {"contagem": c}

@app.put("/notificacoes/{notificacao_id}/responder")
def responder_notif(notificacao_id: int, dados: schemas.RespostaNotificacao, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    notif = db.query(models.Notificacao).filter(models.Notificacao.id == notificacao_id, models.Notificacao.destinatario_id == u.id).first()
    if notif.tipo == "SOLICITACAO_SEGUIR":
        reg = db.query(models.Seguidor).filter(models.Seguidor.id == notif.referencia_id).first()
        if dados.acao == "ACEITAR": reg.status = "ACEITO"; notif.status = "ACEITO"
        else: db.delete(reg); notif.status = "REJEITADO"
    db.commit(); return {"status": "ok"}