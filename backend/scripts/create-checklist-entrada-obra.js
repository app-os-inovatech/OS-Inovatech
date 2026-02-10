const mysql = require('mysql2/promise');
require('dotenv').config();

async function createChecklistTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db'
    });

    console.log('📦 Conectado ao MySQL');

    // Criar tabela de checklist de entrada de obra
    await connection.query(`
      CREATE TABLE IF NOT EXISTS checklist_entrada_obra (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agendamento_id INT NOT NULL,
        loja_nome VARCHAR(255),
        cidade VARCHAR(100),
        gerenciador VARCHAR(255),
        data_checklist DATE,
        
        -- Parte Civil
        civil_1_equipamentos ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        civil_2_piso_forro ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        civil_3_agua ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        civil_4_eletrica ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        civil_5_gas ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        
        -- Exaustão e Intertravamento
        exaustao_6_sistema ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        exaustao_7_coifa ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        exaustao_8_intertravamento ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        
        -- Sistema Drive
        drive_9_base_sensores ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        drive_10_fiacao ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        drive_11_totem ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        drive_12_tomadas ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        
        pendencias TEXT,
        
        criado_por INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
        FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    
    console.log('✅ Tabela checklist_entrada_obra criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

createChecklistTable();
