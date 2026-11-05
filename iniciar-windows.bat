@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Falta instalar Node.js. Descargalo de https://nodejs.org (boton LTS^), instalalo y vuelve a abrir este archivo.
  echo.
  pause
  exit /b
)
if not exist node_modules (
  echo Instalando por primera vez, espera un momento...
  call npm install
)
start "" http://localhost:3000
node server.js
pause
