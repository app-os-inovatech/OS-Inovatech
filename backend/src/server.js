const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares globais
app.use(helmet()); // Segurança
const allowedOrigin = process.env.FRONTEND_URL || true;
app.use(cors({
  origin: allowedOrigin, // Em produção use FRONTEND_URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // CORS
app.use(morgan('dev')); // Logging
// Aumenta limite para uploads menores sem enviar base64 gigantes
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded

// Middleware de debug para requisições
app.use((req, res, next) => {
  console.log(`\n📱 ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin}`);
  console.log(`   Host: ${req.headers.host}`);
  next();
});

// Middleware para servir arquivos estáticos com headers apropriados
app.use('/uploads', (req, res, next) => {
  // Permitir CORS para visualização online
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Definir cache para arquivos estáticos
  res.header('Cache-Control', 'public, max-age=3600');
  
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  // Opções para segurança e performance
  dotfiles: 'deny',
  maxAge: '1h',
  etag: false
}));

// Rota para visualizar PDF/imagens inline (não fazer download)
app.get('/uploads/view/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const typeToFolder = {
    'manual': 'manuals',
    'video': 'videos'
  };
  
  const folder = typeToFolder[type];
  if (!folder) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  
  const filePath = path.join(__dirname, '../uploads', folder, filename);
  
  // Validação básica de segurança (evitar path traversal)
  const normalizedPath = path.normalize(filePath);
  const uploadsDir = path.normalize(path.join(__dirname, '../uploads'));
  
  if (!normalizedPath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  // Servir arquivo inline (para visualização no navegador)
  res.sendFile(filePath, (err) => {
    if (err && err.code === 'ENOENT') {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    } else if (err) {
      console.error('Erro ao servir arquivo:', err);
      res.status(500).json({ error: 'Erro ao servir arquivo' });
    }
  });
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tecnicos', require('./routes/tecnicos'));
app.use('/api/lojas', require('./routes/lojas'));
app.use('/api/franquias', require('./routes/franquias'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/agendamentos', require('./routes/agendamentos'));
app.use('/api/notificacoes', require('./routes/notificacoes'));
app.use('/api/manuais', require('./routes/manuais'));
app.use('/api/despesas', require('./routes/despesas'));
app.use('/api/relatorios-diarios', require('./routes/relatoriosDiarios'));
app.use('/api/checklist-entrada-obra', require('./routes/checklistEntradaObra'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/admin/vouchers', require('./routes/admin-vouchers'));
app.use('/api/categorias-despesa', require('./routes/categoriasDespesa'));
app.use('/api/tecnico/profile', require('./routes/tecnico-profile'));

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
  console.error('Erro:', err);
  
  // Erro do Multer (upload)
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

// Importar banco de dados
require('./config/database');

// Error handlers para prevenir crash
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

// Keep alive para prevenir que o processo termine
const keepAlive = setInterval(() => {
  console.log('[KeepAlive] Servidor ativo -', new Date().toLocaleTimeString());
}, 3000);

// Detectar quando o processo vai terminar
process.on('exit', (code) => {
  console.log(`[EXIT] Processo terminando com código: ${code}`);
});

process.on('SIGINT', () => {
  console.log('[SIGINT] Recebido');
  clearInterval(keepAlive);
  server.close(() => {
    console.log('[SIGINT] Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('[SIGTERM] Recebido');
  clearInterval(keepAlive);
  server.close(() => {
    console.log('[SIGTERM] Servidor fechado');
    process.exit(0);
  });
});

module.exports = app;
