# 🎯 Quick Reference - Sistema RBAC

## 🚀 Iniciar Sistema (Desenvolvimento)

```powershell
# Terminal 1: Backend
cd "c:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\backend"
npm start
# ✅ Rodando na porta 5000

# Terminal 2: Frontend  
cd "c:\Users\andna\OneDrive\Excel Avançado\Área de Trabalho\APP OS\frontend"
npm start
# ✅ Rodando na porta 3000
```

---

## 👤 Credenciais de Teste

| Papel | Email | Senha | Tipo |
|-------|-------|-------|------|
| Admin | admin@sistema.com | admin123 | admin |
| Técnico | joao@tecnico.com | 123456¹ | tecnico |
| Cliente | maria@cliente.com | 123456¹ | cliente |

¹ _Padrão para importação; recomenda-se reset de senha_

---

## 🔑 Como Usar AuthService

```javascript
import authService from '../services/authService';

// Obter usuário logado
const user = authService.getUser();
console.log(user.tipo); // 'admin' | 'tecnico' | 'cliente'

// Verificar papel
if (authService.hasRole('admin')) {
  // Mostrar opção admin
}

// Helper universal
if (authService.canAccess('admin')) {
  // Permitir acesso (true se sem requisito ou papel válido)
}

// Logout
authService.logout(); // Limpa localStorage e redireciona
```

---

## 🛣️ Estrutura de Rotas

### Rotas Compartilhadas (Todos os Papéis)
```
/admin (Dashboard)
/admin/agendamentos
/admin/relatorios
```

### Rotas Admin (requiredRole="admin")
```
/admin/tecnicos
/admin/lojas  
/admin/clientes
/admin/importar-clientes
/admin/atribuir-usuarios
/admin/os (Ordem de Serviço)
```

### Rotas Técnico
```
/tecnico/minhas-os (ainda não implementado)
/admin/agendamentos (compartilhado)
```

### Rotas Cliente
```
/cliente/meus-agendamentos (ainda não implementado)
/cliente/meus-relatorios (ainda não implementado)
```

---

## 📝 Como Adicionar Nova Rota Protegida

```javascript
// Em App.js
<Route 
  path="/admin/nova-rota" 
  element={
    <PrivateRoute requiredRole="admin">
      <Layout>
        <MeuComponente />
      </Layout>
    </PrivateRoute>
  } 
/>
```

---

## 📥 Como Importar Clientes

### Via Interface Web
1. Vá para: Admin → Importar Clientes
2. Crie arquivo CSV ou Excel com colunas:
   - `nome` (obrigatório)
   - `email` (obrigatório)
   - `telefone` (opcional)
   - `cpf` (opcional)
   - `endereco` (opcional)
3. Selecione arquivo
4. Revise preview (primeiras 5 linhas)
5. Clique "Importar"

### Via API Direta
```bash
curl -X POST http://localhost:5000/api/clientes/importar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"nome": "João", "email": "joao@test.com", "telefone": "11987654321"},
    {"nome": "Maria", "email": "maria@test.com", "telefone": "11987654322"}
  ]'
```

### Via SQL
```sql
INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo) 
VALUES (
  'João Silva',
  'joao@test.com',
  '$2b$10$hash_da_senha',  -- bcrypt hash de '123456'
  'cliente',
  1
);
```

---

## 🔗 Como Atribuir Técnico a Usuário

### Via Interface Web
1. Vá para: Admin → Atribuir Usuários
2. Selecione usuário na lista
3. Escolha técnico responsável no dropdown
4. Clique "Atualizar"
5. Ou clique "Remover" para desassociar

### Via API
```bash
PATCH http://localhost:5000/api/usuarios/5 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tecnicoId": 3}'
```

### Verificar no Banco
```sql
SELECT u.nome, u.email, u.tipo, t.nome as tecnico_nome
FROM usuarios u
LEFT JOIN usuarios t ON u.tecnico_id = t.id
WHERE u.id = 5;
```

---

## 📄 Como Exportar OS em PDF

```javascript
// Componente NovaOrdemServico.js já implementado
const handleExport = async () => {
  // 1. Captura form via containerRef
  // 2. Converte para canvas com html2canvas
  // 3. Embutir em PDF com jsPDF
  // 4. Download automático
  
  // Usuário apenas clica no botão "Exportar PDF"
};

// Referência no HTML:
<div ref={containerRef}>
  {/* Conteúdo que será capturado */}
</div>
```

---

## 📊 Verificar Banco de Dados

```powershell
# Conectar ao MySQL
mysql -u root -p service_order_db

# Queries úteis:
SELECT * FROM usuarios;
SELECT * FROM usuarios WHERE tipo = 'cliente';
SELECT COUNT(*) FROM usuarios GROUP BY tipo;

# Ver atribuições
SELECT u.nome, u.email, u.tipo, t.nome as tecnico
FROM usuarios u
LEFT JOIN usuarios t ON u.tecnico_id = t.id;
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Menu não aparece | Verificar localStorage tem "user" e "token" (F12 → Application) |
| Acesso negado em rota | Verificar user.tipo em localStorage vs requiredRole em PrivateRoute |
| PDF não exporta | Verificar html2canvas e jspdf instalados: `npm list html2canvas jspdf` |
| Import falha | Verificar CSV tem UTF-8 encoding, colunas "nome" e "email" |
| Backend não responde | Verificar MySQL está rodando: `npm run init-db` |
| Token expirado | Fazer logout (F12 → localStorage → remover token) e login novamente |

---

## 📂 Arquivos Principais a Conhecer

| Arquivo | Função |
|---------|--------|
| `frontend/src/services/authService.js` | Gerenciador de autenticação e papéis |
| `frontend/src/components/Auth/PrivateRoute.js` | Gate de autenticação/autorização |
| `frontend/src/components/Layout/Layout.js` | Sidebar com menu por papel |
| `frontend/src/App.js` | Roteamento central |
| `backend/src/config/initDatabase.js` | Schema do banco com tipo ENUM |
| `backend/src/controllers/usuarioController.js` | Endpoints de usuário |
| `backend/src/controllers/clienteController.js` | Endpoints de cliente + importar |

---

## 🔌 Endpoints Principais

```
AUTH
POST   /api/auth/login           → { token, user }
POST   /api/auth/logout          → { message }

USUÁRIOS
GET    /api/usuarios             → [{id, nome, email, tipo, tecnico_id}]
GET    /api/usuarios/:id         → {id, nome, email, tipo, tecnico_id}
PATCH  /api/usuarios/:id         → { nome?, email?, tipo?, tecnicoId? }

CLIENTES
POST   /api/clientes/importar    → { importados, total, erros }
```

---

## 🎨 Configurar Menu Sidebar

Editar: `frontend/src/components/Layout/Layout.js`

```javascript
const getMenuItems = () => {
  if (user?.tipo === 'admin') {
    return [
      { label: 'Nome', path: '/rota', icon: '📊', roles: ['admin'] },
      // Adicione novos items aqui
    ];
  }
  // ... outros papéis
};
```

---

## 🔒 Adicionar Rota Protegida

```javascript
// Em App.js
import MeuComponente from './path/MeuComponente';

<Route 
  path="/admin/minha-rota"
  element={
    <PrivateRoute requiredRole="admin">  {/* Deixe em branco para compartilhado */}
      <Layout>
        <MeuComponente />
      </Layout>
    </PrivateRoute>
  }
/>
```

---

## 📚 Papéis Disponíveis

```javascript
'admin'    → Acesso total ao sistema
'tecnico'  → Preenchimento de relatórios
'cliente'  → Visualização de agendamentos/relatórios
```

---

## 🧪 Fluxo de Teste Rápido

```
1. npm start (frontend)
2. npm start (backend)
3. Login com admin@sistema.com / admin123
4. Importar clientes: Admin → Importar Clientes
5. Atribuir técnico: Admin → Atribuir Usuários  
6. Exportar PDF: Admin → OS → Exportar PDF
7. Logout e login como cliente/técnico
8. Verificar menu reduzido
```

---

## 💡 Dicas Importantes

1. **localStorage limpa ao fazer logout** - Use devTools para inspecionar user/token
2. **Senha padrão de import é '123456'** - Implementar reset de senha depois
3. **requiredRole="" = compartilhado** - Deixe vazio ou remova para múltiplos papéis
4. **PDF usa containerRef** - Sempre envolver conteúdo em div com ref
5. **Menu é dinâmico** - Modifique getMenuItems() para adicionar/remover opções
6. **authService é singleton** - Importar em qualquer componente para acessar user

---

## ✅ Checklist de Novo Desenvolvedor

- [ ] Ler RBAC_IMPLEMENTATION.md
- [ ] Ler TESTING_GUIDE.md  
- [ ] Executar sistema (npm start frontend + backend)
- [ ] Login como admin, técnico, cliente
- [ ] Verificar menu muda por papel
- [ ] Testar importação de clientes
- [ ] Testar atribuição de técnico
- [ ] Testar exportação PDF
- [ ] Testar acesso negado em rota protegida
- [ ] Verificar banco de dados com SQL queries

---

## 📞 Contato/Suporte

Em caso de dúvidas, consulte:
- RBAC_IMPLEMENTATION.md (técnico detalhado)
- TESTING_GUIDE.md (fluxos e testes)
- console.log(localStorage) (debug em DevTools)
- SQL SELECT * FROM usuarios (verificar banco)

---

_Versão 1.0 | Status: ✅ Pronto para Desenvolvimento_
