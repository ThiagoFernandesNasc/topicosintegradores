# Documentacao da API

Base URL local: `http://localhost:3000`

## Autenticacao
- Tipo: `Bearer Token` (JWT)
- Header:
```http
Authorization: Bearer <token>
```

## Endpoints

### Auth

#### `POST /auth/register`
- Auth: nao
- Body:
```json
{
  "nome": "Thiago",
  "email": "thiago@email.com",
  "senha": "123456",
  "perfil": "ADMIN",
  "companhia": null
}
```
- Respostas:
- `201`: usuario cadastrado
- `400`: dados obrigatorios invalidos
- `409`: email ja cadastrado

#### `POST /auth/login`
- Auth: nao
- Body:
```json
{
  "email": "thiago@email.com",
  "senha": "123456"
}
```
- Resposta `200`:
```json
{
  "token": "jwt...",
  "usuario": {
    "id": 1,
    "nome": "Thiago",
    "email": "thiago@email.com",
    "perfil": "ADMIN",
    "companhia": null
  }
}
```
- Erros: `400`, `401`, `500`

#### `GET /auth/me`
- Auth: sim
- Respostas:
- `200`: dados do usuario autenticado
- `404`: usuario nao encontrado

#### `POST /auth/change-password`
- Auth: sim
- Body:
```json
{
  "currentPassword": "123456",
  "newPassword": "thiago123"
}
```
- Respostas: `200`, `400`, `401`, `404`, `500`

#### `GET /auth/2fa`
- Auth: sim
- Resposta `200`:
```json
{ "enabled": true }
```

#### `POST /auth/2fa`
- Auth: sim
- Body:
```json
{ "enabled": true }
```
- Resposta `200`:
```json
{ "message": "2FA ativado", "enabled": true }
```

#### `GET /auth/sessions`
- Auth: sim
- Resposta `200`:
```json
{
  "items": [
    {
      "id": 10,
      "jti": "uuid...",
      "user_agent": "Mozilla/5.0 ...",
      "ip": "::1",
      "ativa": 1,
      "criado_em": "2026-02-28T01:00:00.000Z",
      "revogada_em": null
    }
  ]
}
```

#### `POST /auth/sessions/:id/revoke`
- Auth: sim
- Param: `id` (id da sessao)
- Respostas: `200`, `400`, `404`, `500`

#### `POST /auth/lgpd/request`
- Auth: sim
- Body:
```json
{
  "tipo": "EXPORTACAO",
  "detalhes": "Quero copia dos meus dados"
}
```
- `tipo`: `EXPORTACAO` ou `EXCLUSAO`
- Respostas: `201`, `400`, `500`

### Voos

#### `GET /voos`
- Auth: sim
- Retorna lista de voos:
```json
[
  {
    "numero_voo": "LA1234",
    "companhia": "LATAM",
    "horario_previsto": "2026-02-08T10:00:00.000Z",
    "status": "PREVISTO",
    "preco_medio": "500.00"
  }
]
```

### IA

#### `GET /ia/risco-atraso/:numero_voo?modelo=tradicional|generativa`
- Auth: sim
- Exemplo:
`GET /ia/risco-atraso/LA1234?modelo=tradicional`
- Resposta `200`:
```json
{
  "numero_voo": "LA1234",
  "risco": {
    "percent": 22,
    "label": "baixo"
  }
}
```
- Erros: `404`, `500`

#### `POST /ia/chat`
- Auth: sim
- Body:
```json
{
  "pergunta": "quais voos estao atrasados?",
  "historico": [],
  "voosContexto": [],
  "modo": "executivo",
  "page": 1,
  "limit": 10,
  "usarLLM": true
}
```
- Resposta `200`:
```json
{
  "pergunta": "quais voos estao atrasados?",
  "resposta": "....",
  "topico": "atrasos",
  "confianca": "alta",
  "sugestoes": [],
  "paginacao": null,
  "source": "llm",
  "provider": "openai",
  "model": "gpt-...",
  "totalVoosAvaliados": 21
}
```

## Metodos atualmente implementados
- `GET`: sim
- `POST`: sim
- `DELETE`: nao implementado (hoje a API usa `POST` para revogar sessao)
- `PUT/PATCH`: nao implementado
