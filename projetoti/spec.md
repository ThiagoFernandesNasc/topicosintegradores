# SPEC - Base de Dados Focada no Usuário (LGPD)

Este documento define a base SPEC para a SkyLine Cia, derivada do banco operacional (sistema_voos), com foco em dados pessoais, consentimento e experiência do usuário.

## 1) Tabelas principais

### usuario
- id_usuario (PK)
- nome
- email (único)
- senha_hash
- perfil (OPERADOR | ADMIN | PASSAGEIRO)
- canal_preferido (EMAIL | SMS | WHATSAPP)
- criado_em
- atualizado_em

### consentimento_lgpd
- id_consentimento (PK)
- id_usuario (FK usuario)
- finalidade (EX: ALERTAS_RISCO, MARKETING, PESQUISA)
- status (ATIVO | REVOGADO)
- data_aceite
- data_revogacao
- origem (WEB | APP | API)

### preferencia_viagem
- id_preferencia (PK)
- id_usuario (FK usuario)
- origem_frequente
- destino_frequente
- janela_horaria
- atualizado_em

### consulta_risco
- id_consulta (PK)
- id_usuario (FK usuario)
- numero_voo (referência lógica ao banco operacional)
- percent_risco
- label_risco (BAIXO | MEDIO | ALTO | CRITICO)
- modelo_ia (TRADICIONAL | GENERATIVA)
- explicacao
- consultado_em

### notificacao
- id_notificacao (PK)
- id_usuario (FK usuario)
- tipo (ALERTA | INFORMATIVO)
- mensagem
- enviado_em
- canal
- status (ENVIADO | FALHA)

### feedback_usuario
- id_feedback (PK)
- id_usuario (FK usuario)
- numero_voo
- avaliacao (1-5)
- comentario
- criado_em

## 2) Regras LGPD
- Base legal: consentimento explícito para alertas personalizados.
- Finalidade: uso exclusivo para monitoramento e comunicação de risco.
- Minimização: coletar apenas dados necessários para alertas e personalização.
- Retenção: dados pessoais devem ser removidos após período definido na política interna.
- Direitos do titular: acesso, correção, portabilidade e exclusão.

## 3) Integração com banco operacional
- O banco operacional (sistema_voos) mantém dados de voo e status.
- A SPEC armazena interações, preferências e histórico de risco.
- O relacionamento é lógico via numero_voo e não por FK direta.
