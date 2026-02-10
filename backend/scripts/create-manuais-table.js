const mysql = require('mysql2/promise');
require('dotenv').config();

async function criarTabelaManuais() {
  let connection;
  
  try {
    console.log('📦 Conectando ao MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db'
    });

    console.log('✅ Conectado! Criando tabela manuais...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS manuais (
        id INT PRIMARY KEY AUTO_INCREMENT,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        categoria VARCHAR(100),
        arquivo VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabela manuais criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

criarTabelaManuais();
