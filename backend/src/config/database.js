const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pool;
let usingMock = false;
let mockInitialized = false;

// Mock database em memória
const mockData = {
  usuarios: [
    {
      id: 1,
      email: 'admin@example.com',
      senha_hash: '$2a$10$YrSZaLB0Ycv.4tKALLqPv.IxFcVxLO8UxJ9uJRKj8aQQ7JhN2.9bK', // Hash de 'admin123'
      nome: 'Administrador',
      tipo: 'admin',
      telefone: '11999999999',
      primeiro_acesso: false,
      ativo: true,
      ultimo_login: new Date()
    },
    {
      id: 2,
      email: 'tecnico@example.com',
      senha_hash: '$2a$10$D5V0qk7LqKGgK7Y7LLzQXuqKpKvKfJmJ.JhKpJvKfKmJ.KhLpKvK', // Hash de 'tecnico123'
      nome: 'João Silva',
      tipo: 'tecnico',
      telefone: '11987654321',
      primeiro_acesso: false,
      ativo: true,
      ultimo_login: new Date()
    },
    {
      id: 3,
      email: 'cliente@example.com',
      senha_hash: '$2a$10$pKzYqP8w5X.g0gQ1Z3fuJX.7N4YmK5x5Z3pD7Hv6Zm.KF.rU3Mu', // Hash de 'cliente123'
      nome: 'Cliente Teste',
      tipo: 'cliente',
      telefone: '11988888888',
      primeiro_acesso: false,
      ativo: true,
      ultimo_login: new Date()
    }
  ],
  tecnicos: [
    {
      id: 1,
      usuario_id: 2,
      cpf: null,
      especialidade: null,
      certificados: null,
      anos_experiencia: null,
      foto: null,
      status: 'ativo',
      disponivel: true,
      created_at: new Date()
    }
  ]
};

// Inicializar senha com hash
async function initializeMockData() {
  if (mockInitialized) return;
  
  try {
    // Gera hash novamente para garantir
    const hash = await bcrypt.hash('admin123', 10);
    mockData.usuarios[0].senha_hash = hash;
    mockInitialized = true;
    console.log('✅ Hash de senha mock gerado com sucesso');
  } catch (err) {
    console.error('❌ Erro ao gerar hash:', err);
  }
}

// Tentar conectar ao MySQL com timeout
async function initializePool() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'service_order_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true
    });

    const connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na conexão')), 5000)
      )
    ]);
    
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
  } catch (err) {
    console.error('⚠️  MySQL não disponível:', err.message);
    console.log('💡 Usando banco de dados em memória');
    console.log('📧 Admin: admin@example.com | Senha: admin123');
    console.log('📧 Técnico: tecnico@example.com | Senha: tecnico123');
    console.log('📧 Cliente: cliente@example.com | Senha: cliente123');
    
    usingMock = true;
    await initializeMockData();

    pool = {
      query: async (sql, params = []) => {
        if (sql.includes('SELECT * FROM usuarios WHERE email')) {
          // Busca case-insensitive
          const user = mockData.usuarios.find(u => u.email.toLowerCase() === params[0].toLowerCase() && u.ativo);
          return [user ? [user] : []];
        }
        if (sql.includes('INSERT INTO usuarios')) {
          const [email, senha_hash, nome, telefone] = params;
          const nextId = (mockData.usuarios[mockData.usuarios.length - 1]?.id || 0) + 1;
          const novoUsuario = {
            id: nextId,
            email,
            senha_hash,
            nome,
            telefone,
            tipo: 'tecnico',
            primeiro_acesso: true,
            ativo: true,
            ultimo_login: null
          };
          mockData.usuarios.push(novoUsuario);
          return [{ insertId: nextId }];
        }
        if (sql.includes('UPDATE usuarios SET ultimo_login')) {
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('UPDATE usuarios SET senha_hash')) {
          const user = mockData.usuarios.find(u => u.id === params[1]);
          if (user) {
            user.senha_hash = params[0];
            user.primeiro_acesso = false;
          }
          return [{ affectedRows: 1 }];
        }
        if (sql.includes('UPDATE usuarios SET nome =') && sql.includes('WHERE id = ?')) {
          const [nome, email, telefone, ativo, id] = params;
          const user = mockData.usuarios.find(u => u.id === id);
          if (user) {
            user.nome = nome;
            user.email = email;
            user.telefone = telefone;
            user.ativo = ativo;
          }
          return [{ affectedRows: user ? 1 : 0 }];
        }
        if (sql.includes('UPDATE usuarios SET ativo = false')) {
          const [id] = params;
          const user = mockData.usuarios.find(u => u.id === id);
          if (user) {
            user.ativo = false;
          }
          return [{ affectedRows: user ? 1 : 0 }];
        }
        if (sql.includes('SELECT id FROM usuarios WHERE email')) {
          const user = mockData.usuarios.find(u => u.email.toLowerCase() === params[0].toLowerCase());
          return [user ? [{ id: user.id }] : []];
        }
        if (sql.includes('SELECT id, nome, email')) {
          const user = mockData.usuarios.find(u => u.id === params[0]);
          return [user ? [user] : []];
        }
        if (sql.includes('INSERT INTO tecnicos')) {
          const [usuario_id, cpf, especialidade, certificados, anos_experiencia, foto] = params;
          const nextId = (mockData.tecnicos[mockData.tecnicos.length - 1]?.id || 0) + 1;
          const novoTecnico = {
            id: nextId,
            usuario_id,
            cpf: cpf || null,
            especialidade: especialidade || null,
            certificados: certificados || null,
            anos_experiencia: anos_experiencia || null,
            foto: foto || null,
            status: 'ativo',
            disponivel: true,
            created_at: new Date()
          };
          mockData.tecnicos.push(novoTecnico);
          return [{ insertId: nextId }];
        }
        if (sql.includes('SELECT t.*, u.email, u.nome, u.telefone, u.ativo') && sql.includes('FROM tecnicos t')) {
          const tecnicoId = params?.[0];
          const tecnicos = mockData.tecnicos
            .filter(t => (tecnicoId ? t.id === tecnicoId : true))
            .map(t => {
              const user = mockData.usuarios.find(u => u.id === t.usuario_id);
              return {
                ...t,
                email: user?.email,
                nome: user?.nome,
                telefone: user?.telefone,
                ativo: user?.ativo
              };
            })
            .filter(t => t.email);
          return [tecnicos];
        }
        if (sql.includes('SELECT usuario_id, foto FROM tecnicos WHERE id = ?')) {
          const [id] = params;
          const tecnico = mockData.tecnicos.find(t => t.id === id);
          return [tecnico ? [{ usuario_id: tecnico.usuario_id, foto: tecnico.foto }] : []];
        }
        if (sql.includes('SELECT usuario_id FROM tecnicos WHERE id = ?')) {
          const [id] = params;
          const tecnico = mockData.tecnicos.find(t => t.id === id);
          return [tecnico ? [{ usuario_id: tecnico.usuario_id }] : []];
        }
        if (sql.includes('UPDATE tecnicos SET cpf =') && sql.includes('WHERE id = ?')) {
          const [cpf, especialidade, certificados, anos_experiencia, foto, id] = params;
          const tecnico = mockData.tecnicos.find(t => t.id === id);
          if (tecnico) {
            tecnico.cpf = cpf;
            tecnico.especialidade = especialidade;
            tecnico.certificados = certificados;
            tecnico.anos_experiencia = anos_experiencia;
            tecnico.foto = foto;
          }
          return [{ affectedRows: tecnico ? 1 : 0 }];
        }
        return [[]];
      },
      getConnection: async () => ({
        query: async (sql, params) => pool.query(sql, params),
        release: () => {}
      })
    };
  }
}

// Wrapper para garantir que o pool está inicializado
const dbWrapper = {
  query: async (...args) => {
    if (!pool) {
      await initializePool();
    }
    // Garantir que mock está inicializado
    if (usingMock && !mockInitialized) {
      await initializeMockData();
    }
    return pool.query(...args);
  },
  getConnection: async () => {
    if (!pool) {
      await initializePool();
    }
    // Garantir que mock está inicializado
    if (usingMock && !mockInitialized) {
      await initializeMockData();
    }
    return pool.getConnection();
  }
};

// Inicializar pool (não esperar - deixar em background)
initializePool().catch(err => {
  console.error('⚠️  Erro ao inicializar pool:', err.message);
  console.log('💡 Continuando sem pool - usando mock');
});

// Exportar wrapper que garante inicialização
module.exports = dbWrapper;
