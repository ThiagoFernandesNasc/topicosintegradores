@echo off
setlocal

set ROOT=%~dp0

echo [1/6] Validando Node.js e npm...
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

echo [2/6] Validando MySQL CLI...
set MYSQL_AVAILABLE=1
where mysql >nul 2>&1
if errorlevel 1 (
  set MYSQL_AVAILABLE=0
  echo [AVISO] mysql nao encontrado no PATH.
  echo [AVISO] O script vai iniciar a aplicacao e pular a criacao automatica dos bancos.
)

if "%MYSQL_AVAILABLE%"=="1" (
  if "%MYSQL_USER%"=="" set MYSQL_USER=root
  if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost
  if "%MYSQL_PASS_RAW%"=="" (
    set /p MYSQL_PASS_RAW=Digite a senha do MySQL ^(ENTER se vazia^):
  )
  if not "%MYSQL_PASS_RAW%"=="" (
    set MYSQL_PASS=-p%MYSQL_PASS_RAW%
  ) else (
    set MYSQL_PASS=
  )

  mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% -e "SELECT 1;" >nul 2>&1
  if errorlevel 1 (
    echo [AVISO] Falha ao conectar no MySQL com os dados informados.
    echo [AVISO] O script vai iniciar a aplicacao e pular a criacao automatica dos bancos.
    set MYSQL_AVAILABLE=0
  )
)

echo [3/6] Instalando dependencias do back-end...
cd /d "%ROOT%projetoti" || exit /b 1
call npm install
if errorlevel 1 exit /b 1

echo [4/6] Instalando dependencias do front-end...
cd /d "%ROOT%frontend" || exit /b 1
call npm install
if errorlevel 1 exit /b 1

echo [5/6] Preparando .env e bancos...
cd /d "%ROOT%projetoti" || exit /b 1
if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo .env criado a partir de .env.example
  ) else (
    echo [ERRO] .env e .env.example nao encontrados em projetoti.
    exit /b 1
  )
) else (
  echo .env ja existe.
)

if "%MYSQL_AVAILABLE%"=="1" (
  set DB1=
  set DB2=
  for /f "delims=" %%A in ('mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% -N -s -e "SHOW DATABASES LIKE 'sistema_voos';"') do set DB1=%%A
  for /f "delims=" %%A in ('mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% -N -s -e "SHOW DATABASES LIKE 'sistema_voos_spec';"') do set DB2=%%A

  if "%DB1%"=="" (
    echo Criando banco operacional...
    mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% < operacional.sql
    if errorlevel 1 (
      echo [ERRO] Falha ao criar banco operacional.
      exit /b 1
    )
  ) else (
    echo Banco sistema_voos ja existe. Pulando operacional.sql
  )

  if "%DB2%"=="" (
    echo Criando banco spec...
    mysql -h %MYSQL_HOST% -u %MYSQL_USER% %MYSQL_PASS% < spec.sql
    if errorlevel 1 (
      echo [ERRO] Falha ao criar banco spec.
      exit /b 1
    )
  ) else (
    echo Banco sistema_voos_spec ja existe. Pulando spec.sql
  )
) else (
  echo [AVISO] Etapa de banco pulada: mysql CLI indisponivel.
)

echo [6/6] Iniciando aplicacao...
start "SkyLine-API" cmd /k "cd /d %ROOT%projetoti && npm run dev"
start "SkyLine-Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo.
echo Projeto iniciado:
echo - Frontend: http://localhost:5173
echo - API:      http://localhost:3000
echo - Swagger:  http://localhost:3000/docs
endlocal
