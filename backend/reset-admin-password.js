require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

(async () => {
  try {
    const novaSenha = '123456';
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    
    await db.query('UPDATE usuarios SET senha_hash = ? WHERE email = ?', [senhaHash, 'admin@sistema.com']);
    
    console.log('✅ Senha do admin redefinida para: ' + novaSenha);
    
    // Verificar
    const [users] = await db.query('SELECT id, nome, email FROM usuarios WHERE email = ?', ['admin@sistema.com']);
    console.log('👤 Usuário:', users[0].nome);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
