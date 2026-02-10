const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const typeToFolder = {
  manual: 'manuals',
  video: 'videos'
};

const metadataPath = path.join(__dirname, '../../uploads/metadata.json');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const manualController = {
  // Listar manuais do banco de dados
  async listarManuais(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT id, titulo, descricao, categoria, arquivo, video, created_at 
        FROM manuais 
        ORDER BY created_at DESC
      `);
      return res.json(rows);
    } catch (err) {
      console.error('Erro ao listar manuais:', err);
      return res.status(500).json({ message: 'Erro ao listar manuais' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM manuais WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ message: 'Manual não encontrado' });
      return res.json(rows[0]);
    } catch (err) {
      console.error('Erro ao buscar manual:', err);
      return res.status(500).json({ message: 'Erro ao buscar manual' });
    }
  },

  async criar(req, res) {
    try {
      const { titulo, descricao, categoria } = req.body;
      const arquivo = req.file ? req.file.filename : null;

      if (!titulo || !arquivo) {
        return res.status(400).json({ message: 'Título e arquivo são obrigatórios' });
      }

      const [result] = await db.query(
        'INSERT INTO manuais (titulo, descricao, categoria, arquivo) VALUES (?, ?, ?, ?)',
        [titulo, descricao, categoria, arquivo]
      );

      return res.status(201).json({ 
        id: result.insertId, 
        titulo, 
        descricao, 
        categoria, 
        arquivo 
      });
    } catch (err) {
      console.error('Erro ao criar manual:', err);
      return res.status(500).json({ message: 'Erro ao criar manual' });
    }
  },

  async uploadVideoManual(req, res) {
    try {
      const { id } = req.params;
      const video = req.file ? req.file.filename : null;

      if (!video) {
        return res.status(400).json({ message: 'Arquivo de vídeo é obrigatório' });
      }

      // Verificar se manual existe
      const [rows] = await db.query('SELECT id, video FROM manuais WHERE id = ?', [id]);
      if (!rows.length) {
        // Deletar arquivo enviado se manual não existe
        try {
          const filePath = path.join(__dirname, '../../uploads/videos', video);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.warn('Erro ao deletar vídeo:', err);
        }
        return res.status(404).json({ message: 'Manual não encontrado' });
      }

      // Deletar vídeo antigo se existir
      const videoAntigo = rows[0].video;
      if (videoAntigo) {
        try {
          const filePath = path.join(__dirname, '../../uploads/videos', videoAntigo);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.warn('Erro ao deletar vídeo antigo:', err);
        }
      }

      // Atualizar com novo vídeo
      await db.query('UPDATE manuais SET video = ? WHERE id = ?', [video, id]);

      return res.json({ id, video, message: 'Vídeo enviado com sucesso' });
    } catch (err) {
      console.error('Erro ao fazer upload de vídeo:', err);
      return res.status(500).json({ message: 'Erro ao fazer upload de vídeo' });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      
      // Buscar arquivo antes de deletar
      const [rows] = await db.query('SELECT arquivo FROM manuais WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ message: 'Manual não encontrado' });

      const arquivo = rows[0].arquivo;
      
      // Deletar do banco
      await db.query('DELETE FROM manuais WHERE id = ?', [id]);

      // Tentar deletar arquivo físico
      try {
        const filePath = path.join(__dirname, '../../uploads/manuals', arquivo);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn('Arquivo não encontrado para deletar:', fileErr);
      }

      return res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar manual:', err);
      return res.status(500).json({ message: 'Erro ao deletar manual' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descricao, categoria } = req.body;

      console.log('Atualizando manual ID:', id);
      console.log('Dados recebidos:', { titulo, descricao, categoria });

      // Verificar se manual existe
      const [rows] = await db.query('SELECT id FROM manuais WHERE id = ?', [id]);
      if (!rows.length) {
        console.log('Manual não encontrado:', id);
        return res.status(404).json({ message: 'Manual não encontrado' });
      }

      // Atualizar
      await db.query(
        'UPDATE manuais SET titulo = COALESCE(?, titulo), descricao = COALESCE(?, descricao), categoria = COALESCE(?, categoria) WHERE id = ?',
        [titulo, descricao, categoria, id]
      );

      console.log('Manual atualizado com sucesso');
      return res.json({ id, titulo, descricao, categoria });
    } catch (err) {
      console.error('Erro ao atualizar manual:', err);
      return res.status(500).json({ message: 'Erro ao atualizar manual', error: err.message });
    }
  },

  // Métodos antigos para compatibilidade
  async listar(req, res) {
    const { type } = req.query;
    if (!validarTipo(type, res)) return;

    try {
      const arquivos = listarArquivos(type);
      res.json({ arquivos });
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
  },

  async uploadManual(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    res.json({
      message: 'Manual enviado com sucesso',
      arquivo: {
        nome: req.file.filename,
        url: `/uploads/manuals/${req.file.filename}`,
        tamanho: req.file.size
      }
    });
  },

  async uploadVideo(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    res.json({
      message: 'Vídeo enviado com sucesso',
      arquivo: {
        nome: req.file.filename,
        url: `/uploads/videos/${req.file.filename}`,
        tamanho: req.file.size
      }
    });
  },

  async download(req, res) {
    const { type, filename } = req.params;
    if (!validarTipo(type, res)) return;

    const folder = typeToFolder[type];
    const filePath = path.join(__dirname, '../../uploads', folder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Erro ao baixar arquivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro ao baixar arquivo' });
        }
      }
    });
  },

  async updateTags(req, res) {
    const { type, filename } = req.params;
    const { tags } = req.body;

    if (!validarTipo(type, res)) return;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags deve ser um array' });
    }

    const folder = typeToFolder[type];
    const filePath = path.join(__dirname, '../../uploads', folder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const metadata = loadMetadata();
    const metaType = type === 'manual' ? 'manuals' : 'videos';

    if (!metadata[metaType][filename]) {
      metadata[metaType][filename] = {};
    }
    metadata[metaType][filename].tags = tags;

    saveMetadata(metadata);

    res.json({ message: 'Tags atualizadas com sucesso', tags });
  }
};

module.exports = manualController;
