# Checklist de Entrada de Obra - Guia de Uso

## 📋 Visão Geral

O sistema agora inclui um **Checklist de Entrada de Obra** completo e digital, substituindo formulários em papel. Este checklist é usado para verificar condições antes do início de obras em lojas.

## 🎯 Funcionalidades Implementadas

### 1. Backend
- ✅ Tabela `checklist_entrada_obra` criada no banco de dados
- ✅ Controller completo com CRUD (criar, listar, buscar, atualizar, deletar)
- ✅ Rotas API em `/api/checklist-entrada-obra`
- ✅ Autenticação obrigatória para todas as operações

### 2. Frontend
- ✅ Componente `ChecklistEntradaObra` para preenchimento
- ✅ Componente `ListaChecklistsObra` para visualização
- ✅ Modal integrado na agenda do técnico
- ✅ Interface completa com todas as seções do checklist
- ✅ Funcionalidade de impressão

## 📝 Estrutura do Checklist

### Informações Básicas
- Loja
- Cidade
- Gerenciador
- Data

### Seção 1: Parte Civil (5 itens)
1. Equipamentos e acessórios disponíveis
2. Piso e forro em condições
3. Pontos de água (quente/fria)
4. Pontos elétricos
5. Pontos de gás

### Seção 2: Exaustão e Intertravamento (3 itens)
6. Sistema de exaustão
7. Coifa Melting
8. Sistema de intertravamento

### Seção 3: Sistema Drive (4 itens)
9. Base para sensores
10. Passagem de fiação
11. Totem e interligação
12. Tomadas estabilizadas

### Campo de Pendências
- Área de texto livre para listar problemas encontrados

## 🔧 Como Usar

### Para Técnicos

1. **Acessar o Checklist:**
   - Faça login como técnico
   - Vá para "Minha Agenda"
   - Na lista de agendamentos, clique no botão **"📋 Checklist"**

2. **Preencher o Checklist:**
   - Um modal se abrirá com o formulário
   - Preencha as informações da loja, cidade, gerenciador e data
   - Para cada item, marque **Sim** ou **Não**
   - Liste as pendências encontradas no campo de texto
   - Clique em **"Salvar Checklist"**

3. **Visualizar Checklists:**
   - Os checklists salvos aparecem na lista com ícones:
     - ✅ = Sim (aprovado)
     - ❌ = Não (reprovado)
     - ⏳ = Pendente (não marcado)

### Para Administradores

1. **Acessar Lista de Checklists:**
   - Login como administrador
   - No dashboard, clique em **"📋 Checklists de Obra"**

2. **Visualizar e Imprimir:**
   - Veja todos os checklists preenchidos
   - Clique em **"📄 Visualizar"** em qualquer checklist
   - Use o botão **"🖨️ Imprimir"** para gerar versão impressa

## 🌐 API Endpoints

### POST `/api/checklist-entrada-obra`
Cria um novo checklist
```json
{
  "agendamento_id": 1,
  "loja_nome": "Loja Centro",
  "cidade": "São Paulo",
  "gerenciador": "João Silva",
  "data_checklist": "2026-01-21",
  "civil_1_equipamentos": "sim",
  "civil_2_piso_forro": "sim",
  ...
  "pendencias": "Problemas encontrados..."
}
```

### GET `/api/checklist-entrada-obra`
Lista todos os checklists ou filtra por agendamento
- Query param: `?agendamento_id=1`

### GET `/api/checklist-entrada-obra/:id`
Busca um checklist específico

### PUT `/api/checklist-entrada-obra/:id`
Atualiza um checklist existente

### DELETE `/api/checklist-entrada-obra/:id`
Remove um checklist

## 🎨 Componentes React

### ChecklistEntradaObra.js
Formulário principal para preenchimento do checklist
- Props: `agendamentoId`, `onClose`
- Localização: `frontend/src/components/`

### ListaChecklistsObra.js
Visualização em grid dos checklists salvos
- Props: `agendamentoId` (opcional para filtrar)
- Localização: `frontend/src/components/`

### ChecklistModal.js
Modal para abrir o checklist na agenda
- Props: `isOpen`, `onClose`, `agendamento`
- Localização: `frontend/src/components/Technician/`

## 📊 Banco de Dados

### Tabela: `checklist_entrada_obra`

```sql
CREATE TABLE checklist_entrada_obra (
  id INT PRIMARY KEY AUTO_INCREMENT,
  agendamento_id INT NOT NULL,
  loja_nome VARCHAR(255),
  cidade VARCHAR(100),
  gerenciador VARCHAR(255),
  data_checklist DATE,
  
  -- Campos de verificação (sim/nao/pendente)
  civil_1_equipamentos ENUM('sim', 'nao', 'pendente'),
  civil_2_piso_forro ENUM('sim', 'nao', 'pendente'),
  ... (12 campos no total)
  
  pendencias TEXT,
  criado_por INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
)
```

## ✨ Funcionalidades Extras

- **Validação de dados** obrigatórios no formulário
- **Responsividade** para uso em tablets e celulares
- **Estado visual** com cores para Sim/Não/Pendente
- **Impressão otimizada** com CSS específico para @media print
- **Auditoria** com registro de quem criou cada checklist
- **Histórico** de todos os checklists por agendamento

## 🚀 Próximos Passos Sugeridos

1. Adicionar upload de fotos para evidências
2. Notificações quando checklist é preenchido
3. Dashboard de estatísticas de aprovação/reprovação
4. Assinatura digital do gerenciador
5. Exportação para PDF com logo da empresa
6. Relatórios de pendências mais frequentes

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o backend está rodando na porta 3001
2. Verifique se o frontend está rodando na porta 3000
3. Confirme que a tabela foi criada executando o script:
   ```
   node backend/scripts/create-checklist-entrada-obra.js
   ```
