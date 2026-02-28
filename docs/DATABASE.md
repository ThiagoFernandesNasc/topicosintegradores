# Banco de Dados

## Bancos usados
- `sistema_voos`: operacao aeroportuaria.
- `sistema_voos_spec`: autenticacao, seguranca e LGPD.

## `sistema_voos` (arquivo `projetoti/operacional.sql`)
- `aeroporto`
- `voo`
- `tarifa`

## `sistema_voos_spec` (arquivo `projetoti/spec.sql`)
- `usuario`
- `consentimento`
- `log_acesso_dado`
- `usuario_seguranca`
- `sessao_usuario`
- `solicitacao_lgpd`

## Verificacao e ajustes aplicados
- O backend ja dependia de `usuario_seguranca`, `sessao_usuario` e `solicitacao_lgpd`.
- Essas tabelas nao estavam no `spec.sql` original.
- O script foi atualizado para criar essas tabelas com `IF NOT EXISTS`.
- Foram adicionados indices para consultas frequentes:
- `idx_sessao_usuario_usuario_ativa_criado`
- `idx_solicitacao_lgpd_usuario_criado`
- `idx_log_acesso_dado_usuario_data`

## Recomendacoes
- Criar migracoes versionadas (ex.: `migrations/`) para evitar drift entre codigo e SQL.
- Padronizar charset/colation para evitar problemas de acentuacao.
- Evitar `SELECT *` em producao para facilitar evolucao de esquema.
