const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTecnico() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'service_order_db'
  });

  try {
    console.log('Conectado ao banco de dados');

    // Verificar se o usuário técnico existe
    const [usuarios] = await connection.query(
      'SELECT * FROM usuarios WHERE email = ?',
      ['alessandro@inovatechsp.com.br']
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuário técnico não encontrado');
      return;
    }

    const usuario = usuarios[0];
    console.log('✅ Usuário encontrado:', usuario.nome, '- ID:', usuario.id);

    // Verificar se já existe na tabela tecnicos
    const [tecnicos] = await connection.query(
      'SELECT * FROM tecnicos WHERE usuario_id = ?',
      [usuario.id]
    );

    if (tecnicos.length > 0) {
      console.log('✅ Técnico já cadastrado na tabela tecnicos - ID:', tecnicos[0].id);
      return;
    }

    // Inserir na tabela tecnicos
    const [result] = await connection.query(
      `INSERT INTO tecnicos (usuario_id, nome, email, telefone, especialidade, ativo) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario.id, usuario.nome, usuario.email, usuario.telefone || '', 'Instalação', true]
    );

    console.log('✅ Técnico inserido na tabela tecnicos - ID:', result.insertId);
    
    // Mostrar dados do técnico
    const [novoTecnico] = await connection.query(
      'SELECT * FROM tecnicos WHERE id = ?',
      [result.insertId]
    );
    
    console.log('Dados do técnico:', novoTecnico[0]);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

fixTecnico();
