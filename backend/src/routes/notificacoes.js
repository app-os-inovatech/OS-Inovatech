const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/database');

router.use(authMiddleware);

// Listar notificações do usuário
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const [notificacoes] = await db.query(
      'SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 50',
      [usuarioId]
    );
    res.json(notificacoes);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
});

// Marcar notificação como lida
router.patch('/:id/ler', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    
    await db.query(
      'UPDATE notificacoes SET lida = TRUE WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    
    res.json({ message: 'Notificação marcada como lida' });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
});

// Marcar todas como lidas
router.patch('/ler-todas', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    await db.query(
      'UPDATE notificacoes SET lida = TRUE WHERE usuario_id = ? AND lida = FALSE',
      [usuarioId]
    );
    
    res.json({ message: 'Todas notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
});

router.post('/agendamento-email', notificacaoController.enviarEmailAgendamento);

module.exports = router;
