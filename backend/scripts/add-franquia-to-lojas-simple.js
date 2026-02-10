const db = require('../src/config/database');

async function addFranquiaColumn() {
  try {
    console.log('🔍 Verificando se coluna franquia_id existe na tabela lojas...');
    
    // Tenta adicionar a coluna (se já existir, vai dar erro que ignoramos)
    try {
      await db.query(`
        ALTER TABLE lojas 
        ADD COLUMN franquia_id INT
      `);
      console.log('✅ Coluna franquia_id adicionada!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Coluna franquia_id já existe');
      } else {
        throw error;
      }
    }

    // Tenta adicionar a foreign key (se já existir, ignora)
    try {
      await db.query(`
        ALTER TABLE lojas 
        ADD CONSTRAINT fk_lojas_franquia 
        FOREIGN KEY (franquia_id) REFERENCES franquias(id)
      `);
      console.log('✅ Foreign key adicionada!');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Foreign key já existe');
      } else {
        console.log('⚠️  Aviso ao adicionar FK:', error.message);
      }
    }

    console.log('✅ Migração concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addFranquiaColumn();
