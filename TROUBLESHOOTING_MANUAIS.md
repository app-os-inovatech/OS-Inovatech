# 🔍 Troubleshooting - Manuais Não Aparecem

## ✅ Pré-requisitos para Ver Manuais

- ✅ Você DEVE estar logado como **ADMIN**
- ✅ Ter permissão na tabela `usuarios` com `tipo = 'admin'`
- ✅ Estar na área **Admin Dashboard**

## 🚨 Problema: Não Consigo Acessar Manuais

### Passo 1: Verifique se é Admin
1. Abra DevTools no navegador (F12 ou Ctrl+Shift+I)
2. Vá em Console
3. Digite: `JSON.parse(localStorage.getItem('usuario'))`
4. Procure por `"tipo": "admin"`

**Se vir:**
```javascript
{
  id: 2,
  nome: "Administrador",
  email: "admin@example.com",
  tipo: "admin"     // ✅ Deve ser "admin"
}
```

### Passo 2: Se NÃO é Admin
Você precisa:
- Deslogar
- Logar com usuário **admin**
- Ou pedir ao admin para mudar seu tipo de usuário

### Passo 3: Verifique Conectividade
1. No Console (F12), digite: `fetch('http://192.168.0.20:5001/api/manuais')`
2. Deve retornar uma Promise (se der erro é problema de conexão)

### Passo 4: Verifique Token
1. No Console, digite: `localStorage.getItem('token')`
2. Deve aparecer um texto longo começando com `eyJ`
3. Se estiver vazio = precisa fazer login novamente

## 🔧 Solução Rápida

### Se é Admin mas não vê o botão:
1. **Recarregue a página** (Ctrl+F5 ou puxe para baixo no celular)
2. **Limpe o cache:**
   - Chrome: Menu > Configurações > Privacidade > Limpar dados de navegação
   - Safari: Configurações > Safari > Limpar histórico e dados
3. **Faça login novamente**

### Se é Técnico mas quer acessar Manuais:
- **Técnicos SÓ conseguem criar/editar** manuais, não listar
- Precisa de acesso de **Admin** para gerenciar manuais

## 📱 Qual Usuário Tenho Acesso?

### Admin pode:
- ✅ Listar todos os manuais
- ✅ Criar novos manuais
- ✅ Editar manuais
- ✅ Deletar manuais
- ✅ Upload de vídeos

### Técnico pode:
- ✅ Consultar manuais
- ⚠️ Criar e editar próprios manuais
- ❌ Deletar manuais de outros

### Cliente pode:
- ✅ Ver manuais
- ❌ Criar/editar/deletar

## 🆘 Se Ainda Não Funcionar

1. **Deslogue completamente:**
   - Clique em Logout
   - Feche o navegador

2. **Faça login como Admin:**
   - Email: `admin@example.com` (ou seu email admin)
   - Senha: A senha que você configurou

3. **Na página de Admin Dashboard:**
   - Procure pelo card "📚 Manuais"
   - Clique em "Acessar"

4. **Se ainda assim não aparecer:**
   - Abra DevTools (F12)
   - Vá em Console
   - Copie os erros que aparecerem em vermelho
   - Compartilhe comigo

## 📋 Checklist de Verificação

- [ ] Estou logado como Admin (tipo: "admin")
- [ ] Token no localStorage não está vazio
- [ ] Consegui fazer login sem erros
- [ ] Estou na página de Admin Dashboard (URL: /admin/dashboard)
- [ ] Recarreguei a página (Ctrl+F5)
- [ ] Esperei 5 segundos para a página carregar completamente
- [ ] O servidor backend está rodando (verifique no PC)
- [ ] Consigo acessar outras seções (Técnicos, Lojas, etc)

---

**Se mesmo assim não funcionar, me diga:**
1. Qual email você está usando para login?
2. Qual tipo de usuário aparece no console?
3. Qual erro aparece em vermelho no DevTools?
