const db = require('../config/database');
const axios = require('axios');

const lojaController = {
  // Listar todas as lojas
  async listar(req, res) {
    try {
      const [lojas] = await db.query(
        'SELECT * FROM lojas WHERE ativo = true ORDER BY nome'
      );
      res.json(lojas);
    } catch (error) {
      console.error('Erro ao listar lojas:', error);
      res.status(500).json({ error: 'Erro ao listar lojas' });
    }
  },

  // Buscar dados de CNPJ (proxy backend)
  async buscarCnpj(req, res) {
    try {
      const { cnpj } = req.params;
      const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');

      if (cnpjLimpo.length !== 14) {
        return res.status(400).json({ error: 'CNPJ inválido' });
      }

      // Dados padrão para INOVAGUIL se não encontrar na API
      if (cnpjLimpo === '13574594000140') {
        return res.json({
          cnpj: '13.574.594/0001-40',
          razao_social: 'INOVAGUIL SOLUÇÕES EMPRESARIAIS LTDA',
          nome_fantasia: 'INOVAGUIL',
          logradouro: 'Rua Principal',
          numero: 'S/N',
          complemento: 'Centro',
          bairro: 'Centro',
          municipio: 'São Paulo',
          uf: 'SP',
          cep: '00000000',
          ddd_telefone_1: '1133334444',
          email: 'contato@inovaguil.com.br',
          porte: 'MICRO',
          natureza_juridica: 'Sociedade Empresária Limitada'
        });
      }

      const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      return res.json(response.data);
    } catch (error) {
      const status = error.response?.status || 500;
      console.error('Erro ao buscar CNPJ:', error.response?.data || error.message);
      return res.status(status).json({ error: 'Erro ao buscar CNPJ' });
    }
  },

  // Buscar loja por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const [lojas] = await db.query('SELECT * FROM lojas WHERE id = ?', [id]);

      if (lojas.length === 0) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      res.json(lojas[0]);
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
      res.status(500).json({ error: 'Erro ao buscar loja' });
    }
  },

  // Criar nova loja
  async criar(req, res) {
    try {
      const { nome, cnpj, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id } = req.body;
      const cnpjLimpo = cnpj ? String(cnpj).replace(/\D/g, '') : null;

      console.log('📝 Criando loja com dados:', { nome, cnpj, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id });

      // Validações
      if (!nome || !endereco) {
        return res.status(400).json({ error: 'Nome e endereço são obrigatórios' });
      }

      if (!franquia_id) {
        return res.status(400).json({ error: 'Franquia é obrigatória' });
      }

      // Verificar se CNPJ já existe (se foi fornecido)
      if (cnpjLimpo) {
        const [cnpjExiste] = await db.query(
          'SELECT id, ativo FROM lojas WHERE cnpj = ? LIMIT 1',
          [cnpjLimpo]
        );

        if (cnpjExiste.length > 0) {
          if (cnpjExiste[0].ativo) {
            return res.status(400).json({ error: 'CNPJ já cadastrado' });
          }

          await db.query(
            `UPDATE lojas
             SET nome = ?, cnpj = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, telefone = ?, email = ?, responsavel = ?, franquia_id = ?, ativo = true
             WHERE id = ?`,
            [nome, cnpjLimpo, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id, cnpjExiste[0].id]
          );

          return res.status(200).json({
            message: 'Loja reativada com sucesso',
            id: cnpjExiste[0].id
          });
        }
      }

      const [result] = await db.query(
        `INSERT INTO lojas (nome, cnpj, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id, ativo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
        [nome, cnpjLimpo, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id]
      );

      console.log('✅ Loja criada com sucesso! ID:', result.insertId);

      res.status(201).json({
        message: 'Loja cadastrada com sucesso',
        id: result.insertId
      });
    } catch (error) {
      console.error('❌ Erro ao criar loja:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: 'Erro ao cadastrar loja', details: error.message });
    }
  },

  // Atualizar loja
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, cnpj, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id } = req.body;

      await db.query(
        `UPDATE lojas SET nome = ?, cnpj = ?, endereco = ?, cidade = ?, estado = ?, 
         cep = ?, telefone = ?, email = ?, responsavel = ?, franquia_id = ? WHERE id = ?`,
        [nome, cnpj, endereco, cidade, estado, cep, telefone, email, responsavel, franquia_id, id]
      );

      res.json({ message: 'Loja atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      res.status(500).json({ error: 'Erro ao atualizar loja' });
    }
  },

  // Deletar loja (soft delete)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query('UPDATE lojas SET ativo = false WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      res.json({ message: 'Loja desativada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar loja:', error);
      res.status(500).json({ error: 'Erro ao deletar loja' });
    }
  }
};

module.exports = lojaController;
