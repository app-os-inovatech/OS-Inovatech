const db = require('../src/config/database');

async function criarTabelaVouchers() {
  try {
    console.log('📋 Criando tabela vouchers...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        loja_id INT,
        descricao VARCHAR(255) NOT NULL,
        arquivo VARCHAR(255) NOT NULL,
        arquivo_nome VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE SET NULL,
        INDEX idx_usuario (usuario_id),
        INDEX idx_loja (loja_id),
        INDEX idx_created (created_at)
      )
    `);

    console.log('✅ Tabela vouchers criada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabela vouchers:', error);
  }
}

criarTabelaVouchers();
