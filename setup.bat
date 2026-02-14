@echo off
setlocal

REM ===== Configuracao padrao (edite se precisar) =====
if "%MYSQL_USER%"=="" set MYSQL_USER=root
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

if not "%MYSQL_PASS_RAW%"=="" (
  set MYSQL_PASS=-p%MYSQL_PASS_RAW%
) else (
  set /p MYSQL_PASS_RAW=Digite a senha do MySQL (ENTER se vazia):
  if not "%MYSQL_PASS_RAW%"=="" (
    set MYSQL_PASS=-p%MYSQL_PASS_RAW%
  ) else (
    set MYSQL_PASS=
  )
)

set ROOT=%~dp0

REM Verifica Node.js e npm
where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Execute install-node.bat e tente novamente.
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERRO] npm nao encontrado.
  echo Execute install-node.bat e tente novamente.
  exit /b 1
)

echo [1/4] Instalando dependencias do back-end...
cd /d "%ROOT%projetoti" || exit /b 1
call npm install

echo [2/4] Instalando dependencias do front-end...
cd /d "%ROOT%frontend" || exit /b 1
call npm install

echo [3/4] Preparando .env do back-end...
cd /d "%ROOT%projetoti" || exit /b 1
if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo .env criado a partir de .env.example
) else (
  echo .env ja existe
)

echo [4/4] Criando bancos e tabelas...
cd /d "%ROOT%projetoti" || exit /b 1

REM Requer mysql no PATH. Se nao tiver, instale MySQL e adicione ao PATH.
mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% < operacional.sql
mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% < spec.sql

echo.
echo Setup concluido. Agora execute start-all.bat
endlocal
