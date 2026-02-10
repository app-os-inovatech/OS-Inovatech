const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const db = require('../config/database');

// Configurar upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/vouchers');
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error('Erro ao criar diretório:', err);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `voucher-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|jpg|jpeg|png|doc|docx)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Arquivo não permitido'));
    }
  }
});

// GET - Listar todos os vouchers (admin)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const query = `
      SELECT v.*, u.nome as usuario_nome, l.nome as loja_nome
      FROM vouchers v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN lojas l ON v.loja_id = l.id
      ORDER BY v.created_at DESC
    `;

    const [results] = await db.query(query);
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar vouchers:', error);
    res.status(500).json({ erro: 'Erro ao buscar vouchers' });
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

// POST - Enviar novo voucher (admin para técnico)
router.post('/', 
  authMiddleware, 
  requireRole('admin'), 
  upload.single('arquivo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ erro: 'Arquivo é obrigatório' });
      }

      const { descricao, tecnico_id } = req.body;
      console.log('📄 Criando voucher:', { descricao, tecnico_id, usuario_criador: req.user.id });
      
      if (!descricao || !tecnico_id) {
        return res.status(400).json({ erro: 'Descrição e técnico são obrigatórios' });
      }

      const arquivo = `/uploads/vouchers/${req.file.filename}`;
      const arquivo_nome = req.file.originalname;

      const query = `
        INSERT INTO vouchers (usuario_id, descricao, arquivo, arquivo_nome, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await db.query(query, [tecnico_id, descricao, arquivo, arquivo_nome]);
      console.log('✅ Voucher criado:', { insertId: result.insertId, usuario_id: tecnico_id });
      
      res.json({ 
        id: result.insertId,
        usuario_id: tecnico_id,
        descricao,
        arquivo,
        arquivo_nome,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ erro: 'Erro no servidor' });
    }
  }
);

// DELETE - Deletar voucher (admin apenas)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar voucher
    const selectQuery = 'SELECT arquivo FROM vouchers WHERE id = ?';
    
    db.query(selectQuery, [id], async (err, results) => {
      if (err) {
        console.error('Erro ao buscar voucher:', err);
        return res.status(500).json({ erro: 'Erro ao buscar voucher' });
      }

      if (results.length === 0) {
        return res.status(404).json({ erro: 'Voucher não encontrado' });
      }

      // Deletar arquivo
      try {
        const filePath = path.join(__dirname, '../../' + results[0].arquivo);
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Erro ao deletar arquivo:', err);
      }

      // Deletar registro
      const deleteQuery = 'DELETE FROM vouchers WHERE id = ?';
      await db.query(deleteQuery, [id]);
      res.json({ sucesso: true });
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

module.exports = router;
