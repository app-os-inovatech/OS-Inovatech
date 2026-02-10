const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrManager } = require('../middleware/roleMiddleware');

// Autenticação obrigatória
router.use(authMiddleware);

// Listagens acessíveis para Admin e Gerenciador
router.get('/', requireAdminOrManager, clienteController.listar);
router.get('/:id', requireAdminOrManager, clienteController.buscarPorId);

// Criação/edição/remoção restritas ao Admin
router.post('/', requireAdmin, clienteController.criar);
router.post('/importar', requireAdmin, clienteController.importar);
router.put('/:id', requireAdmin, clienteController.atualizar);
router.delete('/:id', requireAdmin, clienteController.deletar);

module.exports = router;
