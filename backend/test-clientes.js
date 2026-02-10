const db = require('./src/config/database');

(async () => {
  try {
    const [clientes] = await db.query(
      `SELECT u.id, u.email, u.nome, u.telefone, u.razao_social, u.cnpj, u.endereco, u.ativo, u.created_at as criado_em 
       FROM usuarios u 
       WHERE u.tipo = 'cliente' 
       ORDER BY u.nome`
    );
    console.log('Clientes encontrados:', clientes.length);
    console.log(JSON.stringify(clientes, null, 2));
  } catch (err) {
    console.error('Erro:', err.message);
    console.error('Stack:', err.stack);
  }
  process.exit(0);
})();
