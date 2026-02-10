const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Rotas públicas
router.post('/login', auditMiddleware('LOGIN'), authController.login);

// Rotas protegidas (requerem autenticação)
router.post('/register', authMiddleware, requireAdmin, auditMiddleware('REGISTRAR_USUARIO'), authController.register);
router.put('/first-access-password', authMiddleware, auditMiddleware('ALTERAR_SENHA_PRIMEIRO_ACESSO'), authController.firstAccessPassword);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, auditMiddleware('ATUALIZAR_PERFIL'), authController.updateProfile);

module.exports = router;
