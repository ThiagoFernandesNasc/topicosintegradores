@echo off
setlocal

REM Instalador separado: baixa e instala apenas o Node.js (LTS) via winget.
REM Requer Windows 10/11 com winget disponivel.

where winget >nul 2>&1
if errorlevel 1 (
  echo [ERRO] winget nao encontrado.
  echo Instale o App Installer pela Microsoft Store e tente novamente.
  exit /b 1
)

echo Instalando Node.js LTS...
winget install --id OpenJS.NodeJS.LTS -e --source winget
if errorlevel 1 (
  echo [ERRO] Falha ao instalar Node.js.
  exit /b 1
)

echo.
echo Node.js instalado. Agora voce pode rodar setup.bat
endlocal
