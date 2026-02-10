require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

(async () => {
  try {
    const [users] = await db.query('SELECT id, nome, email, senha_hash, primeiro_acesso FROM usuarios WHERE email = ?', ['admin@sistema.com']);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 Usuário encontrado:', user.nome);
      console.log('📊 Primeiro acesso?', user.primeiro_acesso);
      
      // Testar senhas comuns
      const senhasParaTentar = ['123456', '12345678', 'admin', 'senha'];
      
      for (const senha of senhasParaTentar) {
        const valida = await bcrypt.compare(senha, user.senha_hash);
        console.log(`✅ Senha "${senha}": ${valida ? 'VÁLIDA' : 'INVÁLIDA'}`);
        if (valida) break;
      }
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
