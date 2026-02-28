# Arquitetura do Sistema

## Visao geral
- `frontend` (React + Vite): interface unica com dashboard, mapa, voos, relatorios, configuracoes e chat IA.
- `projetoti` (Node.js + Express): API REST com autenticacao JWT, consultas operacionais e modulos de IA.
- MySQL/MariaDB com dois bancos:
- `sistema_voos`: dados operacionais (aeroportos, voos, tarifas).
- `sistema_voos_spec`: dados de usuarios, seguranca de conta e LGPD.

## Fluxo principal
1. Usuario autentica em `/auth/login`.
2. Frontend armazena token JWT e envia `Authorization: Bearer <token>`.
3. API valida token no middleware e libera rotas protegidas.
4. Dashboard consome `/voos` e `/ia/*` para operacao em tempo real.

## Modulos
- Autenticacao e seguranca:
- Cadastro/login, troca de senha, 2FA, sessoes ativas e solicitacoes LGPD.
- Operacional:
- Listagem de voos e integracao com mapa.
- IA:
- Risco por voo (`/ia/risco-atraso/:numero_voo`).
- Chat IA (`/ia/chat`) com fallback local e opcao de LLM.

## Observacao recente
- O botao `Proxima pagina` do chat generativo foi removido da interface para simplificar a experiencia.
