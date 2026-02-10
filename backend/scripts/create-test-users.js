const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

async function createTestUsers() {
  try {
    console.log('🔧 Criando usuários de teste...\n');

    // Hash das senhas
    const senhaHashAdmin = await bcrypt.hash('admin123', 10);
    const senhaHashTecnico = await bcrypt.hash('tecnico123', 10);
    const senhaHashCliente = await bcrypt.hash('cliente123', 10);

    // Criar Admin
    await db.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo, primeiro_acesso)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)
    `, ['Administrador', 'admin@example.com', senhaHashAdmin, 'admin', true, false]);
    console.log('✅ Admin criado: admin@example.com / admin123');

    // Criar Técnico
    const [tecnicoResult] = await db.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, ativo, primeiro_acesso)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), senha_hash = VALUES(senha_hash)
    `, ['João Silva', 'tecnico@example.com', senhaHashTecnico, 'tecnico', '11987654321', true, false]);
    
    const tecnicoUserId = tecnicoResult.insertId;

    // Criar registro de técnico
    await db.query(`
      INSERT INTO tecnicos (usuario_id, cpf, especialidade, status, disponivel)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id)
    `, [tecnicoUserId, '123.456.789-00', 'Manutenção Geral', 'ativo', true]);
    console.log('✅ Técnico criado: tecnico@example.com / tecnico123');

    // Criar Cliente
    await db.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, razao_social, cnpj, endereco, ativo, primeiro_acesso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)
    `, [
      'Maria Santos',
      'cliente@example.com',
      senhaHashCliente,
      'cliente',
      '11976543210',
      'Empresa Exemplo Ltda',
      '12.345.678/0001-90',
      'Rua Exemplo, 123 - São Paulo/SP',
      true,
      false
    ]);
    console.log('✅ Cliente criado: cliente@example.com / cliente123');

    console.log('\n✅ Todos os usuários de teste foram criados com sucesso!');
    console.log('\n📋 Resumo das Credenciais:');
    console.log('─────────────────────────────────────────');
    console.log('👑 ADMIN');
    console.log('   Email: admin@example.com');
    console.log('   Senha: admin123');
    console.log('');
    console.log('🔧 TÉCNICO');
    console.log('   Email: tecnico@example.com');
    console.log('   Senha: tecnico123');
    console.log('');
    console.log('👤 CLIENTE');
    console.log('   Email: cliente@example.com');
    console.log('   Senha: cliente123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
    process.exit(1);
  }
}

createTestUsers();
