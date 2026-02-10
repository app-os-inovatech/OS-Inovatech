# Configuração de E-mail para Envio de Relatórios em PDF

## Como Configurar o Envio Automático de E-mails

A aplicação agora envia automaticamente um PDF com o relatório quando o técnico encerra uma ordem de serviço.

### Passo 1: Configurar Gmail (Recomendado)

1. **Acesse sua conta Google**
   - Vá para: https://myaccount.google.com/security

2. **Ative a "Verificação em 2 etapas"** (se ainda não estiver)
   - Vá para Segurança → Verificação em 2 etapas

3. **Gere uma "Senha de Aplicativo"**
   - Vá para Segurança → Senhas de Aplicativo
   - Selecione "Email" e "Windows"
   - Google gerará uma senha de 16 caracteres

4. **Atualize o arquivo `.env`** no backend:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=senha-gerada-pelo-google
```

### Passo 2: Usar Outro Provedor de E-mail

Se preferir usar outro serviço (Outlook, SendGrid, etc), atualize o `.env`:

**Exemplo - Outlook:**
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@outlook.com
EMAIL_PASS=sua-senha
```

**Exemplo - SendGrid:**
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=sua-api-key-sendgrid
```

### Passo 3: Reiniciar o Backend

Após atualizar o `.env`, reinicie o servidor backend:

```bash
cd backend
npm start
```

## O que Acontece Automaticamente

Quando um técnico encerra uma ordem de serviço (clica em "Encerrar Dia"):

1. ✅ Um modal abre para descrever a execução
2. ✅ O técnico insere no mínimo 3 fotos
3. ✅ Ao enviar, um PDF é gerado contendo:
   - Informações da loja
   - Tipo de serviço
   - Data e hora de check-in e check-out
   - Coordenadas GPS (latitude/longitude)
   - Descrição da execução
   - Todas as fotos em alta qualidade

4. ✅ O PDF é enviado automaticamente para o email do técnico

## Verificar se está funcionando

Procure nas mensagens do console do servidor por:
- "Email service ready" - serviço de email está pronto
- "Email enviado com sucesso:" - relatório foi enviado

Se ver "Email service error:", verifique:
1. As credenciais estão corretas no `.env`?
2. O serviço de email está ativado?
3. A conexão de internet está funcionando?

## Suporte

Se tiver problemas, verifique:
- Console do backend para mensagens de erro
- Pasta de SPAM do email (às vezes é filtrado)
- Credenciais do email estão corretas
