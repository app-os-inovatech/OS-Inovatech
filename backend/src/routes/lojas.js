const express = require('express');
const router = express.Router();
const lojaController = require('../controllers/lojaController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrManager } = require('../middleware/roleMiddleware');

// Autenticação obrigatória
router.use(authMiddleware);

// Listagens acessíveis para todos os usuários autenticados (clientes precisam ver lojas para criar solicitações)
router.get('/', lojaController.listar);
router.get('/cnpj/:cnpj', requireAdmin, lojaController.buscarCnpj);
router.get('/:id', lojaController.buscarPorId);

// Criação/edição/remoção restritas ao Admin
router.post('/', requireAdmin, lojaController.criar);
router.put('/:id', requireAdmin, lojaController.atualizar);
router.delete('/:id', requireAdmin, lojaController.deletar);

module.exports = router;
