const mysql = require('mysql2/promise');

async function waitForMySQL() {
  const maxAttempts = 30;
  const delay = 2000;

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      console.log(`Tentativa ${i}/${maxAttempts} de conectar ao MySQL...`);
      console.log(`Host: ${process.env.DB_HOST || 'undefined'}`);
      console.log(`Port: ${process.env.DB_PORT || 'undefined'}`);
      console.log(`User: ${process.env.DB_USER || 'undefined'}`);
      
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
      
      await connection.end();
      console.log('✅ MySQL conectado com sucesso!');
      return true;
    } catch (error) {
      console.log(`❌ Falha na tentativa ${i}: ${error.message}`);
      if (i < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error('Não foi possível conectar ao MySQL após várias tentativas');
}

waitForMySQL()
  .then(() => {
    console.log('Iniciando inicialização do banco...');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro fatal:', error.message);
    process.exit(1);
  });
