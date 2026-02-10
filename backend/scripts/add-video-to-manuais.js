const mysql = require('mysql2/promise');
require('dotenv').config();

async function adicionarVideoManuais() {
  let connection;
  
  try {
    console.log('📦 Conectando ao MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db'
    });

    console.log('✅ Conectado! Adicionando coluna video à tabela manuais...');

    // Verificar se a coluna já existe
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM manuais LIKE 'video'
    `);

    if (columns.length === 0) {
      // Adicionar coluna de vídeo
      await connection.query(`
        ALTER TABLE manuais 
        ADD COLUMN video VARCHAR(255) DEFAULT NULL
      `);
      console.log('✅ Coluna video adicionada com sucesso!');
    } else {
      console.log('ℹ️ Coluna video já existe!');
    }

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

adicionarVideoManuais();
