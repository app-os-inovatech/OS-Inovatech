const db = require('../src/config/database');

async function addGerenciadorType() {
  try {
    console.log('🔧 Adicionando tipo "gerenciador" à tabela usuarios...');
    
    await db.query(`
      ALTER TABLE usuarios 
      MODIFY COLUMN tipo ENUM('admin', 'tecnico', 'cliente', 'gerenciador') NOT NULL
    `);
    
    console.log('✅ Tipo "gerenciador" adicionado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar tipo:', error.message);
    process.exit(1);
  }
}

addGerenciadorType();
