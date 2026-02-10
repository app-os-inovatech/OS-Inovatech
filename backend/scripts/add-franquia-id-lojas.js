const mysql = require('mysql2/promise');

async function addFranquiaIdToLojas() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'service_order_db'
  });

  try {
    console.log('🔍 Verificando se coluna franquia_id existe...');
    
    // Verifica se a coluna já existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'service_order_db' 
        AND TABLE_NAME = 'lojas' 
        AND COLUMN_NAME = 'franquia_id'
    `);

    if (columns.length > 0) {
      console.log('✅ Coluna franquia_id já existe na tabela lojas');
    } else {
      console.log('➕ Adicionando coluna franquia_id...');
      
      await connection.query(`
        ALTER TABLE lojas 
        ADD COLUMN franquia_id INT,
        ADD FOREIGN KEY (franquia_id) REFERENCES franquias(id)
      `);
      
      console.log('✅ Coluna franquia_id adicionada com sucesso!');
    }

    console.log('✅ Migração concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

addFranquiaIdToLojas();
