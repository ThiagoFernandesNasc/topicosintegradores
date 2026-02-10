# SkyLine Cia

Projeto com back-end (Node/Express) e front-end (React/Vite) para análise de risco de atrasos.

## Requisitos
- Node.js + npm
- MySQL/MariaDB

## Configuração
1. Crie os bancos e tabelas:
   - `projetoti/operacional.sql`
   - `projetoti/spec.sql`

2. Configure o `.env` do back-end:
   - Copie `projetoti/.env.example` para `projetoti/.env`
   - Ajuste credenciais e segredo JWT

3. Instale dependências:
   - `cd projetoti && npm install`
   - `cd frontend && npm install`

## Rodar
1. Windows (atalho):
   - `start-all.bat`

2. Manual:
   - `cd projetoti && npm run dev`
   - `cd frontend && npm run dev`

## Observações
- O back-end usa dois bancos:
  - `sistema_voos` (operacional)
  - `sistema_voos_spec` (SPEC focada no usuário/LGPD)
