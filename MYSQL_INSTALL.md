# ⚡ Instalação Rápida do MySQL - Escolha UMA opção

## 🎯 OPÇÃO 1: XAMPP (MAIS FÁCIL - RECOMENDADO)

### Passo a Passo:

1. **Download:** https://www.apachefriends.org/download.html
   - Baixe a versão para Windows

2. **Instalação:**
   - Execute o instalador
   - Escolha componentes: Apache, MySQL, PHP, phpMyAdmin
   - Instale em: C:\xampp (padrão)

3. **Iniciar MySQL:**
   - Abra o "XAMPP Control Panel"
   - Clique em "Start" no MySQL
   - Deve ficar verde

4. **Configurar o projeto:**
   - Edite `backend/.env`
   - Certifique-se que está assim:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=service_order_db
   DB_PORT=3306
   ```
   (sem senha, deixe vazio mesmo)

---

## 🎯 OPÇÃO 2: MySQL Server Standalone

### Passo a Passo:

1. **Download:** https://dev.mysql.com/downloads/installer/
   - Escolha "mysql-installer-web-community"

2. **Instalação:**
   - Execute o instalador
   - Escolha "Developer Default"
   - **IMPORTANTE:** Defina uma senha para o root (ex: "root123")
   - Anote essa senha!

3. **Configurar o projeto:**
   - Edite `backend/.env`
   - Configure com SUA senha:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=root123
   DB_NAME=service_order_db
   DB_PORT=3306
   ```

4. **Verificar se está rodando:**
   ```powershell
   # No PowerShell
   mysql -u root -p
   # Digite a senha quando pedir
   ```

---

## ✅ Depois de Instalar e Iniciar MySQL:

```powershell
# Volte para a pasta do backend
cd "C:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\backend"

# Criar banco de dados e tabelas
npm run init-db

# Iniciar servidor
npm run dev
```

---

## 🚨 Qual escolher?

**XAMPP:** 
- ✅ Mais fácil
- ✅ Interface gráfica
- ✅ Não precisa senha
- ✅ Vem com phpMyAdmin (interface web)

**MySQL Server:**
- ⚠️ Mais configuração
- ✅ Mais leve
- ✅ Serviço do Windows (inicia automaticamente)

---

**Recomendo: XAMPP se você não tem experiência com MySQL**
