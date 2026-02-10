const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('📦 Iniciando servidor...');
console.log('🔧 PORT:', PORT);

// Middlewares globais
console.log('⚙️ Carregando middlewares...');
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
console.log('📍 Carregando rotas...');
app.use('/api/auth', require('./routes/auth'));

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Sistema de Ordem de Serviço',
    version: '1.0.0',
    status: 'online'
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Erro interno do servidor' 
  });
});

// Iniciar servidor
console.log('🚀 Tentando iniciar servidor na porta', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ Servidor rodando!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

// Tratar erros de listen
server.on('error', (err) => {
  console.error('❌ ERRO ao iniciar servidor:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ ERRO não tratado:', err);
  process.exit(1);
});
