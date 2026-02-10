const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
  // Login
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      console.log('🔐 Tentativa de login:', email);

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      const [users] = await db.query(
        'SELECT * FROM usuarios WHERE email = ? AND ativo = true',
        [email]
      );

      console.log('👤 Usuários encontrados:', users.length);

      if (users.length === 0) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      const user = users[0];

      // Verificar senha
      console.log('🔑 Verificando senha...');
      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      console.log('✅ Senha válida:', senhaValida);
      
      if (!senhaValida) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Atualizar último login
      await db.query(
        'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Gerar token JWT
      const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          tipo: user.tipo,
          nome: user.nome
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remover senha do objeto de resposta
      delete user.senha_hash;

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo,
          telefone: user.telefone,
          primeiro_acesso: user.primeiro_acesso
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao realizar login', details: error.message });
    }
  },

  // Alterar senha no primeiro acesso
  async firstAccessPassword(req, res) {
    try {
      const { novaSenha } = req.body;
      const userId = req.user.id;

      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({ 
          error: 'Senha deve ter no mínimo 6 caracteres' 
        });
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, 10);

      // Atualizar senha e marcar primeiro_acesso como false
      await db.query(
        'UPDATE usuarios SET senha_hash = ?, primeiro_acesso = false WHERE id = ?',
        [senhaHash, userId]
      );

      res.json({ message: 'Senha alterada com sucesso' });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  },

  // Obter perfil do usuário logado
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const [users] = await db.query(
        'SELECT id, nome, email, tipo, telefone, primeiro_acesso, ultimo_login FROM usuarios WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Se for técnico, buscar informações adicionais
      if (users[0].tipo === 'tecnico') {
        const [tecnico] = await db.query(
          'SELECT * FROM tecnicos WHERE usuario_id = ?',
          [userId]
        );

        if (tecnico.length > 0) {
          users[0].tecnico = tecnico[0];
        }
      }

      res.json(users[0]);

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  // Atualizar perfil do usuário logado
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { nome, telefone } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      await db.query(
        'UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?',
        [nome, telefone, userId]
      );

      res.json({ message: 'Perfil atualizado com sucesso' });

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  // Registrar novo usuário (admin)
  async register(req, res) {
    try {
      const { nome, email, senha, tipo, ativo } = req.body;

      console.log('📝 Registrando novo usuário:', { nome, email, tipo });

      // Validações
      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      if (senha.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
      }

      // Verificar se email já existe
      const [existingUsers] = await db.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Inserir usuário
      const [result] = await db.query(
        `INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo) 
         VALUES (?, ?, ?, ?, ?)`,
        [nome, email, senhaHash, tipo || 'cliente', ativo !== undefined ? ativo : true]
      );

      console.log('✅ Usuário criado com ID:', result.insertId);

      res.status(201).json({
        message: 'Usuário cadastrado com sucesso',
        id: result.insertId
      });

    } catch (error) {
      console.error('❌ Erro ao registrar usuário:', error);
      res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
  }
};

module.exports = authController;
