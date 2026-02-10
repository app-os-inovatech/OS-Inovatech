# Guia de Testes - Sistema de Controle de Acesso por Papel (RBAC)

## 📋 Resumo das Implementações

Este documento descreve como testar todas as funcionalidades implementadas no sistema de controle de acesso baseado em papéis (Role-Based Access Control).

### Funcionalidades Implementadas:

1. **✅ Sistema de Autenticação com Papéis**
   - 3 tipos de usuários: Admin, Técnico, Cliente
   - JWT armazenado em localStorage com tipo de usuário
   - Rotas protegidas por papel

2. **✅ Exportação de Ordem de Serviço em PDF**
   - Captura do formulário como imagem via html2canvas
   - Geração de PDF multi-página com jsPDF
   - Download automático do arquivo

3. **✅ Importação de Clientes em Lote**
   - Suporte a CSV e Excel (.xlsx)
   - Validação de dados (nome e email obrigatórios)
   - Visualização prévia antes de importação
   - Inserção em banco com hash de senha

4. **✅ Atribuição de Usuários a Técnicos**
   - Interface para selecionar técnico responsável
   - Atualização em tempo real
   - Opção de remover atribuição

5. **✅ Menu Lateral com Navegação Baseada em Papel**
   - Admin: acesso a todas as funcionalidades
   - Técnico: acesso a seus próprios dados
   - Cliente: acesso limitado a agendamentos e relatórios

---

## 🔐 Credenciais de Teste

### Usuário Administrativo (padrão):
```
Email: admin@sistema.com
Senha: admin123
Tipo: admin
```

### Usuários de Teste para Importação:
Você pode criar via ImportarClientes ou via SQL:

**Técnico:**
```sql
INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo) 
VALUES ('João Técnico', 'joao@tecnico.com', '$2a$10$...', 'tecnico', 1);
```

**Cliente:**
```sql
INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo) 
VALUES ('Maria Cliente', 'maria@cliente.com', '$2a$10$...', 'cliente', 1);
```

---

## 🧪 Fluxos de Teste Completos

### Teste 1: Fluxo do Administrador

**Objetivo:** Validar que admin tem acesso a todas as funcionalidades

**Passos:**

1. **Login**
   - [ ] Acesse `http://localhost:3000`
   - [ ] Faça login com `admin@sistema.com` / `admin123`
   - [ ] Verifique que aparece a mensagem "Bem-vindo, Admin!"

2. **Verificar Menu Lateral**
   - [ ] O sidebar deve mostrar 8 opções:
     - Dashboard
     - Técnicos
     - Lojas
     - Clientes
     - Importar Clientes
     - Atribuir Usuários
     - Agendamentos
     - Ordem de Serviço
     - Relatórios

3. **Testar Importação de Clientes**
   - [ ] Clique em "Importar Clientes"
   - [ ] Crie um arquivo CSV ou Excel com dados:
     ```
     nome,email,telefone,cpf
     João Silva,joao@example.com,11987654321,123.456.789-00
     Maria Santos,maria@example.com,11987654322,987.654.321-00
     ```
   - [ ] Selecione o arquivo
   - [ ] Verifique a preview (deve mostrar as 2 linhas)
   - [ ] Clique em "Importar"
   - [ ] Verifique mensagem de sucesso

4. **Testar Atribuição de Usuários**
   - [ ] Clique em "Atribuir Usuários"
   - [ ] Deve mostrar a lista de usuários (incluindo os importados)
   - [ ] Selecione um usuário e atribua um técnico
   - [ ] Clique em atualizar
   - [ ] Verifique que o técnico foi atribuído

5. **Testar Criação de OS e Exportação PDF**
   - [ ] Clique em "Ordem de Serviço"
   - [ ] Preencha os campos:
     - Loja (selecione)
     - Cliente (selecione um dos importados)
     - Data
     - Descrição
     - Fotos (optional)
   - [ ] Clique em "Exportar PDF"
   - [ ] Verifique que um arquivo PDF foi baixado
   - [ ] Abra o PDF e verifique o conteúdo

6. **Logout**
   - [ ] Clique em logout no sidebar
   - [ ] Verifique que retorna à página de login

**Resultado Esperado:** ✅ Todas as funcionalidades acessíveis, menu completo

---

### Teste 2: Fluxo do Técnico

**Objetivo:** Validar restrições de acesso para usuários técnicos

**Pré-requisitos:**
- Usuário técnico criado (tipo = 'tecnico')
- Técnico tem acesso a http://localhost:3000/admin/tecnicos (rota compartilhada)

**Passos:**

1. **Criar Usuário Técnico (se não existir)**
   - [ ] Como admin, vá para "Importar Clientes"
   - [ ] Importe um arquivo com dados de técnico
   - [ ] Ou execute SQL:
   ```sql
   INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo) 
   VALUES ('João Silva', 'joao@tecnico.com', '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmGEJwa', 'tecnico', 1);
   ```

2. **Login como Técnico**
   - [ ] Faça logout (se necessário)
   - [ ] Acesse `http://localhost:3000`
   - [ ] Faça login com credenciais do técnico
   - [ ] Verifique mensagem de boas-vindas com nome do técnico

3. **Verificar Menu Lateral Restrito**
   - [ ] Menu deve mostrar apenas:
     - Dashboard
     - Minhas Ordens de Serviço
     - Agendamentos
     - Relatórios
   - [ ] Não deve ver: Técnicos, Lojas, Clientes, Importar, Atribuir

4. **Tentar Acessar Rota Protegida**
   - [ ] Tente acessar manualmente `http://localhost:3000/admin/tecnicos`
   - [ ] Deverá ver "Acesso Negado" ou redirecionar

5. **Acessar Rotas Compartilhadas**
   - [ ] Clique em "Agendamentos"
   - [ ] Deve carregar sem erro (disponível para múltiplos papéis)
   - [ ] Clique em "Minhas Ordens de Serviço"
   - [ ] Deve mostrar lista vazia ou ordens atribuídas

**Resultado Esperado:** ✅ Menu restrito, acesso negado a admin routes, acesso a rotas compartilhadas

---

### Teste 3: Fluxo do Cliente

**Objetivo:** Validar experiência com menos funcionalidades para clientes

**Pré-requisitos:**
- Usuário cliente criado (tipo = 'cliente')

**Passos:**

1. **Criar Usuário Cliente**
   - [ ] Importe cliente via ImportarClientes ou SQL:
   ```sql
   INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo) 
   VALUES ('Ana Cliente', 'ana@cliente.com', '$2b$10$...', 'cliente', 1);
   ```

2. **Login como Cliente**
   - [ ] Faça logout
   - [ ] Login com credenciais do cliente
   - [ ] Verifique mensagem de boas-vindas

3. **Verificar Menu Minimal**
   - [ ] Menu deve mostrar apenas:
     - Dashboard
     - Meus Agendamentos
     - Meus Relatórios
   - [ ] Não deve ver nenhuma opção administrativa

4. **Verificar Acesso Negado**
   - [ ] Tente acessar `http://localhost:3000/admin/clientes`
   - [ ] Deverá ver "Acesso Negado"
   - [ ] Tente `http://localhost:3000/admin/tecnicos`
   - [ ] Deverá ver "Acesso Negado"

5. **Testar Rotas Disponíveis**
   - [ ] Clique em "Meus Agendamentos"
   - [ ] Deve carregar sem erro
   - [ ] Clique em "Meus Relatórios"
   - [ ] Deve carregar sem erro

**Resultado Esperado:** ✅ Menu mínimo, acesso negado a rotas protegidas, acesso a rotas de cliente

---

## 🔍 Verificações Técnicas

### Verificar localStorage
Abra o DevTools (F12) → Application → localStorage → Verifique a chave "user":

```json
{
  "id": 1,
  "email": "admin@sistema.com",
  "nome": "Admin",
  "tipo": "admin"
}
```

### Verificar Token JWT
No localStorage, a chave "token" deve conter um JWT válido (começa com "eyJ")

### Verificar Banco de Dados
```sql
-- Listar todos os usuários com papéis
SELECT id, nome, email, tipo, tecnico_id FROM usuarios;

-- Verificar se importação funcionou
SELECT COUNT(*) FROM usuarios WHERE tipo = 'cliente';

-- Verificar atribuições de técnico
SELECT u.nome, u.email, u.tipo, t.nome as tecnico FROM usuarios u 
LEFT JOIN usuarios t ON u.tecnico_id = t.id;
```

### Verificar Servidor
Confirme que ambos os servidores estão rodando:

```powershell
# Backend (port 5000)
cd "c:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\backend"
npm start
# Deve mostrar: 🚀 Servidor rodando na porta 5000

# Frontend (port 3000)
cd "c:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\frontend"
npm start
# Deve mostrar: Compiled successfully!
```

---

## 📊 Checklist de Validação

### Segurança
- [ ] Token JWT é armazenado e enviado em requisições
- [ ] Rotas protegidas retornam 401 sem token válido
- [ ] Rotas restritas por papel retornam 403 com papel incorreto
- [ ] Senhas não são nunca retornadas pela API

### Funcionalidades de Admin
- [ ] PDF exporta corretamente com todos os campos
- [ ] CSV/Excel importa sem duplicatas
- [ ] Atribuição de técnico salva e persiste após refresh
- [ ] Menu mostra todas as 8 opções

### Funcionalidades de Técnico
- [ ] Menu mostra exatamente 4 opções
- [ ] Acesso negado a rotas de admin
- [ ] Pode acessar rotas compartilhadas

### Funcionalidades de Cliente
- [ ] Menu mostra exatamente 3 opções
- [ ] Acesso negado a qualquer rota de admin
- [ ] Pode acessar rotas compartilhadas

### Banco de Dados
- [ ] Coluna `tipo` está presente e preenchida em `usuarios`
- [ ] Coluna `tecnico_id` está presente e permite NULL
- [ ] Imports criam registros com `tipo='cliente'`

### Layout e UX
- [ ] Sidebar mostra nome do usuário logado
- [ ] Logout funciona e limpa localStorage
- [ ] Redirect após login funciona corretamente
- [ ] Mensagem "Bem-vindo" mostra nome real do usuário

---

## 🐛 Troubleshooting

### Problema: Login não funciona
- [ ] Verifique se backend está rodando: `http://localhost:5000`
- [ ] Verifique senha: admin123 (sem espaços)
- [ ] Verifique MySQL está rodando
- [ ] Verifique logs: `npm run init-db` para resetar

### Problema: Menu não aparece
- [ ] Verifique localStorage tem chave "user"
- [ ] Verifique Layout.js está sendo importado em App.js
- [ ] Verifique console (F12 → Console) para erros
- [ ] Tente fazer logout e login novamente

### Problema: Acesso negado em rotas que deveria ter acesso
- [ ] Verifique user.tipo no localStorage (F12 → Application)
- [ ] Verifique PrivateRoute tem requiredRole correto
- [ ] Verifique hasRole() está comparando corretamente

### Problema: PDF não exporta
- [ ] Verifique html2canvas e jspdf estão instalados
- [ ] Verifique containerRef tem conteúdo para capturar
- [ ] Tente abrir console para ver erros
- [ ] Verifique permissões de download do navegador

### Problema: Importação de CSV/Excel falha
- [ ] Verifique formato do arquivo (utf-8 encoding)
- [ ] Verifique colunas incluem "nome" e "email"
- [ ] Verifique não há espaços em branco extras
- [ ] Tente CSV simples primeiro (Excel é mais complexo)

---

## 📈 Próximos Passos (Após Validação)

Uma vez validado todos os testes acima:

1. **Criar endpoints específicos de Técnico**
   - `GET /api/tecnicos/:id/ordens` - Ordens atribuídas ao técnico
   - `PATCH /api/ordens/:id/status` - Atualizar status da ordem

2. **Criar endpoints específicos de Cliente**
   - `GET /api/clientes/:id/agendamentos` - Agendamentos do cliente
   - `GET /api/clientes/:id/relatorios` - Relatórios dos trabalhos feitos

3. **Adicionar notificações**
   - Email ao cliente quando OS é criada
   - Email ao técnico quando ordem é atribuída

4. **Implementar relatórios avançados**
   - Dashboard com gráficos para admin
   - Histórico de serviços para cliente
   - Performance para técnico

5. **Testes automatizados**
   - Unit tests para controllers
   - Integration tests para fluxos completos
   - E2E tests com Cypress/Playwright

---

## 📝 Arquivo de Log de Testes

Use este template para documentar seus testes:

```
Data: DD/MM/YYYY
Tester: [Seu Nome]
Ambiente: [Local/Server]

Teste 1: Fluxo Admin
Status: [ ] PASS [ ] FAIL
Problemas: 
Notas:

Teste 2: Fluxo Técnico
Status: [ ] PASS [ ] FAIL
Problemas:
Notas:

Teste 3: Fluxo Cliente
Status: [ ] PASS [ ] FAIL
Problemas:
Notas:

Observações Gerais:
```

---

**Versão:** 1.0  
**Data:** 2024  
**Autores:** Sistema de Controle de Acesso RBAC
