const db = require('../config/database');

module.exports = {
  listar: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT id, nome, ativo, created_at FROM franquias WHERE ativo = true ORDER BY nome');
      return res.json(rows);
    } catch (err) {
      console.error('Erro ao listar franquias:', err);
      return res.status(500).json({ message: 'Erro ao listar franquias' });
    }
  },

  buscarPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT id, nome, ativo, created_at FROM franquias WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ message: 'Franquia não encontrada' });
      return res.json(rows[0]);
    } catch (err) {
      console.error('Erro ao buscar franquia:', err);
      return res.status(500).json({ message: 'Erro ao buscar franquia' });
    }
  },

  criar: async (req, res) => {
    try {
      const { nome, ativo = true } = req.body;
      if (!nome) return res.status(400).json({ message: 'Nome é obrigatório' });
      const [result] = await db.query('INSERT INTO franquias (nome, ativo) VALUES (?, ?)', [nome, ativo]);
      return res.status(201).json({ id: result.insertId, nome, ativo });
    } catch (err) {
      console.error('Erro ao criar franquia:', err);
      return res.status(500).json({ message: 'Erro ao criar franquia' });
    }
  },

  atualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, ativo } = req.body;
      const [result] = await db.query('UPDATE franquias SET nome = COALESCE(?, nome), ativo = COALESCE(?, ativo) WHERE id = ?', [nome, ativo, id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Franquia não encontrada' });
      return res.json({ id, nome, ativo });
    } catch (err) {
      console.error('Erro ao atualizar franquia:', err);
      return res.status(500).json({ message: 'Erro ao atualizar franquia' });
    }
  },

  deletar: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.query('DELETE FROM franquias WHERE id = ?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Franquia não encontrada' });
      return res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar franquia:', err);
      return res.status(500).json({ message: 'Erro ao deletar franquia' });
    }
  },
};