# 🧪 GUIA DE TESTE - ÁREA DO CLIENTE

**Objetivo:** Testar toda a funcionalidade da nova área do cliente

---

## 🎯 Teste 1: Login e Dashboard

### Pré-requisito
- Sistema backend rodando
- Usuário cliente cadastrado no banco

### Passos
1. [ ] Acessar http://localhost:3000/login
2. [ ] Entrar com email de cliente
3. [ ] Clicar em "Login"
4. [ ] Verificar redirecionamento para `/cliente/dashboard`
5. [ ] Verificar se nome do cliente aparece no cabeçalho
6. [ ] Verificar se as 4 estatísticas aparecem
7. [ ] Verificar se os 6 cards de menu aparecem

### Resultado Esperado
✅ Dashboard carrega corretamente com todos os dados

---

## 🎯 Teste 2: Perfil do Cliente

### Passos
1. [ ] No dashboard, clicar em "⚙️ Perfil"
2. [ ] Redirecionamento para `/cliente/perfil`
3. [ ] Verificar se dados atuais estão preenchidos
4. [ ] Editar nome (adicionar espaço)
5. [ ] Editar telefone (11 98765-4321)
6. [ ] Selecionar estado (SP)
7. [ ] Preencher endereço (Rua Test, 123)
8. [ ] Preencher CEP (12345-678)
9. [ ] Clicar "Salvar"
10. [ ] Verificar mensagem de sucesso ✅
11. [ ] Recarregar a página
12. [ ] Verificar se dados foram salvos

### Resultado Esperado
✅ Dados são salvos corretamente e recuperados após reload

---

## 🎯 Teste 3: Histórico de Serviços

### Passos
1. [ ] No dashboard, clicar em "Ver Histórico"
2. [ ] Redirecionamento para `/cliente/historico`
3. [ ] Verificar se tabela aparece com colunas
4. [ ] Clicar em cada filtro de status:
   - [ ] Concluídos
   - [ ] Em Andamento
   - [ ] Atribuídos
   - [ ] Pendentes
   - [ ] Cancelados
5. [ ] Verificar se dados filtram corretamente
6. [ ] Para cada serviço, clicar em "👁️ Ver"
7. [ ] Verificar se redireciona para solicitações

### Resultado Esperado
✅ Filtros funcionam e dados são exibidos corretamente

---

## 🎯 Teste 4: Contato com Suporte

### Passos
1. [ ] No dashboard, clicar em "Contato"
2. [ ] Redirecionamento para `/cliente/contato`
3. [ ] Verificar se info de contato aparece:
   - [ ] Telefone
   - [ ] Email
   - [ ] WhatsApp
   - [ ] Horário
4. [ ] Verificar tempos de resposta
5. [ ] Preencher categoria (Dúvida)
6. [ ] Preencher assunto ("Teste de formulário")
7. [ ] Selecionar prioridade (Normal)
8. [ ] Escrever mensagem
9. [ ] Clicar "Enviar"
10. [ ] Verificar mensagem de sucesso ✅
11. [ ] Verificar redirecionamento automático

### Resultado Esperado
✅ Formulário é enviado e feedback aparece

### Verificar no Backend
```bash
# Ver se notificação foi criada
SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY data DESC LIMIT 1;
```

---

## 🎯 Teste 5: FAQ

### Passos
1. [ ] No dashboard, clicar em "FAQ"
2. [ ] Redirecionamento para `/cliente/faq`
3. [ ] Verificar se 12 perguntas aparecem
4. [ ] Clicar em primeira pergunta
5. [ ] Verificar se resposta aparece com animação
6. [ ] Clicar novamente
7. [ ] Verificar se fecha
8. [ ] Filtrar por "Solicitações"
9. [ ] Verificar se apenas 2 perguntas aparecem
10. [ ] Filtrar por "Conta"
11. [ ] Verificar se apenas 2 perguntas aparecem
12. [ ] Voltar para "Todos"
13. [ ] Clicar em "Falar com Suporte"
14. [ ] Verificar redirecionamento para contato

### Resultado Esperado
✅ Accordion funciona, filtros funcionam, navegação funciona

---

## 🎯 Teste 6: Responsividade Mobile

### Passos
1. [ ] Abrir Developer Tools (F12)
2. [ ] Clicar em "Toggle Device Toolbar" (Ctrl+Shift+M)
3. [ ] Selecionar iPhone 12 (390px)
4. [ ] Testar cada página:

#### Dashboard Mobile
- [ ] Cabeçalho responsivo
- [ ] Buttons não saem da tela
- [ ] Estatísticas em 2 colunas
- [ ] Cards em 1 coluna
- [ ] Próximos agendamentos legíveis

#### Perfil Mobile
- [ ] Formulário em coluna única
- [ ] Botão salvando em tela cheia
- [ ] Sem scroll horizontal

#### Histórico Mobile
- [ ] Tabela escrolável
- [ ] Filtro em 1 coluna
- [ ] Badges visíveis

#### Contato Mobile
- [ ] Info em 1 coluna
- [ ] Formulário legível
- [ ] Buttons grandes

#### FAQ Mobile
- [ ] Filtros ajustados
- [ ] Perguntas legíveis
- [ ] Resposta sem scroll

### Resultado Esperado
✅ Tudo funciona perfeitamente em mobile

---

## 🎯 Teste 7: Navegação

### Passos
1. [ ] No dashboard, clicar em "← Voltar" em cada página
2. [ ] Verificar se volta para dashboard

### Resultado Esperado
✅ Botão voltar funciona em todas as páginas

---

## 🎯 Teste 8: Logout

### Passos
1. [ ] No dashboard, clicar em "🚪 Sair"
2. [ ] Verificar redirecionamento para login
3. [ ] Acessar diretamente `/cliente/dashboard`
4. [ ] Verificar se redireciona para login

### Resultado Esperado
✅ Logout funciona e rotas são protegidas

---

## 🎯 Teste 9: Validação de Formulários

### Perfil
1. [ ] Deixar nome em branco
2. [ ] Tentar salvar
3. [ ] Verificar se mostra erro

### Contato
1. [ ] Deixar assunto vazio
2. [ ] Tentar enviar
3. [ ] Verificar se mostra erro
4. [ ] Deixar mensagem vazia
5. [ ] Verificar se mostra erro

### Resultado Esperado
✅ Validações funcionam

---

## 🎯 Teste 10: Performance

### Passos
1. [ ] Abrir DevTools (F12)
2. [ ] Ir para aba "Network"
3. [ ] Recarregar página
4. [ ] Verificar:
   - [ ] Tempo total de carregamento < 3s
   - [ ] Tamanho HTML < 50KB
   - [ ] Tamanho CSS < 100KB
   - [ ] Tamanho JS < 200KB

### Resultado Esperado
✅ Carregamento rápido

---

## 🎯 Teste 11: Erros de Console

### Passos
1. [ ] Abrir DevTools (F12)
2. [ ] Ir para aba "Console"
3. [ ] Recarregar cada página
4. [ ] Verificar se há erros vermelhos

### Resultado Esperado
✅ Sem erros de console (avisos é ok)

---

## 🎯 Teste 12: Dados Dinâmicos

### Pré-requisito
- Ter agendamentos em banco de dados

### Dashboard
1. [ ] Verificar se estatísticas refletem dados reais
2. [ ] Verificar se próximos agendamentos aparecem

### Histórico
1. [ ] Adicionar novo agendamento no banco
2. [ ] Recarregar histórico
3. [ ] Verificar se novo aparece

### Resultado Esperado
✅ Dados dinâmicos funcionam

---

## 📋 Checklist de Testes Completos

```
DASHBOARD
├─ [ ] Carrega corretamente
├─ [ ] Estatísticas aparecem
├─ [ ] Próximos agendamentos aparecem
├─ [ ] Buttons funcionam
├─ [ ] Logout funciona
└─ [ ] Responsivo

PERFIL
├─ [ ] Dados carregam
├─ [ ] Edição funciona
├─ [ ] Salvamento funciona
├─ [ ] Validação funciona
└─ [ ] Responsivo

HISTÓRICO
├─ [ ] Tabela carrega
├─ [ ] Filtros funcionam
├─ [ ] Botão detalhes funciona
└─ [ ] Responsivo

CONTATO
├─ [ ] Formulário funciona
├─ [ ] Validação funciona
├─ [ ] Envio funciona
├─ [ ] Info contato aparece
└─ [ ] Responsivo

FAQ
├─ [ ] Perguntas aparecem
├─ [ ] Accordion funciona
├─ [ ] Filtros funcionam
├─ [ ] Link contato funciona
└─ [ ] Responsivo

GERAL
├─ [ ] Sem erros console
├─ [ ] Performance OK
├─ [ ] Autenticação funciona
├─ [ ] Dados salvam corretamente
└─ [ ] Mobile OK
```

---

## 🐛 Bugs Encontrados

### Exemplos de Issues

Caso encontre um bug, documente assim:

```
Bug #1: Erro ao salvar perfil
- Localização: /cliente/perfil
- Ação: Preencher form e clicar salvar
- Resultado Esperado: Mensagem de sucesso
- Resultado Atual: Erro 500
- Navegador: Chrome 120
- Data: 29/01/2026
```

### Onde Reportar
- Email: dev@inovaguil.com.br
- Phone: (11) 3000-0000

---

## ✅ Teste de Aceitação Final

Se todos os testes acima passarem:

```
✅ Dashboard completo e funcional
✅ Perfil completo e funcional
✅ Histórico completo e funcional
✅ Contato completo e funcional
✅ FAQ completo e funcional
✅ Responsividade 100%
✅ Sem erros críticos
✅ Performance aceitável
✅ Pronto para produção
```

---

## 🚀 Próxima Etapa

Após testes bem-sucedidos:
1. Deploy em staging
2. Testes com usuários reais
3. Deploy em produção
4. Monitoramento ativo

---

**Data:** 29/01/2026
**Versão:** 1.0
**Responsável:** QA Team
