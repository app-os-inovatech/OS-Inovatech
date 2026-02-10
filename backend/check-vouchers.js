const db = require('./src/config/database');

async function checkVouchers() {
  try {
    console.log('🔍 Verificando tabela vouchers...\n');
    
    // Verificar se tabela existe
    const [tables] = await db.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers'
    `);
    
    if (tables.length === 0) {
      console.log('❌ Tabela vouchers NÃO existe!');
      console.log('Criando tabela...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS vouchers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          usuario_id INT NOT NULL,
          descricao VARCHAR(255),
          arquivo VARCHAR(255),
          arquivo_nome VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
      `;
      
      await db.query(createTableSQL);
      console.log('✅ Tabela criada com sucesso!\n');
    } else {
      console.log('✅ Tabela vouchers existe\n');
    }
    
    // Listar estrutura
    console.log('📋 Estrutura da tabela:');
    const [structure] = await db.query('DESCRIBE vouchers');
    console.table(structure);
    
    // Contar vouchers
    console.log('\n📊 Dados dos vouchers:');
    const [allVouchers] = await db.query(`
      SELECT v.*, u.nome as usuario_nome, u.email 
      FROM vouchers v 
      LEFT JOIN usuarios u ON v.usuario_id = u.id 
      ORDER BY v.created_at DESC
    `);
    
    if (allVouchers.length === 0) {
      console.log('⚠️  Nenhum voucher encontrado no banco');
    } else {
      console.log(`✅ Total de vouchers: ${allVouchers.length}`);
      console.table(allVouchers);
      
      // Verificar por técnico
      console.log('\n📌 Vouchers por técnico:');
      const [byTech] = await db.query(`
        SELECT usuario_id, COUNT(*) as total, u.nome 
        FROM vouchers v 
        LEFT JOIN usuarios u ON v.usuario_id = u.id 
        GROUP BY usuario_id
      `);
      console.table(byTech);
    }
    
    // Listar técnicos
    console.log('\n👨‍💼 Técnicos cadastrados:');
    const [tecnicos] = await db.query(`
      SELECT id, nome, email, tipo FROM usuarios WHERE tipo = 'tecnico'
    `);
    console.table(tecnicos);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

checkVouchers();
