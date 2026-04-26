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
    # Migrações essenciais para o sistema de Fichas e Perfil
    conn.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR"))
    conn.execute(text("ALTER TABLE fichas_treino ADD COLUMN IF NOT EXISTS criado_por_professor BOOLEAN DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE fichas_treino ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    
    # Conversão para VARCHAR para suportar IDs como '3_4_Sit-Up' e marcas flexíveis
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN repeticoes TYPE VARCHAR USING repeticoes::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN carga TYPE VARCHAR USING carga::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN exercicio_referencia_id TYPE VARCHAR USING exercicio_referencia_id::varchar"))

app = FastAPI(title="API Self-Fit - Sistema Total Integrado")

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
    user = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # 1. Contagem de Seguidores/Seguindo
    seguidores = db.query(models.Seguidor).filter(models.Seguidor.seguido_id == user.id, models.Seguidor.status == "ACEITO").count()
    seguindo = db.query(models.Seguidor).filter(models.Seguidor.seguidor_id == user.id, models.Seguidor.status == "ACEITO").count()
    
    # 2. LÓGICA DE TREINAMENTOS: Conta registos na tabela treinos_realizados
    treinos = 0
    if user.perfil_aluno:
        treinos = db.query(models.TreinoRealizado).filter(
            models.TreinoRealizado.aluno_id == user.perfil_aluno.id
        ).count()
    
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "tipo_perfil": user.tipo_perfil,
        "foto_perfil": user.foto_perfil,
        "seguidores_count": seguidores,
        "seguindo_count": seguindo,
        "treinos_count": treinos # Agora dinâmico!
    }


@app.put("/usuarios/me", response_model=schemas.UsuarioResponse)
def atualizar_me(dados: schemas.UsuarioPerfilUpdate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if dados.nome: u.nome = dados.nome
    if dados.foto_perfil is not None: u.foto_perfil = dados.foto_perfil
    db.commit(); db.refresh(u); return u

# --- 2. GESTÃO DE FICHAS (CRUD COMPLETO) ---
@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(ficha_dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    nova_ficha = models.FichaTreino(aluno_id=u.perfil_aluno.id, titulo=ficha_dados.titulo, criado_por_professor=(u.tipo_perfil == "TEACHER"))
    db.add(nova_ficha); db.flush()
    for ex in ficha_dados.exercicios:
        db.add(models.ItemExercicio(ficha_id=nova_ficha.id, **ex.dict()))
    db.commit(); db.refresh(nova_ficha); return nova_ficha

@app.get("/fichas/{ficha_id}", response_model=schemas.FichaTreinoResponse)
def obter_detalhes_ficha(ficha_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    ficha = db.query(models.FichaTreino).options(joinedload(models.FichaTreino.exercicios)).filter(models.FichaTreino.id == ficha_id).first()
    if not ficha: raise HTTPException(status_code=404, detail="Rotina não encontrada.")
    return ficha

@app.get("/alunos/minhas-rotinas", response_model=List[schemas.FichaTreinoResponse])
def listar_minhas_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno: return []
    return db.query(models.FichaTreino).options(joinedload(models.FichaTreino.exercicios)).filter(models.FichaTreino.aluno_id == u.perfil_aluno.id).order_by(models.FichaTreino.data_criacao.desc()).all()

@app.put("/fichas/{ficha_id}", response_model=schemas.FichaTreinoResponse)
def atualizar_ficha(ficha_id: int, ficha_dados: schemas.FichaTreinoCreate, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    db_ficha = db.query(models.FichaTreino).filter(models.FichaTreino.id == ficha_id).first()
    db_ficha.titulo = ficha_dados.titulo
    db.query(models.ItemExercicio).filter(models.ItemExercicio.ficha_id == ficha_id).delete()
    for ex in ficha_dados.exercicios:
        db.add(models.ItemExercicio(ficha_id=ficha_id, **ex.dict()))
    db.commit(); db.refresh(db_ficha); return db_ficha

@app.delete("/fichas/{ficha_id}", status_code=204)
def deletar_ficha(ficha_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    ficha = db.query(models.FichaTreino).filter(models.FichaTreino.id == ficha_id, models.FichaTreino.aluno_id == u.perfil_aluno.id).first()
    if not ficha: raise HTTPException(status_code=404, detail="Não encontrado.")
    db.delete(ficha); db.commit(); return None

# --- 3. EXECUÇÃO E HISTÓRICO DE TREINOS ---
@app.post("/alunos/finalizar-treino")
def finalizar_treino(dados: schemas.TreinoFinalizadoCreate, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    novo_treino = models.TreinoRealizado(aluno_id=u.perfil_aluno.id, titulo=dados.titulo, duracao_minutos=dados.duracao_minutos, volume_total=dados.volume_total, data_fim=datetime.utcnow())
    db.add(novo_treino); db.flush()
    for ex in dados.exercicios:
        db.add(models.ExercicioRealizado(treino_id=novo_treino.id, **ex.dict()))
    db.commit(); return {"status": "sucesso", "id": novo_treino.id}

# --- 2.5 EVOLUÇÃO CORPORAL (ADICIONAR DE VOLTA) ---

@app.get("/alunos/meu-historico", response_model=List[schemas.EvolucaoResponse])
def meu_historico_evolucao(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u.perfil_aluno: return []
    # Busca os registros de peso/medidas para o gráfico
    return db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == u.perfil_aluno.id
    ).order_by(models.Evolucao.data_registro.asc()).all()

@app.post("/alunos/evolucao", response_model=schemas.EvolucaoResponse)
def registrar_evolucao(dados: schemas.EvolucaoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = u.perfil_aluno
    hoje = datetime.utcnow().date()
    
    # Busca se já existe um registo para hoje
    existente = db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == aluno.id, 
        cast(models.Evolucao.data_registro, Date) == hoje
    ).first()
    
    if existente:
        # ATUALIZAÇÃO INTELIGENTE: Só altera se o valor enviado for válido (>0)
        # Se o aluno preencher apenas o peso, os campos de gordura e músculo no banco são PRESERVADOS.
        if dados.peso and dados.peso > 0: 
            existente.peso = dados.peso
        if dados.porcentagem_gordura and dados.porcentagem_gordura > 0: 
            existente.porcentagem_gordura = dados.porcentagem_gordura
        if dados.massa_muscular and dados.massa_muscular > 0: 
            existente.massa_muscular = dados.massa_muscular
            
        db.commit()
        db.refresh(existente)
        return existente
        
    # LÓGICA DE HERANÇA (Para novos dias):
    # Se o registo de hoje é novo, buscamos a última medida no histórico.
    ultima = db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == aluno.id
    ).order_by(models.Evolucao.data_registro.desc()).first()
    
    # Se o aluno não enviou gordura ou músculo hoje, herdamos o valor anterior.
    # Isso evita que o gráfico caia para zero em dias de preenchimento parcial.
    gordura = dados.porcentagem_gordura if dados.porcentagem_gordura and dados.porcentagem_gordura > 0 else (ultima.porcentagem_gordura if ultima else 0)
    musculo = dados.massa_muscular if dados.massa_muscular and dados.massa_muscular > 0 else (ultima.massa_muscular if ultima else 0)

    nova = models.Evolucao(
        aluno_id=aluno.id, 
        peso=dados.peso, 
        porcentagem_gordura=gordura, 
        massa_muscular=musculo
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

@app.get("/alunos/historico-treinos", response_model=List[schemas.TreinoFinalizadoResponse])
def listar_historico_treinos(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u.perfil_aluno: return []
    return db.query(models.TreinoRealizado).options(joinedload(models.TreinoRealizado.exercicios)).filter(models.TreinoRealizado.aluno_id == u.perfil_aluno.id).order_by(models.TreinoRealizado.data_fim.desc()).all()

# --- 4. SOCIAL, DESCUBRIR E FEED ---
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
def feed_agregado(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    meu_u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    seguidos = [s[0] for s in db.query(models.Seguidor.seguido_id).filter(models.Seguidor.seguidor_id == meu_u.id, models.Seguidor.status == "ACEITO").all()]
    ids = seguidos + [meu_u.id]

    evos = db.query(models.Evolucao).join(models.Aluno).filter(models.Aluno.usuario_id.in_(ids)).all()
    treinos = db.query(models.TreinoRealizado).join(models.Aluno).filter(models.Aluno.usuario_id.in_(ids)).all()
    
    res = []
    for e in evos: res.append({"id": f"evo_{e.id}", "tipo": "EVOLUCAO", "usuario_nome": e.aluno.usuario.nome, "usuario_foto": e.aluno.usuario.foto_perfil, "titulo": "Novo peso!", "descricao": f"Bateu {e.peso}kg", "data": e.data_registro})
    for t in treinos: res.append({"id": f"tr_{t.id}", "tipo": "TREINO", "usuario_nome": t.aluno.usuario.nome, "usuario_foto": t.aluno.usuario.foto_perfil, "titulo": f"Treino: {t.titulo}", "descricao": f"Volume: {t.volume_total}kg", "data": t.data_fim})
    
    res.sort(key=lambda x: x['data'], reverse=True)
    return res[:30]

# --- 5. NOTIFICAÇÕES (VERSÃO CARLOS COM FOTO) ---
@app.get("/notificacoes", response_model=List[schemas.NotificacaoResponse])
def listar_notif(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    rows = db.query(models.Notificacao).options(joinedload(models.Notificacao.remetente)).filter(models.Notificacao.destinatario_id == u.id, models.Notificacao.status == "PENDENTE").all()
    return [schemas.NotificacaoResponse(id=n.id, titulo=n.titulo, mensagem=n.mensagem, tipo=n.tipo, status=n.status, data_criacao=n.data_criacao, remetente_id=n.remetente_id, referencia_id=n.referencia_id, remetente_foto=n.remetente.foto_perfil if n.remetente else None) for n in rows]

@app.get("/notificacoes/contagem")
def contar_notif(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    return {"contagem": db.query(models.Notificacao).filter(models.Notificacao.destinatario_id == u.id, models.Notificacao.status == "PENDENTE").count()}

@app.put("/notificacoes/{notificacao_id}/responder")
def responder_notif(notificacao_id: int, dados: schemas.RespostaNotificacao, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    notif = db.query(models.Notificacao).filter(models.Notificacao.id == notificacao_id, models.Notificacao.destinatario_id == u.id).first()
    if notif and notif.tipo == "SOLICITACAO_SEGUIR":
        reg = db.query(models.Seguidor).filter(models.Seguidor.id == notif.referencia_id).first()
        if dados.acao == "ACEITAR": reg.status = "ACEITO"; notif.status = "ACEITO"
        else: db.delete(reg); notif.status = "REJEITADO"
    db.commit(); return {"status": "ok"}

# --- 6. PROFESSOR - GESTÃO DE ALUNOS (PEDRINHO INTEGRADO) ---
@app.get("/professor/alunos")
def listar_meus_alunos(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    alunos = db.query(models.Aluno).filter(models.Aluno.professor_id == u.perfil_professor.id).all()
    return [{"id": a.id, "nome": a.usuario.nome, "email": a.usuario.email, "username": a.usuario.email.split("@")[0], "foto_perfil": a.usuario.foto_perfil, "objetivo": a.objetivo} for a in alunos]

@app.get("/professor/descobrir-alunos")
def descobrir_alunos(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    alunos = db.query(models.Aluno).filter((models.Aluno.professor_id == None) | (models.Aluno.professor_id != u.perfil_professor.id)).all()
    return [{"id": a.id, "nome": a.usuario.nome, "foto_perfil": a.usuario.foto_perfil, "objetivo": a.objetivo} for a in alunos]

@app.put("/professor/vincular-aluno/{aluno_id}")
def vincular_aluno(aluno_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(models.Aluno.id == aluno_id).first()
    aluno.professor_id = u.perfil_professor.id
    db.commit(); return {"status": "ok"}

@app.get("/professor/aluno/{aluno_id}/historico", response_model=List[schemas.TreinoFinalizadoResponse])
def ver_historico_aluno_prof(aluno_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    # Professor auditando o aluno
    return db.query(models.TreinoRealizado).options(joinedload(models.TreinoRealizado.exercicios)).filter(models.TreinoRealizado.aluno_id == aluno_id).order_by(models.TreinoRealizado.data_fim.desc()).all()

# No main.py, na seção de Professor:

@app.get("/professor/aluno/{aluno_id}/perfil")
def obter_perfil_aluno_para_professor(aluno_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    # Garante que o professor só veja alunos vinculados a ele
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(models.Aluno.id == aluno_id, models.Aluno.professor_id == u.perfil_professor.id).first()
    
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado ou não vinculado.")
        
    return {
        "id": aluno.id,
        "nome": aluno.usuario.nome,
        "email": aluno.usuario.email,
        "objetivo": aluno.objetivo,
        "foto_perfil": aluno.usuario.foto_perfil,
        "data_nascimento": aluno.usuario.data_nascimento
    }

@app.get("/professor/feed-alunos", response_model=List[schemas.FeedItem])
def feed_professor(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    # 1. Localiza o professor logado
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_professor:
        raise HTTPException(status_code=400, detail="Acesso negado: Perfil de professor não encontrado.")

    prof_id = u.perfil_professor.id

    # 2. Pega os IDs de usuário de todos os alunos vinculados a este professor
    alunos_vinculados = db.query(models.Aluno).filter(models.Aluno.professor_id == prof_id).all()
    ids_usuarios_alunos = [a.usuario_id for a in alunos_vinculados]

    if not ids_usuarios_alunos:
        return []

    # 3. Busca Evoluções e Treinos realizados por esses alunos
    atividades_evo = db.query(models.Evolucao).join(models.Aluno).filter(
        models.Aluno.usuario_id.in_(ids_usuarios_alunos)
    ).order_by(models.Evolucao.data_registro.desc()).limit(15).all()

    atividades_treino = db.query(models.TreinoRealizado).join(models.Aluno).filter(
        models.Aluno.usuario_id.in_(ids_usuarios_alunos)
    ).order_by(models.TreinoRealizado.data_fim.desc()).limit(15).all()

    # 4. Unifica e formata para o padrão do FeedItem
    lista_feed = []

    for a in atividades_evo:
        lista_feed.append({
            "id": f"pe_ev_{a.id}",
            "tipo": "EVOLUCAO",
            "usuario_nome": a.aluno.usuario.nome,
            "usuario_foto": a.aluno.usuario.foto_perfil,
            "titulo": "Atualização de Aluno",
            "descricao": f"Registrou evolução de {a.peso}kg.",
            "data": a.data_registro
        })

    for t in atividades_treino:
        lista_feed.append({
            "id": f"pe_tr_{t.id}",
            "tipo": "TREINO",
            "usuario_nome": t.aluno.usuario.nome,
            "usuario_foto": t.aluno.usuario.foto_perfil,
            "titulo": f"Treino Concluído: {t.titulo}",
            "descricao": f"Levantou {t.volume_total}kg.",
            "data": t.data_fim
        })

    # 5. Ordena por data (mais recente primeiro)
    lista_feed.sort(key=lambda x: x['data'], reverse=True)

    return lista_feed[:30]