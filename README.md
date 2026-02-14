# Sky CIA

Projeto com back-end (Node/Express) e front-end (React/Vite) para analise de risco de atrasos.

## Requisitos
- Node.js + npm
- MySQL/MariaDB

## Instalador Node (Windows)
- Rode `install-node.bat` para instalar o Node.js LTS via winget.

## Configuracao
1. Crie os bancos e tabelas:
   - `projetoti/operacional.sql`
   - `projetoti/spec.sql`

2. Configure o `.env` do back-end:
   - Copie `projetoti/.env.example` para `projetoti/.env`
   - Ajuste credenciais e segredo JWT

3. Instale dependencias:
   - `cd projetoti && npm install`
   - `cd frontend && npm install`

## Rodar
1. Tudo automatico (instala deps, roda setup e inicia):
   - `run-all.bat`

2. Windows (atalho):
   - `start-all.bat`

3. Manual:
   - `cd projetoti && npm run dev`
   - `cd frontend && npm run dev`

## Observacoes
- O back-end usa dois bancos:
  - `sistema_voos` (operacional)
  - `sistema_voos_spec` (SPEC focada no usuario/LGPD)
