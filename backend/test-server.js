const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Teste OK', status: 'online' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request recebido:', req.body);
  res.json({ message: 'Login realizado', token: 'test-token' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor de teste rodando na porta ${PORT}`);
});
