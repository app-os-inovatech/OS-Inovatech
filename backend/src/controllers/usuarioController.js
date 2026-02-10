const db = require('../config/database');
const bcrypt = require('bcrypt');

const usuarioController = {
  // Listar todos os usuários
  async listar(req, res) {
    try {
      const [usuarios] = await db.query(
        `SELECT id, email, nome, tipo, ativo, created_at 
         FROM usuarios 
         ORDER BY nome`
      );
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },

  // Buscar usuário por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const [usuarios] = await db.query(
        `SELECT id, email, nome, tipo, ativo, created_at 
         FROM usuarios 
         WHERE id = ?`,
        [id]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(usuarios[0]);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  },

  // Atualizar usuário (incluindo atribuição de técnico e tipo)
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, tipo, senha, tecnicoId, ativo } = req.body;

      console.log('📝 Atualizando usuário:', id);
      console.log('📋 Dados recebidos:', { nome, email, tipo, senha: senha ? '***' : undefined, tecnicoId, ativo });

      let query = 'UPDATE usuarios SET ';
      const params = [];
      const campos = [];

      if (nome !== undefined) {
        campos.push('nome = ?');
        params.push(nome);
      }
      if (email !== undefined) {
        campos.push('email = ?');
        params.push(email);
      }
      if (tipo !== undefined) {
        campos.push('tipo = ?');
        params.push(tipo);
      }
      if (senha) {
        const senhaHash = await bcrypt.hash(senha, 10);
        campos.push('senha_hash = ?');
        params.push(senhaHash);
      }
      if (tecnicoId !== undefined) {
        campos.push('tecnico_id = ?');
        params.push(tecnicoId || null);
      }
      if (ativo !== undefined) {
        campos.push('ativo = ?');
        params.push(ativo);
      }

      if (campos.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      query += campos.join(', ') + ' WHERE id = ?';
      params.push(id);

      console.log('🔍 Query:', query);
      console.log('📊 Params:', params);

      const [result] = await db.query(query, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  },

  // Deletar usuário
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se não é o próprio usuário
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
      }

      const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  }
};

module.exports = usuarioController;
