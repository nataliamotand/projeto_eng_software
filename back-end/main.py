from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal, engine
from datetime import date
import models, schemas, auth

# Garante que as novas tabelas sejam criadas no Neon
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Self-Fit")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# Função utilitária para disparar notificações silenciosamente
def disparar_notificacao(db: Session, dest_id: int, rem_id: Optional[int], titulo: str, msg: str, tipo: str, ref_id: Optional[int] = None):
    nova = models.Notificacao(destinatario_id=dest_id, remetente_id=rem_id, titulo=titulo, mensagem=msg, tipo=tipo, referencia_id=ref_id)
    db.add(nova)

# --- USUÁRIOS E LOGIN ---
@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def cadastrar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    senha_hash = auth.gerar_hash_senha(usuario.senha)
    db_usuario = models.Usuario(nome=usuario.nome, email=usuario.email, senha=senha_hash, data_nascimento=usuario.data_nascimento, tipo_perfil=usuario.tipo_perfil)
    db.add(db_usuario); db.commit(); db.refresh(db_usuario)
    return db_usuario

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not u or not auth.verificar_senha(form_data.password, u.senha):
        raise HTTPException(status_code=401, detail="Incorreto")
    return {"access_token": auth.criar_token_acesso({"sub": u.email, "perfil": u.tipo_perfil}), "token_type": "bearer"}

# --- NOTIFICAÇÕES E SOCIAL ---
@app.get("/notificacoes", response_model=List[schemas.NotificacaoResponse])
def listar_notificacoes(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    notifs = db.query(models.Notificacao).filter(models.Notificacao.destinatario_id == u.id).all()
    for n in notifs:
        if n.tipo in ['VINCULO_PROFESSOR', 'NOVA_ROTINA'] and n.status == 'PENDENTE':
            n.status = 'LIDO'
    db.commit()
    return notifs

@app.post("/usuarios/seguir/{destino_id}")
def solicitar_seguir(destino_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    novo_s = models.Seguidor(seguidor_id=meu_u.id, seguido_id=destino_id)
    db.add(novo_s); db.flush()
    disparar_notificacao(db, destino_id, meu_u.id, "Pedido para Seguir", f"{meu_u.nome} quer seguir você.", "SOLICITACAO_SEGUIR", novo_s.id)
    db.commit()
    return {"mensagem": "Solicitação enviada com sucesso"}

# --- FICHAS E TREINOS ---
@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(ficha_dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u_prof = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u_prof.perfil_professor:
        raise HTTPException(status_code=403, detail="Apenas professores podem criar fichas.")
    
    nova_ficha = models.FichaTreino(aluno_id=ficha_dados.aluno_id, titulo=ficha_dados.titulo, criado_por_professor=True)
    db.add(nova_ficha); db.flush()
    
    for ex in ficha_dados.exercicios:
        db.add(models.ItemExercicio(ficha_id=nova_ficha.id, **ex.dict()))
    
    aluno = db.query(models.Aluno).filter(models.Aluno.id == ficha_dados.aluno_id).first()
    disparar_notificacao(db, aluno.usuario_id, u_prof.id, "Novo Treino!", f"Treino {nova_ficha.titulo} disponível.", "NOVA_ROTINA", nova_ficha.id)
    
    db.commit(); db.refresh(nova_ficha)
    return nova_ficha

@app.put("/alunos/vincular-professor/{professor_id}")
def vincular(professor_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    p = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    u.perfil_aluno.professor_id = p.id
    disparar_notificacao(db, p.usuario_id, u.id, "Novo Aluno", f"{u.nome} vinculou-se a você.", "VINCULO_PROFESSOR")
    db.commit(); return {"mensagem": "Vinculado!"}

# --- PERFIS E EVOLUÇÃO ---
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

@app.post("/alunos/evolucao", response_model=schemas.EvolucaoResponse)
def registrar_medidas(dados: schemas.EvolucaoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno_id = u.perfil_aluno.id
    hoje = date.today()
    medida_existente = db.query(models.Evolucao).filter(models.Evolucao.aluno_id == aluno_id, models.Evolucao.data_registro == hoje).first()
    if medida_existente:
        medida_existente.peso = dados.peso
        medida_existente.porcentagem_gordura = dados.porcentagem_gordura
        medida_existente.massa_muscular = dados.massa_muscular
        db.commit(); db.refresh(medida_existente); return medida_existente
    nova = models.Evolucao(aluno_id=aluno_id, **dados.dict())
    db.add(nova); db.commit(); db.refresh(nova); return nova

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def ver_historico(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    return u.perfil_aluno.historico_evolucao

@app.get("/alunos/minhas-fichas", response_model=List[schemas.FichaTreinoResponse])
def ver_minhas_fichas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    return u.perfil_aluno.fichas