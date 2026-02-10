require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

(async () => {
  try {
    const [users] = await db.query('SELECT id, nome, email, senha_hash, ativo FROM usuarios WHERE email = ?', ['admin@sistema.com']);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 Usuário:', user.nome);
      console.log('📧 Email:', user.email);
      console.log('✅ Ativo?', user.ativo === 1);
      console.log('🔒 Hash:', user.senha_hash);
      
      // Testar a senha
      const senhaParaTentar = '123456';
      const valida = await bcrypt.compare(senhaParaTentar, user.senha_hash);
      console.log(`\n🔑 Testando senha "${senhaParaTentar}": ${valida ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
      if (!valida) {
        console.log('\n⚠️  Vou recriar o hash...');
        const novoHash = await bcrypt.hash(senhaParaTentar, 10);
        console.log('Novo hash:', novoHash);
        
        await db.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [novoHash, user.id]);
        console.log('✅ Senha atualizada!');
        
        const validaAgora = await bcrypt.compare(senhaParaTentar, novoHash);
        console.log(`Testando nova senha: ${validaAgora ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      }
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
})();
