from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal, engine
from datetime import date
import models, schemas, auth

# Garante a criação de todas as tabelas (incluindo as novas da Natália e sua Rotina)
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

# --- FUNÇÃO UTILITÁRIA (Natália) ---
def disparar_notificacao(db: Session, dest_id: int, rem_id: Optional[int], titulo: str, msg: str, tipo: str, ref_id: Optional[int] = None):
    nova = models.Notificacao(
        destinatario_id=dest_id, 
        remetente_id=rem_id, 
        titulo=titulo, 
        mensagem=msg, 
        tipo=tipo, 
        referencia_id=ref_id
    )
    db.add(nova)

# --- USUÁRIOS E AUTH (Sua base com GET /me) ---

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

# --- SOCIAL E NOTIFICAÇÕES (Integração Natália) ---

@app.get("/notificacoes", response_model=List[schemas.NotificacaoResponse])
def listar_notificacoes(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # Adicionamos o filtro para trazer apenas o status 'PENDENTE'
    # Assim, quando você aceita (status vira 'ACEITO'), ela some do GET
    notificacoes = db.query(models.Notificacao).filter(
        models.Notificacao.destinatario_id == user.id,
        models.Notificacao.status == "PENDENTE" 
    ).order_by(models.Notificacao.data_criacao.desc()).all()
    
    return notificacoes

@app.put("/notificacoes/{notificacao_id}/responder")
def responder_notificacao(notificacao_id: int, dados: schemas.RespostaNotificacao, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    notif = db.query(models.Notificacao).filter(models.Notificacao.id == notificacao_id, models.Notificacao.destinatario_id == u.id).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")
    
    if notif.tipo == "SOLICITACAO_SEGUIR":
        seguidor_reg = db.query(models.Seguidor).filter(models.Seguidor.id == notif.referencia_id).first()
        if seguidor_reg:
            if dados.acao == "ACEITAR":
                seguidor_reg.status = "ACEITO"
                notif.status = "ACEITO"
            else:
                db.delete(seguidor_reg)
                notif.status = "REJEITADO"
    
    db.commit()
    return {"mensagem": f"Solicitação {dados.acao.lower()} com sucesso."}

@app.post("/usuarios/seguir/{destino_id}")
def solicitar_seguir(destino_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    destino_u = db.query(models.Usuario).filter(models.Usuario.id == destino_id).first()

    if not destino_u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if meu_u.id == destino_id:
        raise HTTPException(status_code=400, detail="Você não pode seguir a si mesmo.")
    if meu_u.tipo_perfil == "TEACHER" or destino_u.tipo_perfil == "TEACHER":
        raise HTTPException(status_code=403, detail="Apenas alunos podem seguir outros alunos.")

    novo_s = models.Seguidor(seguidor_id=meu_u.id, seguido_id=destino_id)
    db.add(novo_s); db.flush()
    disparar_notificacao(db, destino_id, meu_u.id, "Pedido para Seguir", f"{meu_u.nome} quer seguir você.", "SOLICITACAO_SEGUIR", novo_s.id)
    db.commit()
    return {"mensagem": "Solicitação enviada"}

# --- EVOLUÇÃO (Sua lógica de Upsert) ---

@app.post("/alunos/evolucao", response_model=schemas.EvolucaoResponse)
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
        registro_hoje = models.Evolucao(aluno_id=aluno.id, data_registro=hoje, **dados.model_dump())
        db.add(registro_hoje)
    
    db.commit()
    db.refresh(registro_hoje)
    return registro_hoje

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def ver_historico(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        return []
    return u.perfil_aluno.historico_evolucao

# --- ROTINAS E FICHAS ---

@app.get("/alunos/minhas-rotinas", response_model=List[schemas.RotinaResponse])
def listar_minhas_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not user or not user.perfil_aluno:
        return []
    return user.perfil_aluno.rotinas

@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(ficha_dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u_prof = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u_prof.perfil_professor:
        raise HTTPException(status_code=403, detail="Apenas professores.")
    
    nova_ficha = models.FichaTreino(aluno_id=ficha_dados.aluno_id, titulo=ficha_dados.titulo, criado_por_professor=True)
    db.add(nova_ficha); db.flush()
    
    for ex in ficha_dados.exercicios:
        db.add(models.ItemExercicio(ficha_id=nova_ficha.id, **ex.model_dump()))
    
    aluno = db.query(models.Aluno).filter(models.Aluno.id == ficha_dados.aluno_id).first()
    disparar_notificacao(db, aluno.usuario_id, u_prof.id, "Novo Treino!", f"Treino {nova_ficha.titulo} disponível.", "NOVA_ROTINA", nova_ficha.id)
    
    db.commit(); db.refresh(nova_ficha)
    return nova_ficha

# --- PERFIS ---

@app.post("/alunos")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.perfil_aluno:
        return u.perfil_aluno
    db_a = models.Aluno(usuario_id=u.id, objetivo=perfil.objetivo)
    db.add(db_a); db.commit(); db.refresh(db_a)
    return db_a

@app.post("/professores")
def criar_perfil_professor(perfil: schemas.ProfessorCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.perfil_professor:
        return u.perfil_professor
    db_p = models.Professor(usuario_id=u.id, cref=perfil.cref)
    db.add(db_p); db.commit(); db.refresh(db_p)
    return db_p

@app.put("/alunos/vincular-professor/{professor_id}")
def vincular(professor_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    p = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")
    u.perfil_aluno.professor_id = p.id
    disparar_notificacao(db, p.usuario_id, u.id, "Novo Aluno", f"{u.nome} vinculou-se a você.", "VINCULO_PROFESSOR")
    db.commit(); return {"mensagem": "Vinculado!"}

@app.get("/usuarios/descobrir", response_model=List[schemas.UsuarioResponse])
def listar_usuarios_para_seguir(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # Busca todos os usuários que:
    # 1. Não sejam eu mesmo
    # 2. Sejam do tipo 'STUDENT' (conforme a regra que definimos)
    usuarios = db.query(models.Usuario).filter(
        models.Usuario.id != meu_u.id,
        models.Usuario.tipo_perfil == "STUDENT"
    ).all()
    
    return usuarios