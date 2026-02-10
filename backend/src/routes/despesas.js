const express = require('express');
const router = express.Router();
const despesaController = require('../controllers/despesaController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Criar despesa
router.post('/', despesaController.createDespesa);

// Listar despesas (técnico vê só as suas, admin vê todas)
router.get('/', despesaController.listDespesas);

// Gerar relatório em Excel (apenas admin)
router.get('/relatorio/excel', despesaController.gerarRelatorioExcel);

// Deletar despesa
router.delete('/:id', despesaController.deleteDespesa);

module.exports = router;
