const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const db = require('../config/database');

router.use(authMiddleware);

// Listar categorias
router.get('/', async (req, res) => {
  try {
    const [categorias] = await db.query(
      'SELECT * FROM categorias_despesa ORDER BY nome ASC'
    );
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Criar categoria (apenas admin)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { nome, cor } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const [result] = await db.query(
      'INSERT INTO categorias_despesa (nome, cor, created_at) VALUES (?, ?, NOW())',
      [nome, cor || '#003DA5']
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      cor: cor || '#003DA5'
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria (apenas admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cor } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    await db.query(
      'UPDATE categorias_despesa SET nome = ?, cor = ? WHERE id = ?',
      [nome, cor || '#003DA5', id]
    );

    res.json({ message: 'Categoria atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria (apenas admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se existem despesas com essa categoria
    const [despesas] = await db.query(
      'SELECT COUNT(*) as count FROM despesas WHERE categoria_id = ?',
      [id]
    );

    if (despesas[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma categoria que possui despesas associadas' 
      });
    }

    await db.query('DELETE FROM categorias_despesa WHERE id = ?', [id]);
    res.json({ message: 'Categoria deletada' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

module.exports = router;
