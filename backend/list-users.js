const db = require('./src/config/database');

async function listUsers() {
  try {
    console.log('📋 Consultando usuários no banco...\n');
    
    const [users] = await db.query('SELECT id, nome, email, tipo FROM usuarios');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco!');
    } else {
      console.log('✅ Usuários encontrados:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Nome: ${user.nome}, Email: ${user.email}, Tipo: ${user.tipo}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error.message);
    process.exit(1);
  }
}

listUsers();
