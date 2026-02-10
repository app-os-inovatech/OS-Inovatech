const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script de migração para adicionar funcionalidade de check-in/check-out
 * e relatórios diários ao sistema.
 * 
 * Execute: node backend/scripts/migrate-checkin-relatorios.js
 */

async function migrar() {
  let connection;
  
  try {
    console.log('🔄 Iniciando migração do banco de dados...\n');

    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado ao banco de dados\n');

    // 1. Adicionar campos de check-in/check-out na tabela agendamentos
    console.log('📝 Adicionando campos de check-in/check-out...');
    
    const alterAgendamentosQueries = [
      { name: 'checkin_data', query: 'ALTER TABLE agendamentos ADD COLUMN checkin_data DATETIME' },
      { name: 'checkin_latitude', query: 'ALTER TABLE agendamentos ADD COLUMN checkin_latitude DECIMAL(10, 8)' },
      { name: 'checkin_longitude', query: 'ALTER TABLE agendamentos ADD COLUMN checkin_longitude DECIMAL(11, 8)' },
      { name: 'checkin_endereco', query: 'ALTER TABLE agendamentos ADD COLUMN checkin_endereco TEXT' },
      { name: 'checkout_data', query: 'ALTER TABLE agendamentos ADD COLUMN checkout_data DATETIME' },
      { name: 'checkout_latitude', query: 'ALTER TABLE agendamentos ADD COLUMN checkout_latitude DECIMAL(10, 8)' },
      { name: 'checkout_longitude', query: 'ALTER TABLE agendamentos ADD COLUMN checkout_longitude DECIMAL(11, 8)' },
      { name: 'checkout_endereco', query: 'ALTER TABLE agendamentos ADD COLUMN checkout_endereco TEXT' }
    ];

    for (const { name, query } of alterAgendamentosQueries) {
      try {
        await connection.query(query);
        console.log(`   ✓ Campo ${name} adicionado`);
      } catch (error) {
        // Se a coluna já existir, apenas avisar
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ℹ Campo ${name} já existe`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Campos de check-in/check-out processados\n');

    // 2. Criar tabela de relatórios diários
    console.log('📝 Criando tabela de relatórios diários...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS relatorios_diarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agendamento_id INT NOT NULL,
        tecnico_id INT NOT NULL,
        data_relatorio DATE NOT NULL,
        descricao_atividades TEXT NOT NULL,
        horas_trabalhadas DECIMAL(5,2),
        checkout_realizado BOOLEAN DEFAULT false,
        checkout_data DATETIME,
        checkout_latitude DECIMAL(10, 8),
        checkout_longitude DECIMAL(11, 8),
        checkout_endereco TEXT,
        status ENUM('aberto', 'fechado') DEFAULT 'aberto',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tabela relatorios_diarios criada\n');

    // 3. Criar tabela de fotos de relatórios diários
    console.log('📝 Criando tabela de fotos de relatórios diários...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fotos_relatorio_diario (
        id INT PRIMARY KEY AUTO_INCREMENT,
        relatorio_diario_id INT NOT NULL,
        url_foto VARCHAR(255) NOT NULL,
        descricao VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (relatorio_diario_id) REFERENCES relatorios_diarios(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tabela fotos_relatorio_diario criada\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Resumo das alterações:');
    console.log('   ✓ Campos de check-in/check-out adicionados à tabela agendamentos');
    console.log('   ✓ Tabela relatorios_diarios criada');
    console.log('   ✓ Tabela fotos_relatorio_diario criada\n');
    
    console.log('🚀 Novas funcionalidades disponíveis:');
    console.log('   • Check-in obrigatório ao iniciar execução (com geolocalização)');
    console.log('   • Relatórios diários para técnicos');
    console.log('   • Upload de fotos obrigatório nos relatórios');
    console.log('   • Check-out obrigatório ao fechar relatório (com geolocalização)\n');

  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
    console.error('\nDetalhes do erro:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados encerrada\n');
    }
  }
}

// Executar migração
if (require.main === module) {
  migrar()
    .then(() => {
      console.log('👍 Migração finalizada. Você pode reiniciar o servidor agora.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = migrar;
