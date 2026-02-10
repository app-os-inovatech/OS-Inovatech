const db = require('../src/config/database');

async function criarTabelaCategoriasDespesa() {
  try {
    console.log('📋 Criando tabela categorias_despesa...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS categorias_despesa (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL UNIQUE,
        cor VARCHAR(7) DEFAULT '#003DA5',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nome (nome)
      )
    `);

    console.log('✅ Tabela categorias_despesa criada com sucesso!');

    // Inserir categorias padrão
    const categoriasDefault = [
      { nome: 'Alimentação', cor: '#FF6B6B' },
      { nome: 'Combustível', cor: '#4ECDC4' },
      { nome: 'Hospedagem', cor: '#45B7D1' },
      { nome: 'Transporte', cor: '#96CEB4' },
      { nome: 'Comunicação', cor: '#FFEAA7' },
      { nome: 'Outros', cor: '#DDA15E' }
    ];

    for (const cat of categoriasDefault) {
      try {
        await db.query(
          'INSERT IGNORE INTO categorias_despesa (nome, cor) VALUES (?, ?)',
          [cat.nome, cat.cor]
        );
      } catch (err) {
        // Categoria já existe
      }
    }

    console.log('✅ Categorias padrão inseridas!');
  } catch (error) {
    console.error('❌ Erro ao criar tabela categorias_despesa:', error);
  }
}

criarTabelaCategoriasDespesa();
