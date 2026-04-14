from database import SessionLocal
import models

db = SessionLocal()

print("\n" + "="*85)
print("🔍 DIAGNÓSTICO DE BANCO DE DADOS - SELF-FIT")
print("="*85)

# 1. TODOS OS USUÁRIOS (CONTAS)
usuarios = db.query(models.Usuario).all()
print("\n👤 CONTAS GERAIS (Tabela Usuarios):")
print(f"{'ID':<5} | {'Nome':<20} | {'Email':<30} | {'Perfil Oficial':<10}")
print("-" * 85)

for u in usuarios:
    # Verifica se tem entrada nas tabelas de perfil
    tem_aluno = "SIM" if u.perfil_aluno else "NÃO ❌"
    tem_prof = "SIM" if u.perfil_professor else "NÃO"
    
    print(f"{u.id:<5} | {u.nome:<20} | {u.email:<30} | {u.tipo_perfil:<10}")
    if u.tipo_perfil == "STUDENT" and not u.perfil_aluno:
        print(f"   ⚠️ ALERTA: Este usuário é Aluno mas NÃO tem registro na tabela 'alunos'!")

# 2. ALUNOS VINCULADOS
alunos = db.query(models.Aluno).all()
print("\n🏃 PERFIS DE ALUNO ATIVOS (Tabela Alunos):")
print(f"{'ID Perfil':<10} | {'ID Usuário':<10} | {'Objetivo':<20}")
print("-" * 85)

if not alunos:
    print("Nenhum perfil de aluno encontrado.")
else:
    for a in alunos:
        print(f"{a.id:<10} | {a.usuario_id:<10} | {a.objetivo:<20}")

print("\n" + "="*85)
db.close()