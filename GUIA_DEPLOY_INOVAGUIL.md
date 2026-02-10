# 🌐 GUIA DE IMPLEMENTAÇÃO - DOMÍNIO INOVAGUIL.COM.BR

## 📋 Resumo

Este guia detalha como configurar seu sistema para ser acessível em **https://inovaguil.com.br/** de forma profissional e segura.

---

## 🎯 O que você precisa fazer

### 1️⃣ **Registrar/Configurar o Domínio**

Se ainda não tem:
- Registrar `inovaguil.com.br` em um registrador (GoDaddy, Namecheap, etc)
- Custo: ~R$ 30-50/ano

Se já tem:
- Acessar painel de controle do registrador
- Configurar DNS apontando para seu servidor

---

### 2️⃣ **Opções de Hosting**

#### ✅ **Opção A: VPS (Recomendado para Produção)**
- **Provedores:** DigitalOcean, Linode, AWS, Azure, HostGator VPS
- **Custo:** R$ 50-200/mês
- **Vantagens:**
  - Controle total
  - Escalável
  - SSL grátis
  - Suporte técnico

**Setup básico:**
```bash
# 1. Alugar VPS Linux (Ubuntu 20.04+)
# 2. Instalar Node.js e npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2 (gerenciador de processos)
npm install -g pm2

# 4. Instalar Nginx (reverse proxy)
sudo apt-get install -y nginx

# 5. Instalar SSL (Let's Encrypt)
sudo apt-get install -y certbot python3-certbot-nginx
```

#### ✅ **Opção B: Heroku**
- **Custo:** Gratuito até 5 apps (com limitações), pago a partir de $7/mês
- **Vantagens:**
  - Fácil deploy
  - Automático SSL
  - Sem preocupação com infraestrutura

#### ✅ **Opção C: Vercel (para Frontend)**
- **Custo:** Gratuito para hobby
- **Vantagens:**
  - Otimizado para React
  - Deploy automático do GitHub
  - CDN global

---

## 🚀 Setup Completo para Produção

### Arquitetura Recomendada

```
inovaguil.com.br
    ├─ Frontend React (Port 3000 internamente)
    │  └─ Vercel ou Nginx
    └─ Backend Node.js (Port 5000 internamente)
       └─ PM2 + Nginx reverse proxy
```

### Passo 1: Configurar Backend com PM2

```bash
# 1. Clone seu repositório
cd /home/app
git clone seu-repositorio
cd APP\ OS

# 2. Instale dependências
cd backend
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com configurações de produção

# 4. Inicie com PM2
pm2 start src/server.js --name "app-backend"
pm2 startup
pm2 save
```

### Passo 2: Configurar Nginx (Reverse Proxy)

**Arquivo:** `/etc/nginx/sites-available/inovaguil`

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name inovaguil.com.br www.inovaguil.com.br;
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS principal
server {
    listen 443 ssl http2;
    server_name inovaguil.com.br www.inovaguil.com.br;

    # Certificado SSL
    ssl_certificate /etc/letsencrypt/live/inovaguil.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inovaguil.com.br/privkey.pem;

    # Segurança SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads/ {
        alias /home/app/APP\ OS/backend/uploads/;
        expires 30d;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1024;
}
```

### Passo 3: Ativar Configuração Nginx

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/inovaguil /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Passo 4: Configurar SSL com Let's Encrypt

```bash
# Obter certificado
sudo certbot certonly --nginx -d inovaguil.com.br -d www.inovaguil.com.br

# Renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Passo 5: Configurar Frontend (React)

**Option 1: Build Estático (Recomendado)**

```bash
cd frontend
npm install
npm run build

# Servir com Nginx (adicionar ao servidor.conf acima)
location / {
    root /home/app/APP\ OS/frontend/build;
    try_files $uri /index.html;
    expires 1d;
}
```

**Option 2: Node Server**

```bash
# Instalar serve
npm install -g serve

# Iniciar
pm2 start "serve -s build -l 3000" --name "app-frontend"
```

---

## 🔧 Variáveis de Ambiente - Produção

**Backend - .env**

```env
# Servidor
NODE_ENV=production
PORT=5000
HOSTNAME=localhost

# Banco de Dados
DB_HOST=localhost
DB_USER=app_user
DB_PASSWORD=senha_super_segura
DB_NAME=app_db
DB_PORT=3306

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui_com_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua_senha_app_email

# URL Frontend
FRONTEND_URL=https://inovaguil.com.br
API_URL=https://inovaguil.com.br/api

# AWS S3 (opcional, para upload)
AWS_REGION=sa-east-1
AWS_BUCKET=seu-bucket
AWS_ACCESS_KEY=sua-chave
AWS_SECRET_KEY=sua-secreta

# Logs
LOG_LEVEL=info
```

---

## 📊 Monitoramento e Manutenção

### Verificar Status

```bash
# Ver processos PM2
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver status Nginx
sudo systemctl status nginx

# Ver uso de recursos
pm2 monit
```

### Backups Automáticos

```bash
# Criar script de backup
sudo nano /etc/cron.daily/app-backup

#!/bin/bash
# Backup do banco de dados
mysqldump -u app_user -p$DB_PASSWORD app_db > /backups/db-$(date +%Y%m%d).sql

# Backup da pasta uploads
tar -czf /backups/uploads-$(date +%Y%m%d).tar.gz /home/app/APP\ OS/backend/uploads/

# Limpeza de backups antigos
find /backups -name "*.sql" -mtime +30 -delete
find /backups -name "*.tar.gz" -mtime +30 -delete

# Permitir execução
sudo chmod +x /etc/cron.daily/app-backup
```

---

## 🔐 Checklist de Segurança

- [ ] SSL/TLS configurado e ativo (HTTPS)
- [ ] Firewall configurado (ufw ou iptables)
- [ ] MySQL rodando com credenciais seguras
- [ ] Senhas JWT e email seguras
- [ ] Backup automático do banco de dados
- [ ] Logs centralizados
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança adicionados
- [ ] Senhas default alteradas

---

## 🌐 Configurar DNS

No painel do seu registrador, adicione os registros:

```
Type: A
Name: @
Value: [SEU_IP_DO_VPS]
TTL: 3600

Type: CNAME
Name: www
Value: inovaguil.com.br
TTL: 3600
```

---

## 📞 Suporte para Deploy

### Provedores Recomendados

| Provedor | Custo | Tipo | URL |
|----------|-------|------|-----|
| DigitalOcean | $5-20/mês | VPS | https://m.do.co/c/1234 |
| Linode | $5-20/mês | VPS | https://linode.com |
| HostGator | $10/mês | VPS | https://hostgator.com |
| Heroku | Grátis-$7+ | PaaS | https://heroku.com |
| Vercel | Grátis-$20/mês | Hosting | https://vercel.com |

---

## 🎯 Próximas Etapas

1. ✅ Escolher provedor de hosting
2. ✅ Registrar/configurar domínio
3. ✅ Fazer deploy do código
4. ✅ Configurar banco de dados
5. ✅ Testar funcionamento completo
6. ✅ Configurar monitoramento
7. ✅ Lançar para produção

---

**Estimativa de Tempo:** 4-8 horas
**Nível de Dificuldade:** Médio-Avançado
**Precisa de Ajuda?** Contate: dev@inovaguil.com.br
