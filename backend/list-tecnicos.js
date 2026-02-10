const db = require('./src/config/database');

async function listarTecnicos() {
  try {
    console.log('📋 Listando todos os técnicos no banco...\n');
    
    // Buscar todos os usuários do tipo técnico
    const [usuarios] = await db.query(
      "SELECT id, nome, email, tipo FROM usuarios WHERE tipo = 'tecnico' ORDER BY nome"
    );
    
    console.log('Usuários técnicos:', usuarios.length);
    usuarios.forEach((u, i) => {
      console.log(`${i+1}. ID: ${u.id} | Nome: ${u.nome} | Email: ${u.email}`);
    });
    
    console.log('\n📋 Técnicos completos (com dados de técnico):\n');
    
    // Buscar técnicos com JOIN
    const [tecnicos] = await db.query(
      `SELECT t.*, u.email, u.nome, u.telefone, u.ativo 
       FROM tecnicos t 
       INNER JOIN usuarios u ON t.usuario_id = u.id 
       ORDER BY u.nome`
    );
    
    console.log('Técnicos completos:', tecnicos.length);
    tecnicos.forEach((t, i) => {
      console.log(`${i+1}. Técnico ID: ${t.id} | Usuario ID: ${t.usuario_id} | Nome: ${t.nome} | Email: ${t.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

listarTecnicos();
