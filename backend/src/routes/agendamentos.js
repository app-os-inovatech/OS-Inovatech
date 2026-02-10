const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin, requireAdminOrManager } = require('../middleware/roleMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar agendamentos (filtrado por role do usuário)
// Admin vê todos, técnico vê seus, gerenciador vê todos, cliente vê seus
router.get('/', agendamentoController.listar);

// Buscar agendamento específico
router.get('/:id', agendamentoController.buscarPorId);

// Criar agendamento (admin, gerenciador e cliente)
router.post('/', agendamentoController.criar);

// Atribuir técnico a agendamento (apenas admin)
router.patch('/:id/atribuir-tecnico', requireAdmin, agendamentoController.atribuirTecnico);

// Salvar checklist do agendamento
router.post('/:id/checklist', agendamentoController.salvarChecklist);

// Atualizar agendamento (status, datas, etc)
router.patch('/:id', agendamentoController.atualizar);
router.put('/:id', agendamentoController.atualizar);

// Deletar agendamento (admin pode deletar qualquer um, cliente pode deletar seus próprios)
router.delete('/:id', agendamentoController.deletar);

module.exports = router;
