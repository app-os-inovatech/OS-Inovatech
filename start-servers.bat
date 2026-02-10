@echo off
echo.
echo ================================
echo   INICIANDO SERVIDORES
echo ================================
echo.

REM Iniciar Backend
start "Backend Server" cmd /k "cd /d "%~dp0backend" && npm start"
echo Backend iniciado em nova janela...
timeout /t 3 /nobreak >nul

REM Iniciar Frontend  
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm start"
echo Frontend iniciado em nova janela...

echo.
echo ================================
echo SERVIDORES INICIADOS!
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo Rede: http://192.168.0.20:3000
echo.
echo Mantenha as janelas abertas!
echo ================================
pause
