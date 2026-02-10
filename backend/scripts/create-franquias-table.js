const mysql = require('mysql2/promise');

async function createFranquias() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Inova@2026',
      database: 'service_order_db'
    });

    console.log('🔄 Criando tabela franquias se não existir...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS franquias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela franquias pronta');
  } catch (err) {
    console.error('❌ Erro ao criar tabela:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

createFranquias();
