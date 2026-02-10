@echo off
echo ================================================
echo   INOVAGUIL - SISTEMA COMPLETO
echo   Site Institucional + Area do Cliente
echo ================================================
echo.

echo [1/2] Iniciando Backend (API + Site)...
start "Backend - Inovaguil" cmd /k "cd backend && node src/server-Anderson.js"
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend (Area do Cliente)...
start "Frontend - Inovaguil" cmd /k "cd frontend && npm start"
timeout /t 2 /nobreak > nul

echo.
echo ================================================
echo   SERVIDORES INICIADOS!
echo ================================================
echo.
echo   Site Institucional:
echo   http://localhost:5001/
echo.
echo   Area do Cliente:
echo   http://localhost:3000/login
echo.
echo ================================================
echo.
echo Aguardando 5 segundos e abrindo o navegador...
timeout /t 5 /nobreak

start http://localhost:5001/

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
