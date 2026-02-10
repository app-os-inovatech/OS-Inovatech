# 📍 Sistema de Check-in/Check-out e Relatórios Diários

## 🎯 Visão Geral

Este guia descreve as novas funcionalidades implementadas no sistema de OS:

1. **Check-in obrigatório** ao iniciar execução de serviço
2. **Relatórios Diários** para técnicos
3. **Upload de fotos obrigatório** nos relatórios
4. **Check-out obrigatório** ao fechar relatório

---

## 🚀 Instalação e Migração

### 1. Atualizar o Banco de Dados

Execute o script de migração para adicionar as novas tabelas e campos:

```bash
cd backend
node scripts/migrate-checkin-relatorios.js
```

### 2. Reiniciar o Sistema

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## 📋 Funcionalidades Implementadas

### 1. Check-in ao Iniciar Execução

Quando o técnico clica em **"Iniciar Execução"** em uma OS:

✅ **Sistema captura automaticamente:**
- Data e hora do check-in
- Latitude e longitude (GPS)
- Endereço aproximado (via reverse geocoding)

⚠️ **Observações:**
- O navegador pedirá permissão para acessar a localização
- Sem a localização, o técnico **não consegue** iniciar a execução
- Os dados de localização ficam salvos no agendamento

### 2. Relatórios Diários

Nova seção no menu do técnico: **"Relatórios Diários"**

#### Criar Novo Relatório:
1. Clicar em **"➕ Novo Relatório"**
2. Selecionar um agendamento em andamento
3. Descrever as atividades realizadas no dia
4. Informar horas trabalhadas (opcional)
5. Clicar em **"Criar Relatório"**

#### Adicionar Fotos (OBRIGATÓRIO):
1. Abrir o relatório clicando no card
2. Clicar em **"📷 Selecionar Foto"**
3. Escolher foto (JPG/PNG, máx. 5MB)
4. Adicionar descrição (opcional)
5. Clicar em **"➕ Adicionar"**

⚠️ **Mínimo 1 foto obrigatória** para fechar o relatório

#### Fechar Relatório (Check-out):
1. Abrir o relatório
2. Garantir que há pelo menos 1 foto
3. Clicar em **"🔒 Fechar Relatório (Check-out)"**
4. O sistema capturará automaticamente a localização
5. Confirmar o fechamento

✅ **Sistema captura no check-out:**
- Data e hora do check-out
- Latitude e longitude (GPS)
- Endereço aproximado

⚠️ **Após fechado:**
- Relatório não pode ser editado
- Fotos não podem ser adicionadas/removidas
- Status fica como "Fechado"

---

## 🔧 Endpoints da API

### Relatórios Diários

#### Criar relatório
```http
POST /api/relatorios-diarios
Authorization: Bearer {token}
Content-Type: application/json

{
  "agendamento_id": 1,
  "descricao_atividades": "Instalação de equipamentos...",
  "horas_trabalhadas": 8.5
}
```

#### Listar relatórios
```http
GET /api/relatorios-diarios
Authorization: Bearer {token}
```

#### Buscar por ID
```http
GET /api/relatorios-diarios/{id}
Authorization: Bearer {token}
```

#### Adicionar foto
```http
POST /api/relatorios-diarios/{id}/fotos
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- foto: [arquivo]
- descricao: "Vista frontal do equipamento"
```

#### Remover foto
```http
DELETE /api/relatorios-diarios/{id}/fotos/{foto_id}
Authorization: Bearer {token}
```

#### Fechar relatório
```http
POST /api/relatorios-diarios/{id}/fechar
Authorization: Bearer {token}
Content-Type: application/json

{
  "checkout_latitude": -23.5505,
  "checkout_longitude": -46.6333,
  "checkout_endereco": "Av. Paulista, São Paulo"
}
```

### Agendamentos (Check-in/Check-out)

#### Iniciar execução (com check-in)
```http
PATCH /api/agendamentos/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "em_andamento",
  "checkin_latitude": -23.5505,
  "checkin_longitude": -46.6333,
  "checkin_endereco": "Av. Paulista, São Paulo"
}
```

#### Concluir (com checkout opcional)
```http
PATCH /api/agendamentos/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "concluido",
  "checkout_latitude": -23.5505,
  "checkout_longitude": -46.6333,
  "checkout_endereco": "Av. Paulista, São Paulo"
}
```

---

## 📊 Estrutura do Banco de Dados

### Tabela: agendamentos (campos adicionados)

```sql
checkin_data DATETIME              -- Data/hora do check-in
checkin_latitude DECIMAL(10, 8)    -- Latitude do check-in
checkin_longitude DECIMAL(11, 8)   -- Longitude do check-in
checkin_endereco TEXT               -- Endereço do check-in

checkout_data DATETIME             -- Data/hora do check-out
checkout_latitude DECIMAL(10, 8)   -- Latitude do check-out
checkout_longitude DECIMAL(11, 8)  -- Longitude do check-out
checkout_endereco TEXT              -- Endereço do check-out
```

### Tabela: relatorios_diarios (nova)

```sql
id INT PRIMARY KEY AUTO_INCREMENT
agendamento_id INT NOT NULL
tecnico_id INT NOT NULL
data_relatorio DATE NOT NULL
descricao_atividades TEXT NOT NULL
horas_trabalhadas DECIMAL(5,2)
checkout_realizado BOOLEAN
checkout_data DATETIME
checkout_latitude DECIMAL(10, 8)
checkout_longitude DECIMAL(11, 8)
checkout_endereco TEXT
status ENUM('aberto', 'fechado')
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Tabela: fotos_relatorio_diario (nova)

```sql
id INT PRIMARY KEY AUTO_INCREMENT
relatorio_diario_id INT NOT NULL
url_foto VARCHAR(255) NOT NULL
descricao VARCHAR(255)
created_at TIMESTAMP
```

---

## 🔐 Validações e Regras de Negócio

### Check-in (Iniciar Execução)
- ✅ Geolocalização é **obrigatória**
- ✅ Registrado automaticamente ao mudar status para "em_andamento"
- ✅ Salvo com latitude, longitude e endereço

### Relatórios Diários
- ✅ Apenas um relatório **aberto** por agendamento por dia
- ✅ Técnico só vê seus próprios relatórios
- ✅ Descrição de atividades é **obrigatória**
- ✅ Horas trabalhadas é **opcional**

### Fotos
- ✅ Formatos permitidos: JPG, JPEG, PNG
- ✅ Tamanho máximo: 5MB por foto
- ✅ **Mínimo 1 foto** para fechar relatório
- ✅ Fotos só podem ser adicionadas em relatórios **abertos**
- ✅ Fotos só podem ser removidas de relatórios **abertos**

### Check-out (Fechar Relatório)
- ✅ Geolocalização é **obrigatória**
- ✅ Pelo menos **1 foto** deve estar anexada
- ✅ Relatório muda status para "fechado"
- ✅ Não pode ser editado após fechado
- ✅ Registra data/hora, latitude, longitude e endereço

---

## 🎨 Interface do Usuário

### Minhas OS (Técnico)
- **Botão "Iniciar Execução"**: Solicita localização e faz check-in
- **Detalhes da OS**: Mostra informações de check-in/check-out
- **Coordenadas GPS**: Exibidas nos detalhes

### Relatórios Diários (Técnico)
- **Lista de relatórios**: Cards com status (aberto/fechado)
- **Novo relatório**: Modal para criação
- **Detalhes**: Visualização completa com fotos
- **Upload de fotos**: Área dedicada com preview
- **Botão fechar**: Solicita localização e fecha relatório

---

## 🌐 Geolocalização

O sistema utiliza a API de Geolocalização do navegador:

### Precisão
- **High Accuracy**: Ativado (usa GPS quando disponível)
- **Timeout**: 10 segundos
- **Cache**: Não utiliza posições antigas

### Reverse Geocoding
- Serviço: OpenStreetMap Nominatim
- Converte coordenadas em endereço legível
- Funciona offline (salva apenas coordenadas)

### Permissões
O usuário deve **permitir** acesso à localização:
- Chrome: Ícone de localização na barra de URL
- Firefox: Popup de permissão
- Safari: Configurações > Privacidade

---

## 🐛 Troubleshooting

### Erro: "Geolocalização não suportada"
**Solução:** Usar navegador moderno (Chrome, Firefox, Safari, Edge)

### Erro: "Permissão negada"
**Solução:** Permitir acesso à localização nas configurações do navegador

### Erro: "Timeout"
**Solução:** 
- Verificar se GPS está ativo no dispositivo
- Tentar em área aberta (melhor sinal de GPS)
- Verificar conexão com internet

### Erro: "É obrigatório anexar fotos"
**Solução:** Adicionar pelo menos 1 foto antes de fechar o relatório

### Relatório não aparece na lista
**Solução:** Verificar se foi criado para agendamento em andamento

---

## 📱 Compatibilidade

### Navegadores
- ✅ Chrome 50+
- ✅ Firefox 55+
- ✅ Safari 10+
- ✅ Edge 79+

### Dispositivos
- ✅ Desktop (usa Wi-Fi/IP para localização)
- ✅ Smartphone (usa GPS)
- ✅ Tablet (usa GPS/Wi-Fi)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar este guia
2. Conferir logs do navegador (F12 > Console)
3. Verificar logs do backend
4. Contatar suporte técnico

---

**Última atualização:** Janeiro 2026
