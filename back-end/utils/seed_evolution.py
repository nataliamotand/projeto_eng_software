from database import SessionLocal
import models
from datetime import date, timedelta

db = SessionLocal()

# O ID do seu Aluno (pelo check_ids vimos que o carlos@final.com é ID 5 na tabela Alunos)
ALUNO_ID = 5 

# Vamos criar uma lista de evoluções fakes para as últimas semanas
dados_fake = [
    {"data": date.today() - timedelta(days=15), "peso": 82.0, "bf": 18.0, "massa": 58.0},
    {"data": date.today() - timedelta(days=10), "peso": 81.2, "bf": 17.5, "massa": 58.5},
    {"data": date.today() - timedelta(days=7),  "peso": 80.5, "bf": 17.0, "massa": 59.2},
    {"data": date.today() - timedelta(days=3),  "peso": 79.8, "bf": 16.5, "massa": 59.8},
]

try:
    print("🧹 Limpando histórico antigo para o teste...")
    db.query(models.Evolucao).filter(models.Evolucao.aluno_id == ALUNO_ID).delete()

    print("📈 Inserindo novos pontos de evolução...")
    for d in dados_fake:
        nova_medida = models.Evolucao(
            aluno_id=ALUNO_ID,
            data_registro=d["data"],
            peso=d["peso"],
            porcentagem_gordura=d["bf"],
            massa_muscular=d["massa"]
        )
        db.add(nova_medida)
    
    db.commit()
    print("✅ Sucesso! Agora abre o App e veja a mágica.")
finally:
    db.close()