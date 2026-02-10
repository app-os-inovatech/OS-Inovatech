# ❓ Por Que Manuais Não Aparecem?

## 🎯 Diagnóstico Rápido

A seção "Manuais" **só aparece para usuários ADMIN**. 

**Possíveis motivos:**
1. ❌ Você está logado como **TÉCNICO** ou **CLIENTE**
2. ❌ Seu usuário **não é admin** no banco de dados
3. ⚠️ Token expirou ou sessão foi perdida

## 🔐 Solução Rápida

### Opção 1: Logar com Usuário Admin
Se você tiver outro usuário admin, faça logout e login com esse:
- Email: (peça ao admin da empresa)
- Senha: (aquela combinada com o admin)

### Opção 2: Promover Seu Usuário para Admin
Se você quer administrar manuais, peça ao admin para:
1. Abrir a aplicação
2. Ir em **Admin > Usuários**
3. Procurar seu email
4. Mudar o **Tipo** para **"admin"**
5. Salvar

Depois você fará logout e login novamente, e verá o menu de Manuais.

### Opção 3: Criar um Novo Usuário Admin
Se nenhum usuário for admin, execute a query SQL:

```sql
-- Primeiro, verifique quais admins existem
SELECT email, tipo FROM usuarios WHERE tipo = 'admin';

-- Se nenhum for encontrado, crie um (execute no banco):
UPDATE usuarios SET tipo = 'admin' WHERE email = 'SEU_EMAIL_AQUI';
```

**Como executar:**
1. Abra MySQL Workbench ou phpMyAdmin
2. Cole a query acima
3. Clique em executar
4. Faça logout e login novamente

## ✅ Como Saber Se Sou Admin

1. Acesse **http://192.168.0.20:3000** no celular
2. Abra **DevTools** (F12 ou Menu > Opções do Desenvolvedor)
3. Vá em **Console**
4. Digite: `JSON.parse(localStorage.getItem('usuario')).tipo`
5. Se retornar `"admin"` = ✅ Você é admin
6. Se retornar `"tecnico"` ou `"cliente"` = ❌ Você não é admin

## 📋 Checklist de Resolução

- [ ] Abri DevTools (F12) no celular
- [ ] Verifiquei meu tipo de usuário (deve ser "admin")
- [ ] Se não sou admin, pedi para elevar minha permissão
- [ ] Fiz logout e login novamente (Ctrl+Shift+Delete para limpar cache)
- [ ] Esperei 10 segundos para página carregar
- [ ] Agora vejo o botão "Manuais" no dashboard

## 🆘 Se Mesmo Assim Não Funcionar

Me informa:
1. **Qual email você está usando?**
2. **Qual tipo aparece no console?** (`"admin"`, `"tecnico"` ou `"cliente"`)
3. **Consegue ver outras seções?** (Técnicos, Lojas, etc)
4. **Qual erro aparece em vermelho no DevTools?**

---

**Próximos passos:** Assim que você for admin, conseguirá:
- ✅ Ver biblioteca de manuais
- ✅ Upload de novos manuais
- ✅ Upload de vídeos
- ✅ Editar e deletar manuais
