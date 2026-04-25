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
    # Colunas de Perfil e Fichas
    conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR"))
    conn.execute(text("ALTER TABLE fichas_treino ADD COLUMN IF NOT EXISTS criado_por_professor BOOLEAN DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE fichas_treino ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    
    # Conversão de tipos para Itens de Exercício (Suporte a IDs alfanuméricos como '3_4_Sit-Up')
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN repeticoes TYPE VARCHAR USING repeticoes::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN carga TYPE VARCHAR USING carga::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN exercicio_referencia_id TYPE VARCHAR USING exercicio_referencia_id::varchar"))

app = FastAPI(title="API Self-Fit - Sistema Integrado")

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
        titulo=titulo, mensagem=msg, tipo=tipo, status="PENDENTE", referencia_id=ref_id
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

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def meu_historico_evolucao(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u.perfil_aluno: return []
    return db.query(models.Evolucao).filter(models.Evolucao.aluno_id == u.perfil_aluno.id).order_by(models.Evolucao.data_registro.asc()).all()

@app.post("/alunos/evolucao", response_model=schemas.EvolucaoResponse)
def registrar_evolucao(dados: schemas.EvolucaoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = u.perfil_aluno
    hoje = datetime.utcnow().date()
    existente = db.query(models.Evolucao).filter(models.Evolucao.aluno_id == aluno.id, cast(models.Evolucao.data_registro, Date) == hoje).first()
    if existente:
        existente.peso, existente.porcentagem_gordura, existente.massa_muscular = dados.peso, dados.porcentagem_gordura, dados.massa_muscular
        db.commit(); db.refresh(existente); return existente
    nova = models.Evolucao(aluno_id=aluno.id, **dados.dict())
    db.add(nova); db.commit(); db.refresh(nova); return nova

# --- 3. SISTEMA DE TREINOS (FICHAS) ---
@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(ficha_dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    nova_ficha = models.FichaTreino(aluno_id=u.perfil_aluno.id, titulo=ficha_dados.titulo, criado_por_professor=(u.tipo_perfil == "TEACHER"))
    db.add(nova_ficha); db.flush()
    for ex in ficha_dados.exercicios:
        item = models.ItemExercicio(ficha_id=nova_ficha.id, **ex.dict())
        db.add(item)
    db.commit(); db.refresh(nova_ficha); return nova_ficha

@app.get("/alunos/minhas-rotinas", response_model=List[schemas.FichaTreinoResponse])
def listar_minhas_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno: return []
    return db.query(models.FichaTreino).options(joinedload(models.FichaTreino.exercicios)).filter(models.FichaTreino.aluno_id == u.perfil_aluno.id).order_by(models.FichaTreino.data_criacao.desc()).all()

@app.delete("/fichas/{ficha_id}", status_code=204)
def deletar_ficha(ficha_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    ficha = db.query(models.FichaTreino).filter(models.FichaTreino.id == ficha_id, models.FichaTreino.aluno_id == u.perfil_aluno.id).first()
    if not ficha: raise HTTPException(status_code=404, detail="Não encontrado.")
    db.delete(ficha); db.commit(); return None

# --- 4. SOCIAL E DESCUBRIR ---
@app.get("/usuarios/descobrir", response_model=List[schemas.UsuarioResponse])
def descobrir(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    status_ativos = ("PENDENTE", "ACEITO")
    ids_ja_ligados = {row[0] for row in db.query(models.Seguidor.seguido_id).filter(models.Seguidor.seguidor_id == meu_u.id, models.Seguidor.status.in_(status_ativos)).all()}
    q = db.query(models.Usuario).filter(models.Usuario.id != meu_u.id, models.Usuario.tipo_perfil == "STUDENT")
    if ids_ja_ligados: q = q.filter(~models.Usuario.id.in_(ids_ja_ligados))
    return q.all()

@app.post("/usuarios/seguir/{destino_id}")
def seguir(destino_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    novo = models.Seguidor(seguidor_id=meu_u.id, seguido_id=destino_id)
    db.add(novo); db.flush()
    disparar_notificacao(db, destino_id, meu_u.id, "Novo Seguidor", f"{meu_u.nome} começou a seguir você.", "SOLICITACAO_SEGUIR", novo.id)
    db.commit(); return {"status": "ok"}

@app.get("/aluno/feed-amigos", response_model=List[schemas.FeedItem])
def feed(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # 1. Pega os IDs de quem o Carlos segue
    seguidos = db.query(models.Seguidor.seguido_id).filter(
        models.Seguidor.seguidor_id == meu_u.id, 
        models.Seguidor.status == "ACEITO"
    ).all()
    
    ids_interesse = [s[0] for s in seguidos]
    ids_interesse.append(meu_u.id) # Adiciona o próprio Carlos para ele ver suas postagens

    # 2. Busca Evoluções (Medidas/Peso)
    atividades_evo = db.query(models.Evolucao).join(models.Aluno).filter(
        models.Aluno.usuario_id.in_(ids_interesse)
    ).order_by(models.Evolucao.data_registro.desc()).limit(15).all()

    # 3. Busca Treinos Realizados (A novidade!)
    atividades_treino = db.query(models.TreinoRealizado).join(models.Aluno).filter(
        models.Aluno.usuario_id.in_(ids_interesse)
    ).order_by(models.TreinoRealizado.data_fim.desc()).limit(15).all()

    # 4. Formata e unifica tudo no padrão FeedItem
    lista_feed = []

    for a in atividades_evo:
        lista_feed.append({
            "id": f"evo_{a.id}", # ID único para o Front
            "tipo": "EVOLUCAO",
            "usuario_nome": a.aluno.usuario.nome,
            "usuario_foto": a.aluno.usuario.foto_perfil,
            "titulo": "Atualizou o shape!",
            "descricao": f"Nova marca de {a.peso}kg atingida.",
            "data": a.data_registro
        })

    for t in atividades_treino:
        lista_feed.append({
            "id": f"tr_{t.id}",
            "tipo": "TREINO",
            "usuario_nome": t.aluno.usuario.nome,
            "usuario_foto": t.aluno.usuario.foto_perfil,
            "titulo": f"Treino concluído: {t.titulo}",
            "descricao": f"Levantou {t.volume_total}kg em {t.duracao_minutos} minutos. Brabo! 💪",
            "data": t.data_fim
        })

    # 5. Ordena a lista final pela data (mais recente primeiro)
    lista_feed.sort(key=lambda x: x['data'], reverse=True)

    return lista_feed[:30] # Retorna os 30 eventos mais recentes
# --- 5. NOTIFICAÇÕES ---
@app.get("/notificacoes", response_model=List[schemas.NotificacaoResponse])
def listar_notif(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    rows = db.query(models.Notificacao).options(joinedload(models.Notificacao.remetente)).filter(models.Notificacao.destinatario_id == u.id, models.Notificacao.status == "PENDENTE").all()
    return [schemas.NotificacaoResponse(id=n.id, titulo=n.titulo, mensagem=n.mensagem, tipo=n.tipo, status=n.status, data_criacao=n.data_criacao, remetente_id=n.remetente_id, referencia_id=n.referencia_id, remetente_foto=n.remetente.foto_perfil if n.remetente else None) for n in rows]
@app.get("/notificacoes/contagem")
def contar_notificacoes_pendentes(
    email: str = Depends(auth.obter_usuario_atual), 
    db: Session = Depends(get_db)
):
    # 1. Busca o usuário logado
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    if not u:
        return {"contagem": 0}

    # 2. Conta quantas notificações PENDENTES ele tem
    # Corrigido: filtramos pelo destinatario_id ser o ID do Carlos
    c = db.query(models.Notificacao).filter(
        models.Notificacao.destinatario_id == u.id, 
        models.Notificacao.status == "PENDENTE"
    ).count()

    return {"contagem": c}

@app.put("/notificacoes/{notificacao_id}/responder")
def responder_notif(notificacao_id: int, dados: schemas.RespostaNotificacao, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    notif = db.query(models.Notificacao).filter(models.Notificacao.id == notificacao_id, models.Notificacao.destinatario_id == u.id).first()
    if notif and notif.tipo == "SOLICITACAO_SEGUIR":
        reg = db.query(models.Seguidor).filter(models.Seguidor.id == notif.referencia_id).first()
        if dados.acao == "ACEITAR": reg.status = "ACEITO"; notif.status = "ACEITO"
        else: db.delete(reg); notif.status = "REJEITADO"
    db.commit(); return {"status": "ok"}

@app.get("/fichas/{ficha_id}", response_model=schemas.FichaTreinoResponse)
def obter_detalhes_ficha(
    ficha_id: int, 
    db: Session = Depends(get_db), 
    email: str = Depends(auth.obter_usuario_atual)
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # Busca a ficha e já traz os exercícios (joinedload)
    ficha = db.query(models.FichaTreino).options(
        joinedload(models.FichaTreino.exercicios)
    ).filter(
        models.FichaTreino.id == ficha_id, 
        models.FichaTreino.aluno_id == u.perfil_aluno.id
    ).first()

    if not ficha:
        raise HTTPException(status_code=404, detail="Rotina não encontrada.")
    
    return ficha

@app.get("/alunos/historico-treinos", response_model=List[schemas.TreinoFinalizadoResponse])
def listar_historico_treinos(
    email: str = Depends(auth.obter_usuario_atual), 
    db: Session = Depends(get_db)
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        return []
    
    # Busca os treinos realizados pelo aluno, ordenando pelos mais recentes
    historico = db.query(models.TreinoRealizado).filter(
        models.TreinoRealizado.aluno_id == u.perfil_aluno.id
    ).order_by(models.TreinoRealizado.data_fim.desc()).all()
    
    return historico

@app.post("/alunos/finalizar-treino")
def finalizar_treino(
    dados: schemas.TreinoFinalizadoCreate, 
    db: Session = Depends(get_db), 
    email: str = Depends(auth.obter_usuario_atual)
):
    # 1. Localiza o usuário e o aluno
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")

    # 2. Cria o registro principal do treino concluído
    novo_treino = models.TreinoRealizado(
        aluno_id=u.perfil_aluno.id,
        titulo=dados.titulo,
        duracao_minutos=dados.duracao_minutos,
        volume_total=dados.volume_total,
        data_fim=datetime.utcnow()
    )
    db.add(novo_treino)
    db.flush() # Gera o ID do treino para os exercícios usarem

    # 3. Salva cada exercício que foi feito (Itens do histórico)
    for ex in dados.exercicios:
        item = models.ExercicioRealizado(
            treino_id=novo_treino.id,
            nome=ex.nome,
            series=ex.series,
            repeticoes=ex.repeticoes,
            carga=ex.carga
        )
        db.add(item)

    db.commit()
    return {"status": "sucesso", "id": novo_treino.id}

@app.put("/fichas/{ficha_id}", response_model=schemas.FichaTreinoResponse)
def atualizar_ficha(
    ficha_id: int, 
    ficha_dados: schemas.FichaTreinoCreate, 
    db: Session = Depends(get_db), 
    email: str = Depends(auth.obter_usuario_atual)
):
    # 1. Verifica se o usuário/aluno existe
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # 2. Busca a ficha garantindo que ela pertence ao aluno (Segurança!)
    db_ficha = db.query(models.FichaTreino).filter(
        models.FichaTreino.id == ficha_id, 
        models.FichaTreino.aluno_id == u.perfil_aluno.id
    ).first()

    if not db_ficha:
        raise HTTPException(status_code=404, detail="Rotina não encontrada.")

    # 3. Atualiza o título
    db_ficha.titulo = ficha_dados.titulo

    # 4. Remove os exercícios antigos para reinserir os novos editados
    db.query(models.ItemExercicio).filter(models.ItemExercicio.ficha_id == ficha_id).delete()

    # 5. Adiciona os novos itens
    for ex in ficha_dados.exercicios:
        item = models.ItemExercicio(
            ficha_id=ficha_id,
            exercicio_referencia_id=ex.exercicio_referencia_id,
            series=ex.series,
            repeticoes=ex.repeticoes,
            carga=ex.carga,
            observacao=ex.observacao
        )
        db.add(item)

    db.commit()
    db.refresh(db_ficha)
    return db_ficha