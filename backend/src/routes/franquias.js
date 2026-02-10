const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrManager } = require('../middleware/roleMiddleware');
const franquiaController = require('../controllers/franquiaController');

// Listagem: admin, gerenciador ou cliente (clientes precisam ver franquias para criar solicitações)
router.get('/', authMiddleware, franquiaController.listar);
router.get('/:id', authMiddleware, franquiaController.buscarPorId);

// Mutação: somente admin
router.post('/', authMiddleware, requireAdmin, franquiaController.criar);
router.put('/:id', authMiddleware, requireAdmin, franquiaController.atualizar);
router.delete('/:id', authMiddleware, requireAdmin, franquiaController.deletar);

module.exports = router;