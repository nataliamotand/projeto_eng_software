from database import SessionLocal
import models

db = SessionLocal()

print("\n" + "="*30)
print("📋 RELATÓRIO DE IDs DO BANCO")
print("="*30)

# Ver Professores
professores = db.query(models.Professor).all()
print("\n👨‍🏫 PROFESSORES:")
if not professores: print("Nenhum professor cadastrado.")
for p in professores:
    user = db.query(models.Usuario).filter(models.Usuario.id == p.usuario_id).first()
    print(f"ID do Perfil: {p.id} | Nome: {user.nome} | (Use este ID para VINCULAR)")

# Ver Alunos
alunos = db.query(models.Aluno).all()
print("\n🏃 ALUNOS:")
if not alunos: print("Nenhum aluno cadastrado.")
for a in alunos:
    user = db.query(models.Usuario).filter(models.Usuario.id == a.usuario_id).first()
    print(f"ID do Perfil: {a.id} | Nome: {user.nome} | (Use este ID para a FICHA)")

print("\n" + "="*30)
db.close()