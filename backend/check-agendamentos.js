const db = require('./src/config/database');

async function verificarAgendamentos() {
  try {
    const [rows] = await db.query(
      'SELECT id, loja_id, tecnico_id, tipo_servico, status, data_hora, data_inicio_execucao FROM agendamentos ORDER BY id DESC LIMIT 10'
    );
    
    console.log('📋 Últimos agendamentos:\n');
    rows.forEach(r => {
      console.log(`ID: ${r.id} | Técnico ID: ${r.tecnico_id} | Status: ${r.status} | Início: ${r.data_inicio_execucao || 'Não iniciado'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificarAgendamentos();
