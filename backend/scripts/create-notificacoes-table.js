const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNotificacoesTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db'
    });

    console.log('📦 Conectado ao MySQL');

    // Criar tabela de notificações
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        mensagem TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'info',
        lida BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_lida (usuario_id, lida),
        INDEX idx_created_at (created_at)
      )
    `);
    
    console.log('✅ Tabela notificacoes criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

createNotificacoesTable();
