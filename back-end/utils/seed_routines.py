import sys
import os

# Adiciona a pasta pai (back-end) ao caminho de busca do Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models

def seed_routines():
    db = SessionLocal()
    try:
        # Busca pelo e-mail que você usa no login (carlos@teste.com ou o seu real)
        # Verifique qual e-mail você usou para criar o seu usuário ID 9
        user = db.query(models.Usuario).filter(models.Usuario.id == 9).first()
        
        if not user or not user.perfil_aluno:
            print("❌ Erro: Perfil de aluno não encontrado para o ID 9.")
            return

        aluno_id = user.perfil_aluno.id
        print(f"🏋️ Criando rotinas para: {user.nome} (ID Aluno: {aluno_id})")

        # Limpa rotinas antigas para o teste ser limpo
        db.query(models.Rotina).filter(models.Rotina.aluno_id == aluno_id).delete()

        # 1. Rotina EDITÁVEL (Aluno)
        r1 = models.Rotina(
            aluno_id=aluno_id,
            title="Treino A - Peito e Tríceps",
            criado_por_professor=False,
            status="approved"
        )

        # 2. Rotina BLOQUEADA (Professor)
        r2 = models.Rotina(
            aluno_id=aluno_id,
            title="Treino B - Inferiores (Assinado)",
            criado_por_professor=True,
            status="approved"
        )

        db.add(r1)
        db.add(r2)
        db.commit()
        
        print("✅ Sucesso! As rotinas foram inseridas no Neon.")

    except Exception as e:
        print(f"⚠️ Erro ao inserir dados: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_routines()