const db = require('./src/config/database');

async function verificarTabela() {
  try {
    const [cols] = await db.query('DESCRIBE checklist_entrada_obra');
    console.log('📋 Colunas da tabela checklist_entrada_obra:\n');
    cols.forEach(c => {
      console.log(`- ${c.Field} (${c.Type})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificarTabela();
