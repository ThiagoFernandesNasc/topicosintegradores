# Frontend (React + Vite)

## Stack
- React 19
- Vite
- Axios
- Leaflet (mapa)
- jsPDF (geracao de PDF no cliente)

## Estrutura principal
- `src/App.jsx`: tela principal (login + modulos internos).
- `src/App.css`: estilo e temas.
- `src/api.js`: cliente HTTP e injecao de token.

## Funcionalidades de UI
- Login e sessao com perfil de usuario.
- Dashboard operacional com KPIs, mapa e tabela.
- Gestao de voos com restricao por perfil (admin edita, passageiro observa).
- Relatorios com exportacao PDF.
- Configuracoes (tema, idioma, seguranca e preferencias).
- Chat IA generativa (sem botao de "Proxima pagina" na UI).

## Internacionalizacao
- UI com textos PT/EN controlados por estado interno.
- Recomendacao: evoluir para dicionario centralizado (`i18n`) para reduzir strings duplicadas.

## Comandos
- `npm run dev`
- `npm run build`
- `npm run preview`
