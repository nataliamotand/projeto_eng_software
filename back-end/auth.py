from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# --- CONFIGURAÇÕES DE SEGURANÇA ---
SECRET_KEY = "chave-super-secreta-do-self-fit" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # O crachá dura 7 dias

# Dizendo para o Python usar o algoritmo bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Diz pro FastAPI que a rota de pegar o crachá é a "/login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def gerar_hash_senha(senha: str):
    """Transforma a senha pura num texto ilegível"""
    return pwd_context.hash(senha)

def verificar_senha(senha_pura: str, senha_hash: str):
    """Compara a senha digitada com a do banco"""
    return pwd_context.verify(senha_pura, senha_hash)

def criar_token_acesso(dados: dict):
    """Gera o Token JWT de acesso"""
    dados_copia = dados.copy()
    expira_em = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    dados_copia.update({"exp": expira_em})
    token_jwt = jwt.encode(dados_copia, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt

def obter_usuario_atual(token: str = Depends(oauth2_scheme)):
    """Leão de Chácara: Lê o Token JWT e descobre qual é o email do usuário logado"""
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Tenta abrir o crachá com a nossa chave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credenciais_exception
        return email
    except:
        raise credenciais_exception