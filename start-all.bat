@echo off
setlocal

set ROOT=%~dp0

REM Start backend (Node/Express)
start "SkyLine-API" cmd /k "cd /d %ROOT%projetoti && npm run dev"

REM Start frontend (Vite)
start "SkyLine-Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo SkyLine Cia: back-end e front-end iniciados em janelas separadas.
endlocal
