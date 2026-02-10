const express = require('express');
const router = express.Router();
const checklistEntradaObraController = require('../controllers/checklistEntradaObraController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas do checklist de entrada de obra
router.post('/', checklistEntradaObraController.criar);
router.get('/', checklistEntradaObraController.listar);
router.get('/:id', checklistEntradaObraController.buscarPorId);
router.put('/:id', checklistEntradaObraController.atualizar);
router.delete('/:id', checklistEntradaObraController.deletar);

module.exports = router;
