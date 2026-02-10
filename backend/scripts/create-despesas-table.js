const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDespesasTable() {
  let connection;
  
  try {
    // Conectar ao MySQL com as mesmas configurações do database.js
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('Conectado ao MySQL');

    // Criar tabela de despesas
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS despesas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        descricao TEXT,
        valor DECIMAL(10, 2) NOT NULL,
        loja_id INT NULL,
        loja_nome VARCHAR(255) NULL,
        arquivo_nome VARCHAR(255) NULL,
        arquivo_tipo VARCHAR(100) NULL,
        arquivo_tamanho INT NULL,
        arquivo_data_url LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE SET NULL,
        INDEX idx_usuario (usuario_id),
        INDEX idx_loja (loja_id),
        INDEX idx_categoria (categoria),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ Tabela despesas criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDespesasTable();
