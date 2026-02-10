$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body (@{email='admin@sistema.com'; senha='admin123'} | ConvertTo-Json) -ContentType 'application/json'
$token = $login.token

$lojaBody = @{
  nome        = 'Loja Teste SP'
  cnpj        = '12.345.678/0001-90'
  endereco    = 'Rua das Flores, 123'
  cidade      = 'São Paulo'
  estado      = 'SP'
  cep         = '01310-100'
  telefone    = '(11)98765-4321'
  email       = 'loja@teste.com'
  responsavel = 'João Silva'
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri 'http://localhost:5000/api/lojas' -Method POST -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body $lojaBody -ErrorAction Stop
$result | ConvertTo-Json
