# 🚀 Guia de Instalação Completo - Sistema de Ordem de Serviço

## ⚠️ Pré-requisitos Necessários

Antes de começar, você precisa instalar:

### 1. Node.js (v16 ou superior)

**Download:** https://nodejs.org/

1. Baixe a versão LTS (recomendada)
2. Execute o instalador
3. Marque a opção "Automatically install necessary tools"
4. Reinicie o terminal após a instalação

**Verificar instalação:**
```powershell
node --version
npm --version
```

### 2. MySQL (v8 ou superior)

**Opção 1 - MySQL Community Server:**
- Download: https://dev.mysql.com/downloads/mysql/
- Durante instalação, defina senha do root
- Escolha porta padrão 3306

**Opção 2 - XAMPP (Mais fácil):**
- Download: https://www.apachefriends.org/
- Inclui MySQL, Apache e phpMyAdmin
- Iniciar MySQL pelo painel de controle

**Opção 3 - MySQL Workbench:**
- Interface gráfica para gerenciar MySQL
- Download: https://dev.mysql.com/downloads/workbench/

**Verificar instalação:**
```powershell
mysql --version
```

### 3. Git (Opcional, mas recomendado)

**Download:** https://git-scm.com/

---

## 📦 Instalação do Projeto

### Passo 1: Configurar o Backend

```powershell
# Navegar até a pasta do backend
cd "C:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\backend"

# Instalar dependências
npm install
```

**Se aparecer erro de npm:**
1. Reinicie o terminal
2. Recarregue as variáveis de ambiente:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Passo 2: Configurar Banco de Dados

1. **Iniciar o MySQL**
   - Se usando XAMPP: Abra o painel e clique em "Start" no MySQL
   - Se usando MySQL Server: Já deve estar rodando como serviço

2. **Editar arquivo .env**
   
   Abra o arquivo `backend/.env` e configure:

   ```env
   # Se você definiu senha no MySQL:
   DB_PASSWORD=sua_senha_do_mysql
   
   # Se não definiu senha (XAMPP geralmente vem sem senha):
   DB_PASSWORD=
   ```

3. **Criar o banco de dados e tabelas**

   ```powershell
   npm run init-db
   ```

   Você deverá ver:
   ```
   ✅ Banco de dados 'service_order_db' criado/verificado
   ✅ Tabela usuarios criada
   ✅ Tabela lojas criada
   ... (outras tabelas)
   
   📝 Credenciais de acesso padrão:
      Email: admin@sistema.com
      Senha: admin123
   ```

### Passo 3: Iniciar o Servidor

```powershell
# Modo desenvolvimento (recarrega automaticamente ao editar código)
npm run dev

# OU modo produção
npm start
```

Você deverá ver:
```
🚀 Servidor rodando na porta 5000
📍 URL: http://localhost:5000
🌍 Ambiente: development
✅ Conexão com MySQL estabelecida com sucesso!
```

### Passo 4: Testar a API

Abra o navegador e acesse:
- **Health Check:** http://localhost:5000/health
- **API Info:** http://localhost:5000/

Ou use PowerShell:
```powershell
# Testar health check
Invoke-WebRequest http://localhost:5000/health

# Testar login
$body = @{
    email = "admin@sistema.com"
    senha = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 🎨 Instalação do Frontend (Próximo Passo)

Depois que o backend estiver funcionando:

```powershell
cd "C:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\frontend"
npm install
npm run dev
```

---

## ❌ Solução de Problemas

### Problema: "npm não é reconhecido"

**Solução:**
1. Verifique se Node.js está instalado: abra um NOVO terminal
2. Recarregue variáveis de ambiente:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```
3. Se não funcionar, reinicie o computador

### Problema: "Erro ao conectar ao MySQL"

**Solução:**
1. Verifique se MySQL está rodando
2. Verifique usuário/senha no arquivo `.env`
3. Tente conectar manualmente:
   ```powershell
   mysql -u root -p
   ```

### Problema: "Porta 5000 já está em uso"

**Solução:**
Mude a porta no arquivo `.env`:
```env
PORT=5001
```

### Problema: "EACCES permission denied"

**Solução:**
Execute o terminal como Administrador

### Problema: Erro ao criar banco de dados

**Solução:**
Crie manualmente:
```sql
-- Abra MySQL
mysql -u root -p

-- Execute
CREATE DATABASE service_order_db;
USE service_order_db;

-- Depois rode
npm run init-db
```

---

## 📧 Configurar Email (Opcional)

Para enviar ordens de serviço por email:

### Gmail:
1. Ative verificação em 2 etapas
2. Gere senha de app: https://myaccount.google.com/apppasswords
3. Configure no `.env`:
   ```env
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASSWORD=senha_de_app_gerada
   ```

### Outlook:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=seu_email@outlook.com
EMAIL_PASSWORD=sua_senha
```

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado (verificar com `node --version`)
- [ ] MySQL instalado e rodando
- [ ] Dependências instaladas (`npm install` sem erros)
- [ ] Arquivo `.env` configurado
- [ ] Banco de dados criado (`npm run init-db` executado)
- [ ] Servidor iniciado (`npm run dev` rodando)
- [ ] API respondendo (http://localhost:5000/health retorna OK)

---

## 🎯 Próximos Passos

1. ✅ Backend funcionando
2. 🚧 Instalar e configurar Frontend
3. 🚧 Criar primeiras lojas
4. 🚧 Cadastrar técnicos
5. 🚧 Criar primeiro agendamento

---

**Precisa de ajuda?** 

Verifique se todos os pré-requisitos estão instalados e as configurações do `.env` estão corretas.
