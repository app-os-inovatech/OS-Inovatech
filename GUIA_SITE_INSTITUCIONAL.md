# 🌐 GUIA DE ACESSO AO SITE INSTITUCIONAL

## 📱 Como Testar o Sistema Completo

### 1️⃣ Iniciar o Sistema

Execute o arquivo: **`iniciar-sistema.bat`**

Este script irá:
- ✅ Iniciar o backend na porta 5001
- ✅ Iniciar o frontend na porta 3000
- ✅ Abrir automaticamente o navegador

### 2️⃣ Acessar o Site Institucional

**No Computador:**
```
http://localhost:5001/
```

**No Celular (mesma rede Wi-Fi):**
```
http://[IP_DO_COMPUTADOR]:5001/
```

Para descobrir o IP do computador:
```powershell
ipconfig
```
Procure por "Endereço IPv4" (ex: 192.168.1.100)

### 3️⃣ Acessar a Área do Cliente

**Pelo Site:**
- Clique no botão "Área do Cliente" no menu
- Ou clique no botão no footer

**Direto:**
```
http://localhost:3000/login
```

**No Celular:**
```
http://[IP_DO_COMPUTADOR]:3000/login
```

## 🔐 Credenciais de Teste

### Cliente
```
Email: cliente@teste.com
Senha: senha123
```

### Administrador
```
Email: admin@teste.com
Senha: admin123
```

### Técnico
```
Email: tecnico@teste.com
Senha: tecnico123
```

## 📋 Fluxo de Teste Completo

### 1. Site Institucional
- ✅ Navegar pelas seções (Hero, Quem Somos, Serviços, Produtos, Clientes, Contato)
- ✅ Testar menu mobile (em telas pequenas)
- ✅ Clicar nos botões do WhatsApp
- ✅ Scroll suave entre seções
- ✅ Animações ao scroll

### 2. Integração com Área do Cliente
- ✅ Clicar em "Área do Cliente" no menu
- ✅ Fazer login como cliente
- ✅ Visualizar dashboard
- ✅ Criar nova solicitação
- ✅ Editar perfil
- ✅ Ver histórico

### 3. Teste de Responsividade
- ✅ Desktop (1920x1080)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

## 🎨 Características do Site

### Design Moderno
- Cores vibrantes (laranja e preto)
- Tipografia limpa e legível
- Espaçamento generoso
- Imagens de alta qualidade

### Interatividade
- Animações suaves
- Hover effects
- Scroll suave
- Menu responsivo

### Performance
- Carregamento rápido
- Imagens otimizadas
- CSS minificado
- JavaScript eficiente

## 📞 Links e Contatos

### WhatsApp
- Número: (11) 97704-0604
- Todos os botões redirecionam para o WhatsApp com mensagem pré-definida

### E-mails
- Comercial: comercial@grupoinovasp.com.br
- RH: rh@grupoinovasp.com.br

## 🔧 Personalização Rápida

### Mudar Cores
Edite `website/styles.css`:
```css
:root {
    --primary-color: #FF6B00;  /* Cor principal */
    --secondary-color: #1a1a1a; /* Cor secundária */
}
```

### Mudar Textos
Edite `website/index.html` e procure o texto que deseja alterar.

### Adicionar Imagens
Substitua as URLs do Unsplash por URLs de suas próprias imagens.

## 🚀 Deploy em Produção

### Opção Simples
1. Faça upload da pasta `website/` para seu servidor
2. Configure o domínio
3. Pronto!

### Opção com Backend
O backend já está configurado para servir o site institucional.
Basta fazer deploy do backend completo.

## 📱 Testar no Celular

### Passo a Passo
1. Conecte o celular na mesma rede Wi-Fi do computador
2. Execute `ipconfig` no computador e anote o IP
3. No celular, acesse: `http://[IP]:5001/`
4. Pronto! O site está funcionando

### Exemplo
Se seu IP é `192.168.1.100`:
```
http://192.168.1.100:5001/
```

## ✅ Checklist de Teste

- [ ] Site carrega corretamente
- [ ] Menu de navegação funciona
- [ ] Scroll suave entre seções
- [ ] Botões do WhatsApp funcionam
- [ ] Animações aparecem ao rolar
- [ ] Menu mobile funciona (em tela pequena)
- [ ] Botão "Área do Cliente" redireciona
- [ ] Login funciona
- [ ] Dashboard do cliente carrega
- [ ] Site responsivo em mobile
- [ ] Todas as imagens carregam
- [ ] Footer com links corretos

## 🐛 Problemas Comuns

### Site não carrega
**Solução:** Verifique se o backend está rodando
```powershell
cd backend
node src/server-Anderson.js
```

### Área do cliente não funciona
**Solução:** Verifique se o frontend está rodando
```powershell
cd frontend
npm start
```

### Não consigo acessar do celular
**Solução:** 
1. Verifique se está na mesma rede Wi-Fi
2. Verifique o firewall do Windows
3. Use o IP correto (não use localhost)

## 📊 Estrutura de Arquivos

```
website/
├── index.html      # HTML principal
├── styles.css      # Todos os estilos
├── script.js       # JavaScript de interação
└── README.md       # Este arquivo
```

## 💡 Dicas

1. **Performance**: O site usa imagens do Unsplash. Em produção, use imagens hospedadas localmente.

2. **SEO**: Adicione meta tags específicas para seu negócio no `<head>` do HTML.

3. **Analytics**: Adicione Google Analytics no `script.js` se desejar.

4. **Segurança**: Em produção, use HTTPS sempre.

5. **Backup**: Faça backup regular dos arquivos.

---

**Desenvolvido para Inovaguil Manutenção** 🏭
