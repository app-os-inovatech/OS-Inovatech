const bcrypt = require('bcryptjs');
const db = require('../config/database');

const clienteController = {
  // Listar todos os clientes
  async listar(req, res) {
    try {
      const [clientes] = await db.query(
        `SELECT u.id, u.email, u.nome, u.telefone, u.razao_social, u.cnpj, u.endereco, u.ativo, u.created_at as criado_em 
         FROM usuarios u 
         WHERE u.tipo = 'cliente' 
         ORDER BY u.nome`
      );
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  // Buscar cliente por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const [clientes] = await db.query(
        `SELECT u.id, u.email, u.nome, u.telefone, u.razao_social, u.cnpj, u.endereco, u.ativo, u.created_at as criado_em 
         FROM usuarios u 
         WHERE u.id = ? AND u.tipo = 'cliente'`,
        [id]
      );

      if (clientes.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      res.json(clientes[0]);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  // Criar novo cliente
  async criar(req, res) {
    try {
      const { nome, email, telefone, razao_social, cnpj, endereco } = req.body;

      // Validações
      if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
      }

      // Verificar se email já existe
      const [emailExiste] = await db.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (emailExiste.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Senha padrão para novos clientes
      const senhaHash = await bcrypt.hash('123456', 10);

      // Criar usuário cliente com novos campos
      const [result] = await db.query(
        `INSERT INTO usuarios (email, senha_hash, nome, telefone, razao_social, cnpj, endereco, tipo, primeiro_acesso, ativo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente', true, true)`,
        [email, senhaHash, nome, telefone || null, razao_social || null, cnpj || null, endereco || null]
      );

      res.status(201).json({
        message: 'Cliente cadastrado com sucesso',
        id: result.insertId,
        senha_padrao: '123456'
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ error: 'Erro ao cadastrar cliente' });
    }
  },

  // Atualizar cliente
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, telefone, razao_social, cnpj, endereco, ativo } = req.body;

      await db.query(
        `UPDATE usuarios 
         SET nome = COALESCE(?, nome), 
             email = COALESCE(?, email), 
             telefone = COALESCE(?, telefone), 
             razao_social = COALESCE(?, razao_social), 
             cnpj = COALESCE(?, cnpj), 
             endereco = COALESCE(?, endereco), 
             ativo = COALESCE(?, ativo)
         WHERE id = ? AND tipo = 'cliente'`,
        [nome, email, telefone, razao_social, cnpj, endereco, (ativo !== undefined ? ativo : null), id]
      );

      res.json({ message: 'Cliente atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  // Deletar cliente (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      await db.query(
        `UPDATE usuarios SET ativo = false WHERE id = ? AND tipo = 'cliente'`,
        [id]
      );

      res.json({ message: 'Cliente desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  },

  // Importar clientes em lote
  async importar(req, res) {
    try {
      const clientes = req.body;

      if (!Array.isArray(clientes) || clientes.length === 0) {
        return res.status(400).json({ error: 'Nenhum cliente para importar' });
      }

      let importados = 0;
      let erros = [];

      for (const cliente of clientes) {
        try {
          const { nome, email, telefone, razao_social, cnpj, endereco } = cliente;

          if (!nome || !email) {
            erros.push(`Linha inválida: nome e email são obrigatórios`);
            continue;
          }

          // Verificar se email já existe
          const [emailExiste] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
          );

          if (emailExiste.length > 0) {
            erros.push(`Email ${email} já cadastrado`);
            continue;
          }

          // Senha padrão
          const senhaHash = await bcrypt.hash('123456', 10);

          await db.query(
            `INSERT INTO usuarios (email, senha_hash, nome, telefone, razao_social, cnpj, endereco, tipo, primeiro_acesso, ativo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente', true, true)`,
            [email, senhaHash, nome, telefone || null, razao_social || null, cnpj || null, endereco || null]
          );

          importados++;
        } catch (err) {
          erros.push(`Erro ao processar cliente: ${err.message}`);
        }
      }

      res.json({
        importados,
        total: clientes.length,
        erros: erros.length > 0 ? erros : undefined
      });
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      res.status(500).json({ error: 'Erro ao importar clientes' });
    }
  }
};

module.exports = clienteController;
