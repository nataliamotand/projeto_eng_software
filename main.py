from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"mensagem": "API de Musculacao do TP1 rodando com sucesso!"}