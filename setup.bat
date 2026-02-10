@echo off
setlocal

REM ===== Configuracao padrao (edite se precisar) =====
set MYSQL_USER=root
set MYSQL_HOST=localhost

set /p MYSQL_PASS=Digite a senha do MySQL (ENTER se vazia):
if not "%MYSQL_PASS%"=="" (
  set MYSQL_PASS=-p%MYSQL_PASS%
) else (
  set MYSQL_PASS=
)

set ROOT=%~dp0

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
