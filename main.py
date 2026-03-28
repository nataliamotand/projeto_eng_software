from fastapi import FastAPI
# 1. IMPORTAMOS OS MODELOS CRIADOS PELA NATÁLIA
from models import Aluno, Professor, FichaTreino, Exercicio

app = FastAPI(title="API Self-Fit", description="Sistema de gerenciamento de treinos")

# --- NOSSO BANCO DE DADOS FAKE (Na memória) ---
banco_alunos = []
banco_professores = []
banco_fichas = []
banco_exercicios = []

@app.get("/")
def raiz():
    return {"mensagem": "API do Self-Fit rodando a todo vapor!"}

# --- ROTAS DE ALUNOS ---
@app.post("/alunos", summary="Cadastrar um novo aluno")
def cadastrar_aluno(aluno: Aluno): # 2. SUBSTITUÍMOS 'dict' PELO MODELO 'Aluno'
    banco_alunos.append(aluno)
    return {"mensagem": "Aluno cadastrado com sucesso no Self-Fit!", "aluno": aluno}

@app.get("/alunos", summary="Listar todos os alunos")
def listar_alunos():
    return {"total": len(banco_alunos), "alunos": banco_alunos}

# --- ROTAS DE PROFESSORES ---
@app.post("/professores", summary="Cadastrar um novo professor")
def cadastrar_professor(professor: Professor): # 2. SUBSTITUÍMOS 'dict' POR 'Professor'
    banco_professores.append(professor)
    return {"mensagem": "Professor cadastrado com sucesso!", "professor": professor}

@app.get("/professores", summary="Listar todos os professores")
def listar_professores():
    return {"total": len(banco_professores), "professores": banco_professores}

# --- ROTAS DE FICHAS DE TREINO ---
@app.post("/fichas", summary="Criar uma nova ficha de treino")
def criar_ficha(ficha: FichaTreino): # 2. SUBSTITUÍMOS 'dict' POR 'FichaTreino'
    banco_fichas.append(ficha)
    return {"mensagem": "Ficha criada com sucesso!", "ficha": ficha}

@app.get("/fichas", summary="Visualizar todas as fichas")
def listar_fichas():
    return {"total": len(banco_fichas), "fichas": banco_fichas}

# --- ROTAS DE EXERCÍCIOS ---
@app.post("/exercicios", summary="Cadastrar um novo exercício no catálogo")
def cadastrar_exercicio(exercicio: Exercicio): # 2. SUBSTITUÍMOS 'dict' POR 'Exercicio'
    banco_exercicios.append(exercicio)
    return {"mensagem": "Exercício cadastrado com sucesso!", "exercicio": exercicio}

@app.get("/exercicios", summary="Listar todos os exercícios disponíveis")
def listar_exercicios():
    return {"total": len(banco_exercicios), "exercicios": banco_exercicios}