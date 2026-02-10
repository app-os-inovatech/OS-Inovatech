const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'Inovaguil@2026',
  database: 'service_order_db'
};

async function createTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado ao banco de dados');

    // Criar tabela relatorios_diarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS relatorios_diarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agendamento_id INT NOT NULL,
        tecnico_id INT NOT NULL,
        loja_id INT NOT NULL,
        check_in DATETIME NOT NULL,
        check_out DATETIME NOT NULL,
        relato_execucao TEXT NOT NULL,
        fotos JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE CASCADE,
        FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Tabela relatorios_diarios criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTable();
