const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'Inovaguil@2026',
  database: 'service_order_db'
};

async function migrateTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('Conectado ao banco de dados');

    // Adicionar os novos campos de fotos à tabela relatorios_diarios
    const campos = [
      'foto_phu VARCHAR(255)',
      'foto_numero_serie_phu VARCHAR(255)',
      'foto_temperatura_phu VARCHAR(255)',
      'foto_microondas VARCHAR(255)',
      'foto_numero_serie_microondas VARCHAR(255)',
      'foto_cuba_1_fritadeira VARCHAR(255)',
      'foto_numero_serie_cuba_1_fritadeira VARCHAR(255)',
      'foto_cuba_2_fritadeira VARCHAR(255)',
      'foto_numero_serie_cuba_2_fritadeira VARCHAR(255)',
      'foto_cuba_3_fritadeira VARCHAR(255)',
      'foto_numero_serie_cuba_3_fritadeira VARCHAR(255)',
      'foto_broiler VARCHAR(255)',
      'foto_temperatura_broiler VARCHAR(255)',
      'foto_pressao_alta_broiler VARCHAR(255)',
      'foto_pressao_baixa_broiler VARCHAR(255)',
      'foto_numero_serie_broiler VARCHAR(255)'
    ];

    for (const campo of campos) {
      const columnName = campo.split(' ')[0];
      try {
        await connection.query(`
          ALTER TABLE relatorios_diarios 
          ADD COLUMN ${campo}
        `);
        console.log(`✅ Campo ${columnName} adicionado com sucesso`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Campo ${columnName} já existe`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao migrar tabela:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateTable();
