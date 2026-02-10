const bcrypt = require('bcryptjs');
const db = require('../config/database');

const tecnicoController = {
  // Listar todos os técnicos
  async listar(req, res) {
    try {
      const [tecnicos] = await db.query(
        `SELECT t.*, u.email, u.nome, u.telefone, u.ativo 
         FROM tecnicos t 
         INNER JOIN usuarios u ON t.usuario_id = u.id 
         ORDER BY u.nome`
      );
      res.json(tecnicos);
    } catch (error) {
      console.error('Erro ao listar técnicos:', error);
      res.status(500).json({ error: 'Erro ao listar técnicos' });
    }
  },

  // Buscar técnico por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const [tecnicos] = await db.query(
        `SELECT t.*, u.email, u.nome, u.telefone, u.ativo 
         FROM tecnicos t 
         INNER JOIN usuarios u ON t.usuario_id = u.id 
         WHERE t.id = ?`,
        [id]
      );

      if (tecnicos.length === 0) {
        return res.status(404).json({ error: 'Técnico não encontrado' });
      }

      res.json(tecnicos[0]);
    } catch (error) {
      console.error('Erro ao buscar técnico:', error);
      res.status(500).json({ error: 'Erro ao buscar técnico' });
    }
  },

  // Criar novo técnico
  async criar(req, res) {
    try {
      const { nome, email, telefone, cpf, especialidade, certificados, anos_experiencia } = req.body;
      let fotoPath = null;

      // Validações
      if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
      }

      // Verificar se email já existe
      const [emailExiste] = await db.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (emailExiste.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Processar upload de foto se fornecido
      if (req.file) {
        fotoPath = `/uploads/photos/${req.file.filename}`;
      }

      // Senha padrão para novos técnicos
      const senhaHash = await bcrypt.hash('123456', 10);

      // Criar usuário
      const [resultUsuario] = await db.query(
        `INSERT INTO usuarios (email, senha_hash, nome, telefone, tipo, primeiro_acesso, ativo) 
         VALUES (?, ?, ?, ?, 'tecnico', true, true)`,
        [email, senhaHash, nome, telefone]
      );

      const usuarioId = resultUsuario.insertId;

      // Criar técnico
      const [resultTecnico] = await db.query(
        `INSERT INTO tecnicos (usuario_id, cpf, especialidade, certificados, anos_experiencia, foto) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuarioId, cpf || null, especialidade || null, certificados || null, anos_experiencia || null, fotoPath]
      );

      // Buscar técnico recém-criado para retornar completo
      const [tecnicos] = await db.query(
        `SELECT t.*, u.email, u.nome, u.telefone, u.ativo 
         FROM tecnicos t 
         INNER JOIN usuarios u ON t.usuario_id = u.id 
         WHERE t.id = ?`,
        [resultTecnico.insertId]
      );

      res.status(201).json({
        message: 'Técnico cadastrado com sucesso',
        id: resultTecnico.insertId,
        usuarioId,
        senha_padrao: '123456',
        tecnico: tecnicos[0]
      });
    } catch (error) {
      console.error('Erro ao criar técnico:', error);
      res.status(500).json({ error: 'Erro ao cadastrar técnico' });
    }
  },

  // Atualizar técnico
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, telefone, cpf, especialidade, certificados, anos_experiencia, ativo } = req.body;

      // Buscar técnico
      const [tecnico] = await db.query('SELECT usuario_id, foto FROM tecnicos WHERE id = ?', [id]);
      
      if (tecnico.length === 0) {
        return res.status(404).json({ error: 'Técnico não encontrado' });
      }

      const usuarioId = tecnico[0].usuario_id;
      let fotoPath = tecnico[0].foto; // Manter foto anterior por padrão

      // Processar novo upload de foto se fornecido
      if (req.file) {
        fotoPath = `/uploads/photos/${req.file.filename}`;
      }

      // Atualizar usuário
      await db.query(
        `UPDATE usuarios SET nome = ?, email = ?, telefone = ?, ativo = ? WHERE id = ?`,
        [nome, email, telefone, ativo !== undefined ? ativo : true, usuarioId]
      );

      // Atualizar técnico
      await db.query(
        `UPDATE tecnicos SET cpf = ?, especialidade = ?, certificados = ?, anos_experiencia = ?, foto = ? WHERE id = ?`,
        [cpf, especialidade, certificados, anos_experiencia ?? null, fotoPath, id]
      );

      const [tecnicosAtualizados] = await db.query(
        `SELECT t.*, u.email, u.nome, u.telefone, u.ativo 
         FROM tecnicos t 
         INNER JOIN usuarios u ON t.usuario_id = u.id 
         WHERE t.id = ?`,
        [id]
      );

      res.json({
        message: 'Técnico atualizado com sucesso',
        tecnico: tecnicosAtualizados[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar técnico:', error);
      res.status(500).json({ error: 'Erro ao atualizar técnico' });
    }
  },

  // Deletar técnico (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const [tecnico] = await db.query('SELECT usuario_id FROM tecnicos WHERE id = ?', [id]);
      
      if (tecnico.length === 0) {
        return res.status(404).json({ error: 'Técnico não encontrado' });
      }

      // Desativar usuário ao invés de deletar
      await db.query('UPDATE usuarios SET ativo = false WHERE id = ?', [tecnico[0].usuario_id]);

      res.json({ message: 'Técnico desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar técnico:', error);
      res.status(500).json({ error: 'Erro ao deletar técnico' });
    }
  }
};

module.exports = tecnicoController;
