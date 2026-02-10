const mysql = require('mysql2/promise');

async function addCamposLojas() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Inova@2026',
      database: 'service_order_db'
    });

    console.log('🔄 Conectado ao banco de dados');

    // Adicionar campo tipo_loja
    try {
      await connection.query(`
        ALTER TABLE lojas 
        ADD COLUMN tipo_loja ENUM('Drive', 'Food Court') NULL AFTER nome
      `);
      console.log('✅ Campo tipo_loja adicionado com sucesso');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo tipo_loja já existe');
      } else {
        throw err;
      }
    }

    // Adicionar campo franquia
    try {
      await connection.query(`
        ALTER TABLE lojas 
        ADD COLUMN franquia ENUM('Burger King', 'Popeyes', 'Starbucks', 'Subway') NULL AFTER tipo_loja
      `);
      console.log('✅ Campo franquia adicionado com sucesso');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo franquia já existe');
      } else {
        throw err;
      }
    }

    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

addCamposLojas();
