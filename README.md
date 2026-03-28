# projeto_eng_software - Self-Fit


# Integrantes do grupo
Carlos Eduardo Santos Oliveira (Back-end): 
  Desenvolvimento da API (FastAPI), rotas, conexão com o banco de dados e autenticação.

Gabrielli Valelia Sousa da Silva (Front-end): 
  Construção da interface web (React), consumo da API e navegação do sistema.

Natalia Dias Santos Mota (Back-end e Arquitetura): 
  Modelagem do banco de dados (PostgreSQL), regras de negócio (cálculos de treino) e documentação geral.

Pedro Alonso Araujo Silva (Front-end e Infra): 
  Desenvolvimento da interface web, auxílio na integração front/back, testes básicos ambiente e deploy

# Objetivo do Sistema
- Desenvolver uma aplicação web responsiva voltada para a Gestão de Treinos de Musculação, centralizando a interação entre professores e alunos.
- No sistema, o professor será responsável por montar e alterar as fichas de exercícios e acompanhar o progresso e a frequência de seus diversos alunos. 
- Já o aluno poderá visualizar suas fichas de treino prescritas, montar fichas de sua preferência (com validação do professor), registrar as cargas e repetições executadas no dia, além de monitorar sua própria evolução contínua de forma estruturada.

# Tecnologias
Front-end: React.js ou React Native
Back-end: Python (FastAPI)
Banco de Dados: PostgreSQL
Agentes de IA: Cursor, Claude e Gemini

# Histórias de Usuários

  **Visão Aluno**
  
1. Como aluno, eu quero visualizar minha ficha de treino do dia para saber exatamente quais exercícios executar.

2. Como aluno, eu quero registrar as cargas e repetições reais que executei em cada exercício para acompanhar meu histórico de força e evolução.

3. Como aluno, eu quero visualizar um painel com meu progresso (evolução de pesos e dias frequentados) para monitorar meus resultados de forma estruturada.

4. Como aluno, eu quero montar uma proposta de ficha de treino com os exercícios da minha preferência para que meu professor possa revisar e validar.


  **Visão Professor**
  
1. Como professor, eu quero criar e atribuir uma ficha de treino personalizada para um aluno específico, definindo exercícios, séries, repetições e intervalos.

2. Como professor, eu quero visualizar uma lista com todos os meus alunos e seus respectivos status de frequência para identificar quem precisa de acompanhamento.

3. Como professor, eu quero analisar o histórico de cargas e o progresso de um aluno para ajustar sua ficha de treino conforme a evolução dele.

4. Como professor, eu quero receber notificações ou visualizar uma fila de "fichas propostas por alunos" para aprovar, editar ou rejeitar as sugestões.

flowchart LR
    %% Atores
    A([Aluno])
    P([Professor])

    %% Sistema
    subgraph Self-Fit [Sistema Self-Fit]
        direction TB
        UC1(Visualizar Ficha do Dia)
        UC2(Registrar Cargas e Repetições)
        UC3(Acompanhar Progresso de Hipertrofia/Força)
        UC4(Propor Nova Ficha de Treino)
        
        UC5(Criar Ficha de Treino Personalizada)
        UC6(Acompanhar Frequência de Alunos)
        UC7(Analisar Histórico de Cargas)
        UC8(Avaliar Ficha Proposta pelo Aluno)
    end

    %% Relações Aluno
    A --> UC1
    A --> UC2
    A --> UC3
    A --> UC4

    %% Relações Professor
    P --> UC5
    P --> UC6
    P --> UC7
    P --> UC8
    
    %% O Professor também pode visualizar o progresso do aluno
    P -.-> UC3

    classDiagram
    class Usuario {
        +int id
        +String nome
        +String email
        +String senha
        +String tipoPerfil
    }
    
    class Professor {
        +String cref
    }
    
    class Aluno {
        +float peso
        +float altura
        +String objetivo
    }
    
    class FichaTreino {
        +int id
        +String titulo
        +Date dataCriacao
        +String status
    }
    
    class Exercicio {
        +int id
        +String nome
        +String grupoMuscular
        +int series
        +int repeticoesBase
        +float cargaEstimada
    }
    
    class RegistroTreino {
        +int id
        +Date dataRealizacao
        +float cargaReal
        +int repeticoesReais
    }
    
    Usuario <|-- Professor : herda
    Usuario <|-- Aluno : herda
    Professor "1" --> "*" FichaTreino : prescreve / avalia
    Aluno "1" --> "*" FichaTreino : possui / propõe
    FichaTreino "1" *-- "*" Exercicio : contém
    Aluno "1" --> "*" RegistroTreino : executa
    RegistroTreino "*" --> "1" Exercicio : refere-se a