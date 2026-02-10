@echo off
setlocal

set ROOT=%~dp0
set DIST=%ROOT%frontend\dist

if not exist "%DIST%" (
  echo A pasta dist nao existe. Rode:
  echo   cd frontend ^&^& npm install ^&^& npm run build
  exit /b 1
)

cd /d "%DIST%" || exit /b 1

echo Servindo frontend em http://localhost:5173
python -m http.server 5173
endlocal
