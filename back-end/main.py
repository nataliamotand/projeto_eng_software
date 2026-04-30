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
    
    # Suporte a IDs como '3_4_Sit-Up' e marcas flexíveis (evita erro de tipo no banco)
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN repeticoes TYPE VARCHAR USING repeticoes::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN carga TYPE VARCHAR USING carga::varchar"))
    conn.execute(text("ALTER TABLE itens_exercicio ALTER COLUMN exercicio_referencia_id TYPE VARCHAR USING exercicio_referencia_id::varchar"))

    conn.execute(text("ALTER TABLE professores ADD COLUMN IF NOT EXISTS especialidade VARCHAR"))

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
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    
    # Criar o perfil específico correspondente
    if usuario.tipo_perfil == "STUDENT":
        perfil = models.Aluno(usuario_id=db_usuario.id, objetivo="")
        db.add(perfil)
        db.commit()
    elif usuario.tipo_perfil == "TEACHER":
        perfil = models.Professor(usuario_id=db_usuario.id, cref="")
        db.add(perfil)
        db.commit()
        
    db.refresh(db_usuario)
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
    
    seguidores = db.query(models.Seguidor).filter(models.Seguidor.seguido_id == user.id, models.Seguidor.status == "ACEITO").count()
    seguindo = db.query(models.Seguidor).filter(models.Seguidor.seguidor_id == user.id, models.Seguidor.status == "ACEITO").count()
    
    treinos = 0
    if user.perfil_aluno:
        treinos = db.query(models.TreinoRealizado).filter(models.TreinoRealizado.aluno_id == user.perfil_aluno.id).count()
    
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "tipo_perfil": user.tipo_perfil,
        "foto_perfil": user.foto_perfil,
        "seguidores_count": seguidores,
        "seguindo_count": seguindo,
        "treinos_count": treinos
    }

@app.put("/usuarios/me", response_model=schemas.UsuarioResponse)
def atualizar_me(dados: schemas.UsuarioPerfilUpdate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if dados.nome: u.nome = dados.nome
    if dados.foto_perfil is not None: u.foto_perfil = dados.foto_perfil
    db.commit(); db.refresh(u); return u

# --- 2. GESTÃO DE FICHAS E ALUNOS ---

@app.post("/alunos")
def criar_perfil_aluno(perfil: schemas.AlunoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if u.perfil_aluno: return u.perfil_aluno
    db_a = models.Aluno(usuario_id=u.id, objetivo=perfil.objetivo) # Usando objective do schema
    db.add(db_a); db.commit(); db.refresh(db_a); return db_a

@app.post("/fichas", response_model=schemas.FichaTreinoResponse)
def criar_ficha(ficha_dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()

    if u.tipo_perfil == "TEACHER":
        # Professor criando rotina: precisa informar o aluno_id
        if not ficha_dados.aluno_id:
            raise HTTPException(status_code=400, detail="Professor deve informar o aluno_id ao criar uma rotina.")
        aluno = db.query(models.Aluno).filter(models.Aluno.id == ficha_dados.aluno_id).first()
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado.")
        aluno_id = ficha_dados.aluno_id
    else:
        # Aluno criando sua própria rotina
        if not u.perfil_aluno:
            raise HTTPException(status_code=400, detail="Usuário não possui perfil de aluno.")
        aluno_id = u.perfil_aluno.id

    nova_ficha = models.FichaTreino(aluno_id=aluno_id, titulo=ficha_dados.titulo, criado_por_professor=(u.tipo_perfil == "TEACHER"))
    db.add(nova_ficha); db.flush()
    for ex in ficha_dados.exercicios:
        db.add(models.ItemExercicio(ficha_id=nova_ficha.id, **ex.dict()))
    db.commit(); db.refresh(nova_ficha); return nova_ficha

@app.delete("/fichas/{ficha_id}")
def deletar_ficha(ficha_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    ficha = db.query(models.FichaTreino).filter(models.FichaTreino.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha não encontrada.")
    if not u.perfil_aluno or ficha.aluno_id != u.perfil_aluno.id:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir esta ficha.")
    db.query(models.ItemExercicio).filter(models.ItemExercicio.ficha_id == ficha_id).delete()
    db.delete(ficha)
    db.commit()
    return {"status": "excluído"}


@app.put("/fichas/{ficha_id}", response_model=schemas.FichaTreinoResponse)
def atualizar_ficha(ficha_id: int, dados: schemas.FichaTreinoCreate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    ficha = db.query(models.FichaTreino).filter(models.FichaTreino.id == ficha_id).first()
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha não encontrada.")
    if not u.perfil_aluno or ficha.aluno_id != u.perfil_aluno.id:
        raise HTTPException(status_code=403, detail="Sem permissão para editar esta ficha.")
    # Atualiza título
    ficha.titulo = dados.titulo
    # Substitui todos os exercícios
    db.query(models.ItemExercicio).filter(models.ItemExercicio.ficha_id == ficha_id).delete()
    for ex in dados.exercicios:
        db.add(models.ItemExercicio(ficha_id=ficha_id, **ex.dict()))
    db.commit()
    db.refresh(ficha)
    return ficha

@app.get("/fichas/{ficha_id}", response_model=schemas.FichaTreinoResponse)
def obter_detalhes_ficha(ficha_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    ficha = db.query(models.FichaTreino).options(joinedload(models.FichaTreino.exercicios)).filter(models.FichaTreino.id == ficha_id).first()
    if not ficha: raise HTTPException(status_code=404, detail="Rotina não encontrada.")
    return ficha


@app.get("/alunos/minhas-rotinas", response_model=List[schemas.FichaTreinoResponse])
def listar_minhas_rotinas(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno: return []
    return db.query(models.FichaTreino).options(joinedload(models.FichaTreino.exercicios)).filter(models.FichaTreino.aluno_id == u.perfil_aluno.id).order_by(models.FichaTreino.data_criacao.desc()).all()


@app.put("/alunos/me/objetivo", response_model=schemas.AlunoObjetivoRead)
def atualizar_objetivo(
    dados: schemas.AlunoObjetivoUpdate,
    email: str = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db)
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")
    u.perfil_aluno.objetivo = dados.objetivo
    db.commit()
    db.refresh(u.perfil_aluno)
    return u.perfil_aluno

@app.get("/alunos/me")
def ler_aluno_me(db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(models.Aluno.usuario_id == u.id).first()
    if not aluno: raise HTTPException(status_code=404, detail="Objetivo não encontrado.")
    return aluno

@app.put("/alunos/me/objetivo")
def atualizar_aluno_me(dados: schemas.AlunoObjetivoUpdate, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(models.Aluno.usuario_id == u.id).first()
    if dados.objetivo is not None:
        aluno.objetivo = dados.objetivo
    db.commit(); db.refresh(aluno); return aluno

# --- 3. EXECUÇÃO E HISTÓRICO DE TREINOS ---
@app.post("/alunos/finalizar-treino")
def finalizar_treino(dados: schemas.TreinoFinalizadoCreate, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # Integração: Permite injetar data para testes de gráficos (Natália)
    data_registro = dados.data_fim or datetime.utcnow()
    
    novo_treino = models.TreinoRealizado(
        aluno_id=u.perfil_aluno.id, 
        titulo=dados.titulo, 
        duracao_minutos=dados.duracao_minutos, 
        volume_total=dados.volume_total, 
        data_fim=data_registro
    )
    db.add(novo_treino)
    db.flush()
    for ex in dados.exercicios:
        db.add(models.ExercicioRealizado(treino_id=novo_treino.id, **ex.dict()))
    db.commit()
    return {"status": "sucesso", "id": novo_treino.id}

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

@app.get("/alunos/historico-treinos", response_model=List[schemas.TreinoFinalizadoResponse])
def listar_historico_treinos(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u.perfil_aluno: return []
    return db.query(models.TreinoRealizado).options(joinedload(models.TreinoRealizado.exercicios)).filter(models.TreinoRealizado.aluno_id == u.perfil_aluno.id).order_by(models.TreinoRealizado.data_fim.desc()).all()

@app.get("/alunos/me", response_model=schemas.AlunoMeResponse)
def obter_perfil_aluno(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")
    
    aluno = u.perfil_aluno
    nome_prof = None
    
    # Lógica de busca: Aluno -> Professor -> Usuário -> Nome
    if aluno.professor and aluno.professor.usuario:
        nome_prof = aluno.professor.usuario.nome
        
    return {
        "id": aluno.id,
        "objetivo": aluno.objetivo,
        "professor_id": aluno.professor_id,
        "professor_nome": nome_prof
    }

# --- 4. SOCIAL E FEED ---

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

# --- 5. NOTIFICAÇÕES ---

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

# --- 6. PROFESSOR - GESTÃO E VÍNCULOS ---

@app.post("/professores")
def criar_perfil_professor(
    dados: dict, # Agora aceita o corpo da requisição (JSON)
    email: str = Depends(auth.obter_usuario_atual), 
    db: Session = Depends(get_db)
):
    """Cria o perfil de professor salvando o CREF enviado pelo front"""
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    if u.tipo_perfil != "TEACHER":
        raise HTTPException(status_code=400, detail="Usuário não é um professor.")
        
    if u.perfil_professor: 
        return u.perfil_professor

    # Pega o cref do dicionário enviado pelo front-end
    cref_enviado = dados.get("cref")
    
    # Criamos o perfil com o CREF real
    novo_prof = models.Professor(usuario_id=u.id, cref=cref_enviado)
    
    db.add(novo_prof)
    try:
        db.commit()
        db.refresh(novo_prof)
        return novo_prof
    except Exception as e:
        db.rollback()
        print(f"Erro ao salvar professor: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar dados profissionais do professor.")

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

@app.delete("/professor/desvincular-aluno/{aluno_id}")
def desvincular_aluno(aluno_id: int, email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    """Remove o vínculo entre professor e aluno"""
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(models.Aluno.id == aluno_id, models.Aluno.professor_id == u.perfil_professor.id).first()
    if not aluno: raise HTTPException(status_code=404, detail="Vínculo não encontrado.")
    aluno.professor_id = None
    db.commit(); return {"status": "vínculo removido"}

@app.get("/professor/aluno/{aluno_id}/historico", response_model=List[schemas.TreinoFinalizadoResponse])
def historico_aluno_professor(
    aluno_id: int, 
    db: Session = Depends(get_db), 
    email: str = Depends(auth.obter_usuario_atual)
):
    # 1. Verifica se quem está acessando é o professor vinculado
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(
        models.Aluno.id == aluno_id, 
        models.Aluno.professor_id == u.perfil_professor.id
    ).first()

    if not aluno:
        raise HTTPException(status_code=403, detail="Você não tem permissão para ver o histórico deste aluno.")

    # 2. Busca os treinos concluídos com os exercícios
    historico = db.query(models.TreinoRealizado).options(joinedload(models.TreinoRealizado.exercicios)).filter(
        models.TreinoRealizado.aluno_id == aluno_id
    ).order_by(models.TreinoRealizado.data_fim.desc()).all()

    return historico

@app.get("/professor/aluno/{aluno_id}/perfil")
def obter_perfil_aluno_para_professor(aluno_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(models.Aluno.id == aluno_id, models.Aluno.professor_id == u.perfil_professor.id).first()
    if not aluno: raise HTTPException(status_code=404, detail="Aluno não vinculado.")
    return {"id": aluno.id, "nome": aluno.usuario.nome, "email": aluno.usuario.email, "objetivo": aluno.objetivo, "foto_perfil": aluno.usuario.foto_perfil, "data_nascimento": aluno.usuario.data_nascimento}

@app.get("/professor/feed-alunos", response_model=List[schemas.FeedItem])
def feed_professor(email: str = Depends(auth.obter_usuario_atual), db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    prof_id = u.perfil_professor.id
    alunos = db.query(models.Aluno).filter(models.Aluno.professor_id == prof_id).all()
    ids_usuarios = [a.usuario_id for a in alunos]
    if not ids_usuarios: return []
    evos = db.query(models.Evolucao).join(models.Aluno).filter(models.Aluno.usuario_id.in_(ids_usuarios)).all()
    treinos = db.query(models.TreinoRealizado).join(models.Aluno).filter(models.Aluno.usuario_id.in_(ids_usuarios)).all()
    res = []
    for a in evos: res.append({"id": f"pe_ev_{a.id}", "tipo": "EVOLUCAO", "usuario_nome": a.aluno.usuario.nome, "usuario_foto": a.aluno.usuario.foto_perfil, "titulo": "Evolução do Aluno", "descricao": f"Registrou {a.peso}kg.", "data": a.data_registro})
    for t in treinos: res.append({"id": f"pe_tr_{t.id}", "tipo": "TREINO", "usuario_nome": t.aluno.usuario.nome, "usuario_foto": t.aluno.usuario.foto_perfil, "titulo": f"Treino Concluído: {t.titulo}", "descricao": f"Levantou {t.volume_total}kg.", "data": t.data_fim})
    res.sort(key=lambda x: x['data'], reverse=True)
    return res[:30]

@app.get("/professores/me", response_model=schemas.ProfessorMeResponse)
def obter_perfil_professor(
    email: str = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db)
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_professor:
        raise HTTPException(status_code=404, detail="Perfil de professor não encontrado.")
    return u.perfil_professor

@app.put("/professores/me/especialidade", response_model=schemas.ProfessorMeResponse)
def atualizar_especialidade(
    dados: schemas.ProfessorEspecialidadeUpdate,
    email: str = Depends(auth.obter_usuario_atual),
    db: Session = Depends(get_db)
):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not u or not u.perfil_professor:
        raise HTTPException(status_code=404, detail="Perfil de professor não encontrado.")
    u.perfil_professor.especialidade = dados.especialidade
    db.commit()
    db.refresh(u.perfil_professor)
    return u.perfil_professor

@app.get("/professor/aluno/{aluno_id}/medidas")
def buscar_medidas_aluno(
    aluno_id: int, 
    db: Session = Depends(get_db), 
    email: str = Depends(auth.obter_usuario_atual)
):
    # 1. Validação: Quem está pedindo é o professor do aluno?
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    aluno = db.query(models.Aluno).filter(
        models.Aluno.id == aluno_id, 
        models.Aluno.professor_id == u.perfil_professor.id
    ).first()

    if not aluno:
        raise HTTPException(status_code=403, detail="Acesso não autorizado.")

    # 2. Busca o histórico de evolução
    evolucoes = db.query(models.Evolucao).filter(
        models.Evolucao.aluno_id == aluno_id
    ).order_by(models.Evolucao.data_registro.desc()).all()

    return evolucoes

@app.get("/treinos/detalhes/{treino_id}", response_model=schemas.TreinoFinalizadoResponse)
def obter_detalhes_treino(treino_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    # Correção do 404: Busca detalhes do treino finalizado
    treino = db.query(models.TreinoRealizado).options(joinedload(models.TreinoRealizado.exercicios)).filter(models.TreinoRealizado.id == treino_id).first()
    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    return treino

@app.get("/professor/aluno/{aluno_id}/metricas-performance")
def obter_metricas_performance(aluno_id: int, db: Session = Depends(get_db), email: str = Depends(auth.obter_usuario_atual)):
    u = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    
    # Valida vínculo
    aluno = db.query(models.Aluno).filter(models.Aluno.id == aluno_id, models.Aluno.professor_id == u.perfil_professor.id).first()
    if not aluno:
        raise HTTPException(status_code=403, detail="Acesso negado")

    evolucoes = db.query(models.Evolucao).filter(models.Evolucao.aluno_id == aluno_id).order_by(models.Evolucao.data_registro.asc()).all()
    treinos = db.query(models.TreinoRealizado).filter(models.TreinoRealizado.aluno_id == aluno_id).order_by(models.TreinoRealizado.data_fim.asc()).all()

    return {
        "composicao_corporal": evolucoes,
        "volume_treino": [{"data": t.data_fim, "volume": t.volume_total} for t in treinos]
    }