const db = require('./src/config/database');

(async () => {
  try {
    const query = `
      INSERT INTO agendamentos 
      (loja_id, cliente_id, franquia_id, tipo_servico, data_hora, data_inicio_execucao, data_conclusao, observacoes, descricao_servico, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
    `;

    const [result] = await db.query(query, [
      1,  // loja_id
      5,  // cliente_id
      1,  // franquia_id
      'Montagem de equipamentos',  // tipo_servico
      '2026-01-08T14:40:00',  // data_hora
      '2026-01-08T14:40:00',  // data_inicio_execucao
      '2026-01-13T14:40:00',  // data_conclusao
      null,  // observacoes
      'Montagem dos equipamentos'  // descricao_servico
    ]);

    console.log('Agendamento criado com sucesso!');
    console.log('ID:', result.insertId);
  } catch (err) {
    console.error('Erro ao criar agendamento:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('SQL:', err.sql);
  }
  process.exit(0);
})();
