const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Inova@2026',
      database: 'service_order_db'
    });

    await conn.query(`
      ALTER TABLE agendamentos 
      MODIFY COLUMN status ENUM(
        'pendente', 
        'atribuido',
        'em_andamento', 
        'concluido', 
        'cancelado', 
        'checklist_preenchido'
      ) DEFAULT 'pendente'
    `);

    console.log('✅ Status ENUM atualizado com sucesso!');
    console.log('Valores permitidos: pendente, atribuido, em_andamento, concluido, cancelado, checklist_preenchido');

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
