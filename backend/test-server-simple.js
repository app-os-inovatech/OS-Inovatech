const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Servidor teste rodando em http://localhost:${PORT}`);
});

// Keep alive
setInterval(() => {
  console.log('Servidor ativo...');
}, 10000);
