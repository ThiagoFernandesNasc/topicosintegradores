# Runbook (Local)

## 1) Pre-requisitos
- Node.js LTS
- npm
- MySQL/MariaDB

## 2) Banco de dados
1. Execute `projetoti/operacional.sql`.
2. Execute `projetoti/spec.sql`.

## 3) Variaveis de ambiente
1. Copie `projetoti/.env.example` para `projetoti/.env`.
2. Configure:
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `JWT_SECRET`
- `PORT` (opcional)
- `LLM_PROVIDER` (`gemini` ou `openai`)
- `GEMINI_API_KEY` e `GEMINI_MODEL` (se usar Gemini)

## 4) Instalar dependencias
- Backend: `cd projetoti && npm install`
- Frontend: `cd frontend && npm install`

## 5) Executar
- Script rapido no Windows: `start-all.bat`
- Ou manual:
- `cd projetoti && npm run dev`
- `cd frontend && npm run dev`

## 6) Build de validacao
- Frontend: `cd frontend && npm run build`
- Backend (checagem sintatica):
- `node --check projetoti/src/routes/auth.routes.js`
- `node --check projetoti/src/routes/ia.routes.js`

## 7) Troubleshooting rapido
- Erro 401 no login: validar senha hash e banco `sistema_voos_spec`.
- Erro de import no frontend: rodar `npm install` em `frontend`.
- Falha de CORS/token: validar `Authorization Bearer` enviado pelo `src/api.js`.
- IA generativa sem resposta: validar `LLM_PROVIDER`, `GEMINI_API_KEY` e logs da rota `/ia/chat`.

## 8) Swagger / OpenAPI
- UI: `http://localhost:3000/docs`
- JSON: `http://localhost:3000/docs.json`
