const db = require('../src/config/database');

async function seedFranquias() {
  try {
    console.log('🔍 Adicionando franquias...');
    
    const franquias = [
      { nome: 'Burger King' },
      { nome: "Popeye's" },
      { nome: 'Subway' },
      { nome: 'Starbucks' }
    ];

    for (const franquia of franquias) {
      try {
        // Verifica se já existe
        const [existe] = await db.query(
          'SELECT id FROM franquias WHERE nome = ?',
          [franquia.nome]
        );

        if (existe.length === 0) {
          await db.query(
            'INSERT INTO franquias (nome) VALUES (?)',
            [franquia.nome]
          );
          console.log(`✅ Franquia "${franquia.nome}" adicionada!`);
        } else {
          console.log(`ℹ️  Franquia "${franquia.nome}" já existe`);
        }
      } catch (error) {
        console.error(`❌ Erro ao adicionar "${franquia.nome}":`, error.message);
      }
    }

    console.log('✅ Processo concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

seedFranquias();
