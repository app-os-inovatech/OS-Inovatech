const db = require('./src/config/database');

async function adicionarColunas() {
  try {
    console.log('Adicionando coluna tipo_checklist...');
    try {
      await db.query(`
        ALTER TABLE checklist_entrada_obra 
        ADD COLUMN tipo_checklist VARCHAR(50) DEFAULT 'Kit de Montagem'
      `);
      console.log('✅ Coluna tipo_checklist adicionada');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('⚠️  Coluna tipo_checklist já existe');
      } else {
        throw e;
      }
    }
    
    console.log('\nAdicionando coluna observacoes...');
    try {
      await db.query(`
        ALTER TABLE checklist_entrada_obra 
        ADD COLUMN observacoes TEXT
      `);
      console.log('✅ Coluna observacoes adicionada');
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log('⚠️  Coluna observacoes já existe');
      } else {
        throw e;
      }
    }
    
    console.log('\nVerificando estrutura atualizada...');
    const [cols] = await db.query('DESCRIBE checklist_entrada_obra');
    console.log('\nColunas atuais:');
    cols.forEach(c => console.log(`- ${c.Field}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

adicionarColunas();
