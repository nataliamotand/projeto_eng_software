from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# --- CONFIGURAÇÕES DE SEGURANÇA ---
# Em um projeto final, essa chave ficaria escondida em um arquivo .env!
SECRET_KEY = "chave-super-secreta-do-self-fit" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # O crachá do usuário vai durar 7 dias

# Dizendo para o Python usar o algoritmo bcrypt para embaralhar as senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def gerar_hash_senha(senha: str):
    """Pega a senha pura (ex: 123456) e transforma num texto gigante e ilegível"""
    return pwd_context.hash(senha)

def verificar_senha(senha_pura: str, senha_hash: str):
    """Compara a senha que o usuário digitou no login com a que está salva no banco"""
    return pwd_context.verify(senha_pura, senha_hash)

def criar_token_acesso(dados: dict):
    """Gera o 'crachá' JWT que o front-end vai guardar após o login"""
    dados_copia = dados.copy()
    expira_em = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_copia.update({"exp": expira_em})
    token_jwt = jwt.encode(dados_copia, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt