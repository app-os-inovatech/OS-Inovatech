const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Todas as rotas requerem autenticação e permissão de admin
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);
router.patch('/:id', usuarioController.atualizar);
router.put('/:id', usuarioController.atualizar);
router.delete('/:id', usuarioController.deletar);

module.exports = router;
