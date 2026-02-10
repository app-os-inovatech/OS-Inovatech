const express = require('express');
const router = express.Router();
const relatorioDiarioController = require('../controllers/relatorioDiarioController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Criar novo relatório diário (técnico)
router.post('/', requireRole('tecnico'), relatorioDiarioController.criar);

// Listar relatórios (técnico vê seus, admin vê todos)
router.get('/', relatorioDiarioController.listar);

// Buscar relatório específico por ID
router.get('/:id', relatorioDiarioController.buscarPorId);

// Deletar relatório (apenas admin)
router.delete('/:id', requireRole('admin', 'gerenciador'), relatorioDiarioController.deletar);

module.exports = router;
