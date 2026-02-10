const mysql = require('mysql2/promise');

async function updateTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Inovaguil@2026',
    database: 'service_order_db'
  });

  try {
    console.log('Atualizando tabela checklist_entrada_obra...');
    
    // Adicionar coluna itens_json se não existir
    try {
      await conn.query(`ALTER TABLE checklist_entrada_obra ADD COLUMN itens_json TEXT`);
      console.log('Coluna itens_json adicionada');
    } catch (err) {
      console.log('Coluna itens_json já existe');
    }
    
    console.log('Tabela atualizada com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    await conn.end();
  }
}

updateTable();
