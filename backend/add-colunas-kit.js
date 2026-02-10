const db = require('./src/config/database');

async function adicionarColunasKit() {
  try {
    const itensKit = [
      'chave_allen',
      'chave_inglesa',
      'parafusadeira',
      'nivel',
      'trena',
      'furadeira',
      'brocas',
      'extensao_eletrica',
      'fita_isolante',
      'fita_veda_rosca',
      'silicone',
      'luvas',
      'oculos_protecao'
    ];

    console.log('Adicionando colunas para itens do kit...\n');
    
    for (const item of itensKit) {
      try {
        await db.query(`
          ALTER TABLE checklist_entrada_obra 
          ADD COLUMN ${item} BOOLEAN DEFAULT FALSE
        `);
        console.log(`✅ Coluna ${item} adicionada`);
      } catch (e) {
        if (e.message.includes('Duplicate column')) {
          console.log(`⚠️  Coluna ${item} já existe`);
        } else {
          console.error(`❌ Erro em ${item}:`, e.message);
        }
      }
    }

    console.log('\n✅ Todas as colunas do kit foram processadas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

adicionarColunasKit();
