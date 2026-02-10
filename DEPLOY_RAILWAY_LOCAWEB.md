# Deploy fácil (Railway + Locaweb)

Este guia é para quem é iniciante. Você vai:
- subir o BACKEND (Node.js) no Railway
- subir o FRONTEND (React) na Locaweb
- usar o banco MySQL do Railway

## 1) Preparar uma conta no GitHub
O Railway precisa do código no GitHub.
1. Crie uma conta no GitHub: https://github.com
2. Crie um repositório novo (ex: app-os-inovaguil)
3. Envie esta pasta para o GitHub (pode ser pelo app GitHub Desktop ou pelo site)

## 2) Backend no Railway (Node + MySQL)
1. Acesse https://railway.app e crie conta.
2. Clique **New Project** → **Deploy from GitHub Repo**.
3. Escolha o repositório do projeto.
4. Quando aparecer a lista de serviços, crie um **MySQL**:
   - **Add** → **Database** → **MySQL**.
5. Abra o serviço do backend (Node) e configure as variáveis de ambiente:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_PORT`
   - `JWT_SECRET` (crie uma senha forte)
   - `FRONTEND_URL` (vai ser o domínio da Locaweb, ex: https://seusite.com.br)

> Onde pegar os dados do MySQL?
> No Railway, clique no serviço MySQL → **Connect** → copie Host, User, Password, Database e Port.

6. Em **Settings** do serviço do backend:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

7. Inicialize o banco (uma vez só):
   - no Railway, abra **Run** e execute: `npm run init-db`

8. Copie a URL pública do backend (ex: https://seu-backend.up.railway.app)

## 3) Frontend na Locaweb
1. No seu PC, abra a pasta `frontend`.
2. Crie um arquivo chamado `.env.production` dentro de `frontend` com:
   
   `REACT_APP_API_BASE_URL=https://SEU_BACKEND_RAILWAY`

3. No terminal, entre em `frontend` e rode:
   - `npm install`
   - `npm run build`

4. Isso vai criar a pasta `frontend/build`.
5. Envie TODO o conteúdo de `frontend/build` para a sua hospedagem Locaweb.
   - Aponte para a pasta pública do seu site (geralmente `public_html` ou `www`).

## 4) Teste e instalação como aplicativo
1. Abra o site pelo navegador.
2. No Chrome/Edge, clique em **Instalar aplicativo**.
3. No celular, use **Adicionar à tela inicial**.

## 5) Dúvidas comuns
- **Login não funciona**: verifique se `JWT_SECRET` está configurado no Railway.
- **Erro de CORS**: confira se `FRONTEND_URL` está correto.
- **API não responde**: confira se o serviço do backend está “Running” no Railway.

---
Se quiser, eu posso:
- revisar suas variáveis no Railway
- te orientar na criação do repositório GitHub
- validar o build do frontend
