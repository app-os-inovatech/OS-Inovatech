const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const db = require('../config/database');

// Atualizar perfil do técnico (dados + foto)
router.put('/', authMiddleware, uploadMiddleware.uploadPhoto.single('foto'), async (req, res) => {
  try {
    if (req.user.tipo !== 'tecnico') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { nome, telefone, cpf, especialidade, certificados, anos_experiencia, status, disponivel } = req.body;

    const [rows] = await db.query(
      `SELECT t.id, t.cpf, t.especialidade, t.certificados, t.anos_experiencia, t.status, t.disponivel, t.foto, u.nome, u.telefone
       FROM tecnicos t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.usuario_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Técnico não encontrado' });
    }

    const current = rows[0];
    const fotoPath = req.file ? `/uploads/photos/${req.file.filename}` : current.foto;

    const novoNome = nome !== undefined ? nome : current.nome;
    const novoTelefone = telefone !== undefined ? telefone : current.telefone;
    const novoCpf = cpf !== undefined ? cpf : current.cpf;
    const novaEspecialidade = especialidade !== undefined ? especialidade : current.especialidade;
    const novosCertificados = certificados !== undefined ? certificados : current.certificados;
    const novosAnosExperiencia = anos_experiencia !== undefined && anos_experiencia !== ''
      ? parseInt(anos_experiencia, 10)
      : current.anos_experiencia;
    const novoStatus = status !== undefined && status !== '' ? status : current.status;
    const novoDisponivel = disponivel !== undefined
      ? (disponivel === 'true' || disponivel === '1' || disponivel === true)
      : current.disponivel;

    await db.query(
      'UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?',
      [novoNome, novoTelefone, req.user.id]
    );

    await db.query(
      'UPDATE tecnicos SET cpf = ?, especialidade = ?, certificados = ?, anos_experiencia = ?, status = ?, disponivel = ?, foto = ? WHERE id = ?',
      [novoCpf, novaEspecialidade, novosCertificados, novosAnosExperiencia, novoStatus, novoDisponivel, fotoPath, current.id]
    );

    res.json({
      message: 'Perfil atualizado com sucesso',
      foto: fotoPath
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil do técnico:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;
