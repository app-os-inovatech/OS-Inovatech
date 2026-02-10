const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  
  try {
    // Conectar ao MySQL sem especificar o database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔧 Inicializando banco de dados...');

    // Criar banco de dados se não existir
    const dbName = process.env.DB_NAME || 'service_order_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Banco de dados '${dbName}' criado/verificado`);

    // Usar o banco de dados
    await connection.query(`USE ${dbName}`);

    // Criar tabela de usuários (inclui campos de cliente)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        tipo ENUM('admin', 'tecnico', 'cliente', 'gerenciador') NOT NULL,
        telefone VARCHAR(20),
        tecnico_id INT,
        razao_social VARCHAR(150),
        cnpj VARCHAR(18),
        endereco TEXT,
        ativo BOOLEAN DEFAULT true,
        primeiro_acesso BOOLEAN DEFAULT true,
        ultimo_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela usuarios criada');

    // Criar tabela de lojas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lojas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        endereco TEXT NOT NULL,
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cep VARCHAR(10),
        telefone VARCHAR(20),
        responsavel VARCHAR(100),
        cnpj VARCHAR(18),
        email VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela lojas criada');

    // Criar tabela de franquias (apenas nome)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS franquias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela franquias criada');

    // Criar tabela de técnicos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tecnicos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        cpf VARCHAR(20),
        especialidade VARCHAR(100),
        certificados TEXT,
        anos_experiencia INT,
        foto VARCHAR(255),
        status ENUM('ativo', 'inativo', 'ferias') DEFAULT 'ativo',
        disponivel BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela tecnicos criada');

    // Criar tabela de cursos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tecnico_id INT NOT NULL,
        nome_curso VARCHAR(150) NOT NULL,
        instituicao VARCHAR(150),
        data_conclusao DATE,
        certificado_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela cursos criada');

    // Criar tabela de agendamentos (inclui franquia_id e check-in/check-out)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        loja_id INT NOT NULL,
        cliente_id INT NOT NULL,
        franquia_id INT,
        tecnico_id INT,
        tipo_servico VARCHAR(100) NOT NULL,
        data_hora DATETIME NOT NULL,
        data_inicio_execucao DATETIME,
        data_conclusao DATETIME,
        checkin_data DATETIME,
        checkin_latitude DECIMAL(10, 8),
        checkin_longitude DECIMAL(11, 8),
        checkin_endereco TEXT,
        checkout_data DATETIME,
        checkout_latitude DECIMAL(10, 8),
        checkout_longitude DECIMAL(11, 8),
        checkout_endereco TEXT,
        status ENUM('pendente', 'atribuido', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'pendente',
        observacoes TEXT,
        descricao_servico TEXT,
        materiais_utilizados TEXT,
        tempo_execucao DECIMAL(5,2),
        assinatura_cliente TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (loja_id) REFERENCES lojas(id),
        FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
        FOREIGN KEY (franquia_id) REFERENCES franquias(id),
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabela agendamentos criada');

    // Criar tabela de fotos do serviço
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fotos_servico (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agendamento_id INT NOT NULL,
        tecnico_id INT NOT NULL,
        url_foto VARCHAR(255) NOT NULL,
        categoria ENUM('antes', 'durante', 'depois') NOT NULL,
        descricao VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
      )
    `);
    console.log('✅ Tabela fotos_servico criada');

    // Criar tabela de relatório (anteriormente OS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS relatorios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agendamento_id INT NOT NULL,
        nome_loja VARCHAR(100) NOT NULL,
        pdf_url VARCHAR(255),
        enviado_email BOOLEAN DEFAULT false,
        destinatarios TEXT,
        data_envio DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela relatorios criada');

    // Criar tabela de itens do checklist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS checklist_itens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        relatorio_id INT NOT NULL,
        secao VARCHAR(100) NOT NULL,
        numero_item INT NOT NULL,
        descricao TEXT NOT NULL,
        resposta ENUM('sim', 'nao', 'pendente') DEFAULT 'pendente',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (relatorio_id) REFERENCES relatorios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela checklist_itens criada');

    // Criar tabela de logs de acesso
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logs_acesso (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT,
        acao VARCHAR(100) NOT NULL,
        detalhes TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabela logs_acesso criada');

    // Criar tabela de relatórios diários
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
    console.log('✅ Tabela relatorios_diarios criada');

    // Criar tabela de fotos de relatórios diários
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
    console.log('✅ Tabela fotos_relatorio_diario criada');

    // Criar usuário admin padrão
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO usuarios (id, nome, email, senha_hash, tipo, ativo, primeiro_acesso)
      VALUES (1, 'Administrador', 'admin@example.com', ?, 'admin', true, false)
    `, [senhaHash]);
    
    console.log('\n✅ Banco de dados inicializado com sucesso!');
    console.log('\n📝 Credenciais de acesso padrão:');
    console.log('   Email: admin@example.com');
    console.log('   Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha padrão após o primeiro acesso!\n');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initializeDatabase;
