const express = require('express');
const { requireAdminOrTechnician } = require('../middleware/roleMiddleware');
const manualController = require('../controllers/manualController');
const { uploadManual, uploadVideo } = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar todos os manuais
router.get('/', manualController.listarManuais);

// Buscar manual por ID
router.get('/:id', manualController.buscarPorId);

// Upload de novo manual (admin/tecnico)
router.post('/', requireAdminOrTechnician, uploadManual.single('manual'), manualController.criar);

// Upload de vídeo para manual (admin/tecnico)
router.post('/:id/video', requireAdminOrTechnician, uploadVideo.single('video'), manualController.uploadVideoManual);

// Atualizar manual (admin/tecnico)
router.put('/:id', requireAdminOrTechnician, manualController.atualizar);

// Deletar manual (admin)
router.delete('/:id', requireAdminOrTechnician, manualController.deletar);

// Rotas antigas para compatibilidade
router.get('/legacy/list', requireAdminOrTechnician, manualController.listar);
router.get('/download/:type/:filename', manualController.download);
router.post('/upload/manual', requireAdminOrTechnician, uploadManual.single('arquivo'), manualController.uploadManual);
router.post('/upload/video', requireAdminOrTechnician, uploadVideo.single('arquivo'), manualController.uploadVideo);
router.patch('/:type/:filename/tags', requireAdminOrTechnician, manualController.updateTags);

module.exports = router;
