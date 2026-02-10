# Script para facilitar acesso via celular
# Execute este script no PowerShell do seu PC

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  🌐 Acesso APP via Celular" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Pega o IP do PC
Write-Host "📍 Descobrindo seu IP..." -ForegroundColor Yellow
$ipv4 = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"} | Where-Object {$_.IPAddress -notlike "127.0.0.1"} | Select-Object -First 1).IPAddress

if ($null -eq $ipv4) {
    Write-Host "❌ Não foi possível descobrir o IP. Verifique sua conexão de rede." -ForegroundColor Red
    exit
}

Write-Host "✅ Seu IP: $ipv4" -ForegroundColor Green
Write-Host ""

# 2. Verifica se backend está rodando
Write-Host "🔍 Verificando Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/auth" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend está rodando em http://localhost:5001" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend pode não estar rodando!" -ForegroundColor Yellow
    Write-Host "   Execute 'npm start' em backend/" -ForegroundColor Yellow
}

# 3. Verifica se frontend está rodando
Write-Host ""
Write-Host "🔍 Verificando Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Frontend está rodando em http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend pode não estar rodando!" -ForegroundColor Yellow
    Write-Host "   Execute 'npm start' em frontend/" -ForegroundColor Yellow
}

# 4. Mostra instruções
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  📱 INSTRUÇÕES PARA CELULAR" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Conecte seu celular na mesma rede Wi-Fi deste PC" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Abra o navegador e digite:" -ForegroundColor White
Write-Host "   http://$ipv4:3000" -ForegroundColor Cyan -BackgroundColor Black
Write-Host ""
Write-Host "3️⃣  Aguarde carregar (pode levar 30 segundos na primeira vez)" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Faça login com suas credenciais" -ForegroundColor White
Write-Host ""

# 5. Teste de conectividade
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  🧪 TESTE DE CONECTIVIDADE" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$testAddress = $ipv4
$testPort = 5001

Write-Host "Testando conexão para $testAddress`:$testPort..." -ForegroundColor Yellow

try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($testAddress, $testPort)
    
    if ($tcpClient.Connected) {
        Write-Host "✅ Backend acessível!" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "❌ Impossível conectar ao backend" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao testar conexão: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Qualquer problema? Verifique:" -ForegroundColor Cyan
Write-Host "  • Celular está na mesma rede Wi-Fi" -ForegroundColor White
Write-Host "  • Backend rodando (npm start)" -ForegroundColor White
Write-Host "  • Frontend rodando (npm start)" -ForegroundColor White
Write-Host "  • IP correto digitado no celular" -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan
