const mysql = require('mysql2/promise');
require('dotenv').config();

async function columnExists(connection, table, column) {
  const dbName = process.env.DB_NAME || 'service_order_db';
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  return rows[0].cnt > 0;
}

async function tableExists(connection, table) {
  const dbName = process.env.DB_NAME || 'service_order_db';
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, table]
  );
  return rows[0].cnt > 0;
}

async function foreignKeyExists(connection, table, column) {
  const dbName = process.env.DB_NAME || 'service_order_db';
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [dbName, table, column]
  );
  return rows[0].cnt > 0;
}

async function fixDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔧 Aplicando migrações...');

    // 1) Adicionar campos de cliente em usuarios: razao_social, cnpj, endereco
    if (!(await columnExists(connection, 'usuarios', 'razao_social'))) {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN razao_social VARCHAR(150) NULL AFTER tecnico_id`);
      console.log('✅ Coluna usuarios.razao_social adicionada');
    } else {
      console.log('↪️  Coluna usuarios.razao_social já existe');
    }

    if (!(await columnExists(connection, 'usuarios', 'cnpj'))) {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN cnpj VARCHAR(18) NULL AFTER razao_social`);
      console.log('✅ Coluna usuarios.cnpj adicionada');
    } else {
      console.log('↪️  Coluna usuarios.cnpj já existe');
    }

    if (!(await columnExists(connection, 'usuarios', 'endereco'))) {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN endereco TEXT NULL AFTER cnpj`);
      console.log('✅ Coluna usuarios.endereco adicionada');
    } else {
      console.log('↪️  Coluna usuarios.endereco já existe');
    }

    // 2) Criar tabela franquias (apenas nome)
    if (!(await tableExists(connection, 'franquias'))) {
      await connection.query(`
        CREATE TABLE franquias (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nome VARCHAR(100) NOT NULL,
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela franquias criada');
    } else {
      console.log('↪️  Tabela franquias já existe');
    }

    // 3) Adicionar coluna franquia_id em agendamentos + FK
    if (!(await columnExists(connection, 'agendamentos', 'franquia_id'))) {
      await connection.query(`ALTER TABLE agendamentos ADD COLUMN franquia_id INT NULL AFTER cliente_id`);
      console.log('✅ Coluna agendamentos.franquia_id adicionada');
    } else {
      console.log('↪️  Coluna agendamentos.franquia_id já existe');
    }

    if (!(await foreignKeyExists(connection, 'agendamentos', 'franquia_id'))) {
      await connection.query(`
        ALTER TABLE agendamentos 
        ADD CONSTRAINT fk_agendamentos_franquias 
        FOREIGN KEY (franquia_id) REFERENCES franquias(id)
      `);
      console.log('✅ FK agendamentos(franquia_id) → franquias(id) adicionada');
    } else {
      console.log('↪️  FK agendamentos.franquia_id já existe');
    }

    console.log('\n✅ Migrações aplicadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = fixDatabase;
