@echo off
cd /d "%~dp0"
title Ikigai

if not exist "node_modules" (
  echo Instalacja zaleznosci - chwile...
  npm install
  if errorlevel 1 ( echo BLAD: npm install nie powiodlo sie & pause & exit /b 1 )
)

if not exist "dist" (
  echo Budowanie aplikacji - chwile...
  npm run build
  if errorlevel 1 ( echo BLAD: build nie powiodl sie & pause & exit /b 1 )
)

echo.
echo  Ikigai uruchamia sie na http://localhost:3000
echo  Zamknij to okno, zeby zatrzymac aplikacje.
echo.

start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"
node server.js
pause
