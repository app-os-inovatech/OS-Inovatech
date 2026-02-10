# 📱 Guia de Acesso via Celular

## ✅ Solução Implementada

A aplicação agora detecta automaticamente o endereço IP do dispositivo e redireciona as requisições de API para o IP correto, permitindo acesso via celular na mesma rede.

## 🚀 Como Usar

### Pré-requisitos
1. **Backend rodando**: `npm start` ou `npm run dev` na pasta `backend/`
2. **Frontend rodando**: `npm start` na pasta `frontend/`
3. **Mesma rede**: PC e celular devem estar na mesma rede Wi-Fi

### Passos para Acessar pelo Celular

1. **Descobrir o IP do seu PC**
   ```powershell
   # No PowerShell do Windows, execute:
   ipconfig
   ```
   Procure por "IPv4 Address" sob "Ethernet adapter" ou "Wireless LAN adapter"
   Exemplo: `192.168.1.100`

2. **No celular**
   - Conecte na mesma rede Wi-Fi do PC
   - Abra o navegador
   - Digite: `http://SEU_IP:3000`
   - Exemplo: `http://192.168.1.100:3000`

3. **Fazer Login**
   - Use suas credenciais de usuário
   - A aplicação automáticamente redirecionará para o IP correto

## 🔧 Configurações Técnicas

### Backend (`backend/src/server.js`)
✅ **Já está configurado para escutar em `0.0.0.0`**
- Aceita conexões de qualquer interface
- CORS habilitado para todas as origens
- Suporta uploads e downloads de arquivos

### Frontend (`frontend/src/config/api.js`)
✅ **Configuração dinâmica de URL**
- Detecta automaticamente se está acessando via IP ou localhost
- Muda a URL da API dinamicamente
- Funciona com `http://` e `https://`

### Interceptor (`frontend/src/fetchInterceptor.js`)
✅ **Redireciona URLs hardcoded**
- Qualquer URL hardcoded com `localhost` é automaticamente substituída
- Redireciona para o IP detectado
- Funciona em tempo real

## 🐛 Troubleshooting

### "Erro ao conectar à API"
- Verifique se o backend está rodando: `npm start` em `backend/`
- Confirme que ambos estão na mesma rede Wi-Fi
- Verifique o IP: `ipconfig` no PC
- Teste em outro navegador no celular

### "Página branca ou não carrega"
- Limpe cache do navegador (Ctrl+Shift+Del)
- Aguarde 30 segundos e recarregue a página
- Verifique se a porta 3000 não está bloqueada

### "Imagens/uploads não aparecem"
- Isso é normal na primeira carga
- Recarregue a página (F5 ou Ctrl+R)
- Verifique se tem espaço em disco no PC

### Conexão de Wi-Fi instável
- Aproxime-se do roteador
- Reinicie o Wi-Fi do celular
- Feche outras abas/apps que usam rede

## 📊 Verificação de Status

Para verificar se está funcionando:

1. **Abra o DevTools** no celular (Chrome: Menu > Mais Ferramentas > Opções do Desenvolvedor)
2. **Vá para Console**
3. Procure por mensagens como:
   ```
   ✅ Fetch interceptor ativado
   🌐 Hostname detectado: 192.168.1.100
   🔒 Protocol: http:
   ```
4. **Abra a aba Network** e veja as requisições apontando para o IP correto

## 🔄 Diferenciais Técnicos

- **Detecção automática**: Não precisa de configuração manual
- **CORS completo**: Suporta requisições POST, PUT, DELETE, etc
- **Protocolo inteligente**: Mantém o protocolo (http/https) correto
- **Cache eficiente**: Uploads e downloads otimizados
- **Sem hardcodes**: URLs dinâmicas em todos os componentes

## 📝 Notas Importantes

- A porta **3000** é para o Frontend
- A porta **5001** é para o Backend API
- Ambas as portas devem estar **abertas no firewall** do Windows
- Se o Windows bloquear, aceite na pop-up de firewall

## ✨ Melhorias Futuras

- [ ] Suportar acesso externo com HTTPS e certificado
- [ ] PWA (Progressive Web App) para instalação no celular
- [ ] QR Code para acesso rápido
- [ ] Sincronização offline

---

**Última atualização**: 28 de Janeiro de 2026
**Status**: ✅ Funcional para rede local
