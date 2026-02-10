const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Servidor funcionando!' }));
});

const PORT = 5000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Servidor simples rodando em http://localhost:${PORT}`);
});
