@echo off
REM Script simples para acessar via celular
REM Mostra o IP do seu PC para usar no celular

setlocal enabledelayedexpansion

cls
echo.
echo ================================
echo   ACESSO APP VIA CELULAR
echo ================================
echo.

REM Descobrir IP
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| find "IPv4"') do (
    set "IP=%%A"
    goto found_ip
)

:found_ip
set "IP=%IP: =%"
cls
echo.
echo ================================
echo   ACESSO APP VIA CELULAR
echo ================================
echo.
echo SEU IP: %IP%
echo.
echo COMO ACESSAR PELO CELULAR:
echo.
echo 1. Conecte o celular na mesma rede Wi-Fi deste PC
echo.
echo 2. Abra o navegador do celular
echo.
echo 3. Digite: http://%IP%:3000
echo.
echo 4. Faca login com suas credenciais
echo.
echo NOTA: Certifique-se que:
echo  - Backend esta rodando (npm start em backend/)
echo  - Frontend esta rodando (npm start em frontend/)
echo  - Ambos estao na mesma rede local
echo.
echo ================================
pause
