const mysql = require('mysql2/promise');

const franquiasPadrao = [
  'Burger King',
  "Popeyes",
  'Starbucks',
  'Subway'
];

async function seedFranquias() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Inova@2026',
      database: 'service_order_db'
    });

    console.log('✅ Conectado ao banco');

    for (const nome of franquiasPadrao) {
      const [rows] = await conn.query('SELECT id FROM franquias WHERE nome = ?', [nome]);
      if (rows.length === 0) {
        await conn.query('INSERT INTO franquias (nome, ativo) VALUES (?, true)', [nome]);
        console.log(`➕ Inserida franquia: ${nome}`);
      } else {
        console.log(`ℹ️  Já existe franquia: ${nome}`);
      }
    }

    console.log('🎉 Seed de franquias concluído');
  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seedFranquias();
