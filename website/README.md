# 🏭 Site Institucional Inovaguil + Área do Cliente

## 📋 Descrição do Projeto

Este projeto integra um **site institucional moderno** inspirado no [inovaguil.com.br](https://inovaguil.com.br/) com a **Área do Cliente** completa para gerenciamento de solicitações de serviço.

### ✨ Características

- 🌐 **Site Institucional Responsivo**
  - Design moderno e profissional
  - Hero section impactante
  - Seções: Quem Somos, Serviços, Produtos, Clientes, Contato
  - Botão flutuante do WhatsApp
  - Animações suaves ao scroll
  - Menu mobile responsivo
  - 100% responsivo para todos os dispositivos

- 👤 **Área do Cliente Integrada**
  - Dashboard com estatísticas
  - Gerenciamento de solicitações
  - Perfil editável
  - Histórico de serviços
  - Contato com suporte
  - FAQ

## 🚀 Como Executar

### Pré-requisitos

- Node.js instalado (v14 ou superior)
- MySQL instalado e rodando
- Backend e Frontend do projeto já configurados

### 1️⃣ Executar o Backend

```powershell
# Navegar para a pasta do backend
cd "c:\Users\andna\OneDrive\PC Anderson\PC Anderson\Anderson\Documentos Computador Samsung\APP OS\backend"

# Instalar dependências (se necessário)
npm install

# Executar o servidor
node src/server-Anderson.js
```

O backend irá:
- ✅ Servir o site institucional na raiz (`/`)
- ✅ Servir a API em rotas `/api/*`
- ✅ Rodar na porta 5001

### 2️⃣ Executar o Frontend (Área do Cliente)

```powershell
# Navegar para a pasta do frontend
cd "c:\Users\andna\OneDrive\PC Anderson\PC Anderson\Anderson\Documentos Computador Samsung\APP OS\frontend"

# Instalar dependências (se necessário)
npm install

# Executar em modo desenvolvimento
npm start
```

O frontend React irá rodar na porta 3000 e terá as rotas:
- `/login` - Página de login
- `/cliente/*` - Área do cliente
- `/admin/*` - Área administrativa
- `/tecnico/*` - Área do técnico

### 3️⃣ Acessar o Sistema

#### Site Institucional
```
http://localhost:5001/
```

#### Área do Cliente
Clique no botão "Área do Cliente" no site institucional ou acesse diretamente:
```
http://localhost:3000/login
```

## 🌐 Estrutura do Projeto

```
APP OS/
├── website/              # Site institucional
│   ├── index.html       # Página principal
│   ├── styles.css       # Estilos CSS
│   └── script.js        # JavaScript de interação
│
├── frontend/            # React App - Área do Cliente
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Client/  # Componentes do cliente
│   │   │   ├── Admin/   # Componentes do admin
│   │   │   └── Technician/ # Componentes do técnico
│   │   └── App.js
│   └── package.json
│
└── backend/             # Node.js + Express API
    ├── src/
    │   ├── routes/      # Rotas da API
    │   ├── config/      # Configurações
    │   └── server-Anderson.js # Servidor principal
    └── package.json
```

## 📱 Funcionalidades do Site Institucional

### Hero Section
- Título impactante
- Botão para WhatsApp
- Animação de scroll suave
- Imagem de fundo profissional

### Quem Somos
- História da empresa
- Descrição dos serviços
- Imagem ilustrativa

### Serviços
- 4 cards de serviços principais:
  - Fresa
  - Torno
  - Soldas Especiais
  - Caldeiraria Leve

### Produtos
- Grid de produtos
- Ícones representativos
- Link para catálogo completo

### Estatísticas
- Anos de experiência
- Projetos concluídos
- Clientes satisfeitos
- Suporte 24/7

### Contato
- Endereço completo
- Telefone com link para WhatsApp
- E-mails (comercial e RH)

### Footer
- Links rápidos
- Botão para área do cliente
- Créditos

## 🎨 Design e Estilo

### Paleta de Cores
- **Primária**: #FF6B00 (Laranja)
- **Secundária**: #1a1a1a (Preto)
- **Texto**: #666 (Cinza)
- **Fundo claro**: #f8f9fa
- **Fundo escuro**: #1a1a1a

### Responsividade
- Desktop: Layout em grid completo
- Tablet: Layout adaptado
- Mobile: Menu hamburger, layout em coluna única

### Animações
- Fade in ao scroll
- Hover effects nos cards
- Contador animado nas estatísticas
- Scroll suave entre seções

## 🔐 Integração com Área do Cliente

### Acesso
O botão "Área do Cliente" está disponível em:
1. Menu de navegação superior
2. Seção do footer

### Fluxo de Usuário
```
Site Institucional → Clique "Área do Cliente" → Login → Dashboard Cliente
```

### Credenciais de Teste
```
Cliente:
- Email: cliente@teste.com
- Senha: senha123

Admin:
- Email: admin@teste.com
- Senha: admin123

Técnico:
- Email: tecnico@teste.com
- Senha: tecnico123
```

## 🛠️ Tecnologias Utilizadas

### Site Institucional
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- JavaScript ES6+
- Font Awesome (ícones)

### Backend
- Node.js
- Express.js
- MySQL
- JWT (autenticação)

### Frontend (Área do Cliente)
- React.js
- React Router
- Axios
- CSS Modules

## 📞 Contatos e Links

### WhatsApp
- Número: (11) 97704-0604
- Link direto integrado no site

### E-mails
- Comercial: comercial@grupoinovasp.com.br
- RH: rh@grupoinovasp.com.br

### Endereço
Rua Januária, n° 100, Galpão  
Chácaras Reunidas  
São José dos Campos, SP

## 🔧 Personalização

### Alterar Cores
Edite as variáveis CSS em [website/styles.css](website/styles.css):
```css
:root {
    --primary-color: #FF6B00;
    --secondary-color: #1a1a1a;
    /* ... */
}
```

### Alterar Conteúdo
Edite o arquivo [website/index.html](website/index.html) e modifique os textos e links conforme necessário.

### Adicionar Seções
1. Adicione o HTML no [index.html](website/index.html)
2. Estilize no [styles.css](website/styles.css)
3. Adicione interações no [script.js](website/script.js) se necessário

## 🚀 Deploy em Produção

### Opção 1: Servidor Próprio
1. Fazer upload dos arquivos para o servidor
2. Configurar nginx ou Apache para servir os arquivos
3. Apontar domínio para o servidor

### Opção 2: Serviços de Hospedagem
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, DigitalOcean, AWS

### Opção 3: All-in-One
- Usar o backend para servir tudo (configuração atual)
- Deploy no Heroku, Railway ou similar

## 📝 Notas Importantes

- ✅ O site é 100% responsivo
- ✅ Todos os links do WhatsApp estão configurados
- ✅ Navegação suave entre seções
- ✅ Integração perfeita com área do cliente
- ✅ SEO-friendly com meta tags apropriadas
- ✅ Performance otimizada

## 🐛 Solução de Problemas

### Site não carrega
- Verifique se o backend está rodando na porta 5001
- Acesse: http://localhost:5001/

### Área do Cliente não carrega
- Verifique se o frontend React está rodando na porta 3000
- Acesse: http://localhost:3000/login

### Imagens não aparecem
- As imagens usam URLs do Unsplash
- Certifique-se de ter conexão com internet

### Botões não funcionam
- Verifique o console do navegador (F12)
- Certifique-se que script.js está carregando

## 📄 Licença

Este projeto foi desenvolvido para a Inovaguil Manutenção.

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para Inovaguil Manutenção

---

**Última atualização**: Janeiro 2026
