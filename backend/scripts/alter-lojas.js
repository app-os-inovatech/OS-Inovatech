const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Inova@2026',
    database: 'service_order_db'
  });

  const queries = [
    "ALTER TABLE lojas ADD COLUMN cidade VARCHAR(100) NULL AFTER endereco",
    "ALTER TABLE lojas ADD COLUMN estado VARCHAR(2) NULL AFTER cidade",
    "ALTER TABLE lojas ADD COLUMN cep VARCHAR(10) NULL AFTER estado",
    "ALTER TABLE lojas ADD COLUMN ativo BOOLEAN DEFAULT true AFTER email"
  ];

  for (const q of queries) {
    try {
      await conn.query(q);
      console.log('OK:', q);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Já existe coluna, ignorando:', q);
      } else {
        console.error('Erro executando:', q, err.message);
      }
    }
  }

  await conn.end();
})();
