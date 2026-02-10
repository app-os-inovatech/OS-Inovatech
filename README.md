# Sistema de Ordem de Serviço - Montagem e Manutenção

Sistema completo para gerenciamento de ordens de serviço de montagem e manutenção de cozinhas industriais.

## 🚀 Funcionalidades

### Por Perfil de Usuário:

#### 👨‍💼 Administrador
- Gerenciar usuários (Admin, Técnico, Cliente)
- Cadastrar e gerenciar lojas
- Cadastrar e gerenciar técnicos
- Atribuir técnicos aos agendamentos
- Visualizar todos os agendamentos
- Gerar relatórios

#### 👤 Cliente
- Criar agendamentos de serviço
- Consultar status dos agendamentos
- Ver técnico atribuído ao serviço
- Receber ordem de serviço por email

#### 🔧 Técnico
- Ver serviços atribuídos
- Iniciar e executar serviços
- Upload de fotos (antes/durante/depois)
- Preencher dados de execução
- Gerar ordem de serviço automática

## 📋 Pré-requisitos

- Node.js 16+ 
- MySQL 8+
- Git

## 🛠️ Instalação

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Editar .env com suas configurações
# Importante: Configure o MySQL e as credenciais de email
```

### 2. Configurar Banco de Dados

```bash
# Certifique-se de que o MySQL está rodando
# Execute o script de inicialização
npm run init-db
```

Este comando irá:
- Criar o banco de dados
- Criar todas as tabelas
- Criar usuário admin padrão

**Credenciais padrão:**
- Email: `admin@sistema.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha padrão após o primeiro acesso!

### 3. Iniciar Backend

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Ou modo produção
npm start
```

O servidor estará rodando em `http://localhost:5000`

### 4. Frontend (Próximo passo)

```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
APP OS/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (DB, permissões)
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── middleware/      # Autenticação, permissões, upload
│   │   ├── models/          # Modelos de dados
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Serviços (PDF, email)
│   │   ├── templates/       # Templates HTML
│   │   └── server.js        # Servidor principal
│   ├── uploads/             # Arquivos enviados
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes React
    │   ├── pages/           # Páginas por perfil
    │   ├── services/        # API calls
    │   ├── hooks/           # Custom hooks
    │   └── routes/          # Rotas protegidas
    └── package.json
```

## 🗄️ Banco de Dados

### Tabelas principais:
- `usuarios` - Usuários do sistema
- `lojas` - Lojas cadastradas
- `tecnicos` - Dados dos técnicos
- `cursos` - Certificações dos técnicos
- `agendamentos` - Agendamentos de serviço
- `fotos_servico` - Fotos dos serviços
- `ordem_servico` - Ordens de serviço geradas
- `logs_acesso` - Auditoria de acessos

## 🔐 Níveis de Acesso

### Admin
- Acesso total ao sistema
- Gerenciamento de usuários e configurações

### Cliente  
- Criar agendamentos
- Consultar seus agendamentos
- Ver técnicos atribuídos

### Técnico
- Ver agendamentos atribuídos
- Executar serviços
- Gerar ordens de serviço

## 📧 Configuração de Email

Para envio de emails (ordens de serviço), configure no `.env`:

### Gmail:
1. Ative a verificação em 2 etapas
2. Gere uma senha de app
3. Use no `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
```

## 🚀 Deploy

### Opções de Hospedagem:

**Backend:**
- Railway (recomendado)
- Render
- Heroku
- VPS (DigitalOcean, Hostinger)

**Frontend:**
- Vercel (recomendado)
- Netlify
- Cloudflare Pages

**Banco de Dados:**
- PlanetScale (MySQL gratuito)
- Railway
- AWS RDS

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/first-access-password` - Trocar senha no primeiro acesso

### Mais endpoints serão adicionados...

## 🧪 Testando a API

Use o Postman, Insomnia ou curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","senha":"admin123"}'

# Health Check
curl http://localhost:5000/health
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 👨‍💻 Autor

Desenvolvido para gerenciamento de montagem e manutenção de cozinhas industriais.

---

**Status do Projeto:** 🚧 Em Desenvolvimento

**Próximos Passos:**
- [ ] Frontend React
- [ ] CRUD de Lojas
- [ ] CRUD de Técnicos
- [ ] Sistema de Agendamentos
- [ ] Geração de PDF
- [ ] Deploy
