const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const db = require('../config/database');
const path = require('path');
const fs = require('fs');

router.use(authMiddleware);

// Criar diretório de vouchers se não existir
const vouchersDir = path.join(__dirname, '../uploads/vouchers');
if (!fs.existsSync(vouchersDir)) {
  fs.mkdirSync(vouchersDir, { recursive: true });
}

// Listar vouchers do técnico
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    console.log('🔍 Buscando vouchers para usuário:', { id: usuarioId, email: req.user.email, tipo: req.user.tipo });

    const [vouchers] = await db.query(
      `SELECT v.* FROM vouchers v
       WHERE v.usuario_id = ?
       ORDER BY v.created_at DESC`,
      [usuarioId]
    );

    console.log('📄 Vouchers encontrados:', vouchers.length);
    res.json(vouchers);
  } catch (error) {
    console.error('Erro ao listar vouchers:', error);
    res.status(500).json({ error: 'Erro ao listar vouchers' });
  }
});

// Criar novo voucher
router.post('/', uploadMiddleware.uploadVoucher, async (req, res) => {
  try {
    const { descricao, loja_id } = req.body;
    const usuarioId = req.user.id;

    if (!descricao || !req.file) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const arquivoNome = `${Date.now()}-${req.file.originalname}`;
    const caminhoDestino = path.join(vouchersDir, arquivoNome);

    // Mover arquivo para diretório de vouchers
    fs.renameSync(req.file.path, caminhoDestino);

    const [result] = await db.query(
      `INSERT INTO vouchers (usuario_id, loja_id, descricao, arquivo, arquivo_nome, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [usuarioId, loja_id || null, descricao, `/uploads/vouchers/${arquivoNome}`, req.file.originalname]
    );

    res.json({
      id: result.insertId,
      descricao,
      arquivo: `/uploads/vouchers/${arquivoNome}`,
      arquivo_nome: req.file.originalname,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Erro ao criar voucher:', error);
    res.status(500).json({ error: 'Erro ao criar voucher' });
  }
});

// Deletar voucher
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    // Verificar se o voucher pertence ao usuário
    const [vouchers] = await db.query(
      'SELECT arquivo FROM vouchers WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );

    if (vouchers.length === 0) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Deletar arquivo
    const caminhoArquivo = path.join(__dirname, '..', vouchers[0].arquivo);
    if (fs.existsSync(caminhoArquivo)) {
      fs.unlinkSync(caminhoArquivo);
    }

    // Deletar do banco de dados
    await db.query('DELETE FROM vouchers WHERE id = ?', [id]);

    res.json({ message: 'Voucher deletado' });
  } catch (error) {
    console.error('Erro ao deletar voucher:', error);
    res.status(500).json({ error: 'Erro ao deletar voucher' });
  }
});

module.exports = router;
