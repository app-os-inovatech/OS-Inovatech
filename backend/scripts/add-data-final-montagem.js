const db = require('../src/config/database');

async function addDataFinalMontagem() {
  try {
    console.log('📝 Adicionando campo data_final_montagem...');
    
    // Adicionar campo data_final_montagem
    try {
      await db.query(`
        ALTER TABLE agendamentos 
        ADD COLUMN data_final_montagem DATETIME NULL AFTER data_conclusao
      `);
      console.log('✅ Campo data_final_montagem adicionado!');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Campo data_final_montagem já existe');
      } else {
        throw error;
      }
    }
    
    // Adicionar campo checklist
    try {
      await db.query(`
        ALTER TABLE agendamentos 
        ADD COLUMN checklist JSON NULL AFTER materiais_utilizados
      `);
      console.log('✅ Campo checklist adicionado!');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Campo checklist já existe');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Processo concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addDataFinalMontagem();
