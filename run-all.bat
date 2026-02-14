@echo off
setlocal

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

REM Verifica MySQL
where mysql >nul 2>&1
if errorlevel 1 (
  echo [ERRO] mysql nao encontrado no PATH.
  echo Instale MySQL/MariaDB e adicione ao PATH.
  exit /b 1
)

REM Configuracao do MySQL (pode editar se precisar)
if "%MYSQL_USER%"=="" set MYSQL_USER=root
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set /p MYSQL_PASS_RAW=Digite a senha do MySQL (ENTER se vazia):
if not "%MYSQL_PASS_RAW%"=="" (
  set MYSQL_PASS=-p%MYSQL_PASS_RAW%
) else (
  set MYSQL_PASS=
)

REM Testa conexao
mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Falha ao conectar no MySQL. Verifique usuario/senha.
  exit /b 1
)

REM Instala dependencias
echo [1/3] Instalando dependencias do back-end...
cd /d "%ROOT%projetoti" || exit /b 1
call npm install

echo [2/3] Instalando dependencias do front-end...
cd /d "%ROOT%frontend" || exit /b 1
call npm install

REM Checa bancos existentes
set DB1=
set DB2=
for /f "delims=" %%A in ('mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% -N -s -e "SHOW DATABASES LIKE 'sistema_voos';"') do set DB1=%%A
for /f "delims=" %%A in ('mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% -N -s -e "SHOW DATABASES LIKE 'sistema_voos_spec';"') do set DB2=%%A

if not "%DB1%"=="" if not "%DB2%"=="" (
  echo [3/3] Bancos ja existem. Pulando setup.bat.
) else (
  echo [3/3] Rodando setup (bancos e .env)...
  set MYSQL_USER=%MYSQL_USER%
  set MYSQL_HOST=%MYSQL_HOST%
  set MYSQL_PASS_RAW=%MYSQL_PASS_RAW%
  cd /d "%ROOT%" || exit /b 1
  call setup.bat
  if errorlevel 1 (
    echo [ERRO] setup.bat falhou.
    exit /b 1
  )
)

echo.
echo Dependencias instaladas e setup concluido.

REM Inicia tudo
cd /d "%ROOT%" || exit /b 1
call start-all.bat

endlocal
