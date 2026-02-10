const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDespesasTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('Conectado ao MySQL');

    // Adicionar coluna loja_id se não existir
    try {
      await connection.execute(`
        ALTER TABLE despesas 
        ADD COLUMN loja_id INT NULL AFTER valor,
        ADD COLUMN loja_nome VARCHAR(255) NULL AFTER loja_id
      `);
      console.log('✅ Colunas loja_id e loja_nome adicionadas');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Colunas já existem');
      } else {
        throw err;
      }
    }

    // Adicionar foreign key se não existir
    try {
      await connection.execute(`
        ALTER TABLE despesas 
        ADD CONSTRAINT fk_despesas_loja 
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key adicionada');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Foreign key já existe');
      } else {
        console.log('⚠️ Aviso ao adicionar foreign key:', err.message);
      }
    }

    // Adicionar índice se não existir
    try {
      await connection.execute(`
        ALTER TABLE despesas 
        ADD INDEX idx_loja (loja_id)
      `);
      console.log('✅ Índice adicionado');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Índice já existe');
      } else {
        console.log('⚠️ Aviso ao adicionar índice:', err.message);
      }
    }

    console.log('\n✅ Atualização da tabela despesas concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateDespesasTable();
