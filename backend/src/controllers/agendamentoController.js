const db = require('../config/database');

const agendamentoController = {
  // Listar todos os agendamentos (com filtros por role)
  async listar(req, res) {
    try {
      const usuarioId = req.user.id;
      const userTipo = req.user.tipo;
      console.log('=== LISTAR AGENDAMENTOS ===');
      console.log('Usuário ID:', usuarioId);
      console.log('Tipo:', userTipo);
      
      let query = `
        SELECT 
          a.id,
          a.loja_id,
          a.cliente_id,
          a.franquia_id,
          a.tecnico_id,
          a.tipo_servico,
          a.data_hora,
          a.data_inicio_execucao,
          a.data_conclusao,
          a.status,
          a.observacoes,
          a.descricao_servico,
          a.materiais_utilizados,
          a.tempo_execucao,
          l.id as loja_id_full,
          l.nome as loja_nome,
          l.endereco as loja_endereco,
          l.cidade as loja_cidade,
          l.estado as loja_estado,
          l.cep as loja_cep,
          u.nome as cliente_nome,
          u.email as cliente_email,
          f.nome as franquia_nome,
          t.usuario_id as tecnico_usuario_id,
          u_tech.nome as tecnico_nome
        FROM agendamentos a
        LEFT JOIN lojas l ON a.loja_id = l.id
        LEFT JOIN usuarios u ON a.cliente_id = u.id
        LEFT JOIN franquias f ON a.franquia_id = f.id
        LEFT JOIN tecnicos t ON a.tecnico_id = t.id
        LEFT JOIN usuarios u_tech ON t.usuario_id = u_tech.id
      `;

      // Filtrar por role
      if (userTipo === 'tecnico') {
        // Técnico vê apenas seus agendamentos
        query += `
          WHERE a.tecnico_id IN (
            SELECT id FROM tecnicos WHERE usuario_id = ?
          )
        `;
      } else if (userTipo === 'gerenciador') {
        // Gerenciador vê todos os agendamentos (consulta)
        query += ``;
      } else if (userTipo === 'cliente') {
        // Cliente vê apenas seus agendamentos
        query += `WHERE a.cliente_id = ?`;
      }

      query += ` ORDER BY a.data_hora DESC`;

      let result;
      if (userTipo === 'tecnico') {
        console.log('Executando query para técnico:', query);
        console.log('Params:', [usuarioId]);
        result = await db.query(query, [usuarioId]);
      } else if (userTipo === 'cliente') {
        result = await db.query(query, [usuarioId]);
      } else {
        result = await db.query(query);
      }

      const agendamentos = result[0] || [];
      console.log('Agendamentos encontrados:', agendamentos.length);
      
      // Formatar resposta com objeto loja
      const agendamentosFormatados = agendamentos.map(ag => ({
        ...ag,
        loja: ag.loja_id ? {
          id: ag.loja_id,
          nome: ag.loja_nome,
          endereco: ag.loja_endereco,
          cidade: ag.loja_cidade,
          estado: ag.loja_estado,
          cep: ag.loja_cep
        } : null
      }));
      
      res.json(agendamentosFormatados);
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao listar agendamentos' });
    }
  },

  // Buscar agendamento por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          a.*,
          l.nome as loja_nome,
          u.nome as cliente_nome,
          u.email as cliente_email,
          f.nome as franquia_nome,
          t.usuario_id as tecnico_usuario_id
        FROM agendamentos a
        LEFT JOIN lojas l ON a.loja_id = l.id
        LEFT JOIN usuarios u ON a.cliente_id = u.id
        LEFT JOIN franquias f ON a.franquia_id = f.id
        LEFT JOIN tecnicos t ON a.tecnico_id = t.id
        WHERE a.id = ?
      `;

      const [result] = await db.query(query, [id]);
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
  },

  // Criar novo agendamento
  async criar(req, res) {
    try {
      console.log('=== CRIAR AGENDAMENTO ===');
      console.log('Body recebido:', req.body);
      console.log('Usuário:', req.user);
      
      const {
        loja_id,
        cliente_id,
        franquia_id,
        tipo_servico,
        data_hora,
        data_inicio_execucao,
        data_conclusao,
        data_final_montagem,
        observacoes,
        descricao_servico,
        checklist
      } = req.body;

      if (!loja_id || !cliente_id || !tipo_servico || !data_hora) {
        return res.status(400).json({ 
          error: 'Dados obrigatórios: loja_id, cliente_id, tipo_servico, data_hora' 
        });
      }

      // Converter datas ISO para formato MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
      const formatarDataMySQL = (dataISO) => {
        if (!dataISO) return null;
        const data = new Date(dataISO);
        return data.toISOString().slice(0, 19).replace('T', ' ');
      };

      const dataHoraMySQL = formatarDataMySQL(data_hora);
      const dataInicioMySQL = formatarDataMySQL(data_inicio_execucao);
      const dataConclusaoMySQL = formatarDataMySQL(data_conclusao);
      const dataFinalMontagemMySQL = formatarDataMySQL(data_final_montagem);

      const query = `
        INSERT INTO agendamentos 
        (loja_id, cliente_id, franquia_id, tipo_servico, data_hora, data_inicio_execucao, data_conclusao, data_final_montagem, observacoes, descricao_servico, checklist, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
      `;

      console.log('Query:', query);
      console.log('Parâmetros:', [
        loja_id,
        cliente_id,
        franquia_id,
        tipo_servico,
        dataHoraMySQL,
        dataInicioMySQL,
        dataConclusaoMySQL,
        observacoes || null,
        descricao_servico || null
      ]);

      const [result] = await db.query(query, [
        loja_id,
        cliente_id,
        franquia_id || null,
        tipo_servico,
        dataHoraMySQL,
        dataInicioMySQL,
        dataConclusaoMySQL,
        dataFinalMontagemMySQL,
        observacoes || null,
        descricao_servico || null,
        checklist ? JSON.stringify(checklist) : null
      ]);

      console.log('Agendamento criado com ID:', result.insertId);

      // Buscar informações para as notificações
      const [lojaInfo] = await db.query('SELECT nome FROM lojas WHERE id = ?', [loja_id]);
      const [clienteInfo] = await db.query('SELECT nome FROM usuarios WHERE id = ?', [cliente_id]);
      const lojaNome = lojaInfo && lojaInfo[0] ? lojaInfo[0].nome : 'Loja';
      const clienteNome = clienteInfo && clienteInfo[0] ? clienteInfo[0].nome : 'Cliente';

      // Criar notificação para todos os administradores
      const [admins] = await db.query("SELECT id FROM usuarios WHERE tipo = 'admin'");
      for (const admin of admins) {
        await db.query(
          `INSERT INTO notificacoes (usuario_id, mensagem, tipo) VALUES (?, ?, ?)`,
          [
            admin.id,
            `Nova solicitação de serviço criada por ${clienteNome} para ${lojaNome}. Tipo: ${tipo_servico}`,
            'novo_agendamento'
          ]
        );
      }

      // Se houver técnico atribuído, criar notificação para ele
      if (req.body.tecnico_id) {
        const [tecnicoInfo] = await db.query('SELECT usuario_id FROM tecnicos WHERE id = ?', [req.body.tecnico_id]);
        if (tecnicoInfo && tecnicoInfo[0] && tecnicoInfo[0].usuario_id) {
          await db.query(
            `INSERT INTO notificacoes (usuario_id, mensagem, tipo) VALUES (?, ?, ?)`,
            [
              tecnicoInfo[0].usuario_id,
              `Você foi designado para um novo serviço em ${lojaNome}. Tipo: ${tipo_servico}`,
              'atribuicao_tecnico'
            ]
          );
        }
      }

      res.status(201).json({
        id: result.insertId,
        loja_id,
        cliente_id,
        franquia_id,
        tipo_servico,
        data_hora,
        data_inicio_execucao,
        data_conclusao,
        observacoes,
        descricao_servico,
        status: 'pendente'
      });
    } catch (error) {
      console.error('=== ERRO AO CRIAR AGENDAMENTO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      if (error.sql) {
        console.error('SQL:', error.sql);
        console.error('SQL Message:', error.sqlMessage);
      }
      res.status(500).json({ error: 'Erro ao criar agendamento: ' + error.message });
    }
  },

  // Atribuir técnico a um agendamento
  async atribuirTecnico(req, res) {
    try {
      const { id } = req.params;
      const { tecnico_id } = req.body;

      if (!tecnico_id) {
        return res.status(400).json({ error: 'tecnico_id é obrigatório' });
      }

      // Verificar se o agendamento existe e buscar informações
      const [agendamento] = await db.query(
        `SELECT a.*, l.nome as loja_nome, u.nome as cliente_nome 
         FROM agendamentos a 
         LEFT JOIN lojas l ON a.loja_id = l.id 
         LEFT JOIN usuarios u ON a.cliente_id = u.id 
         WHERE a.id = ?`,
        [id]
      );

      if (!agendamento || agendamento.length === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar se o técnico existe e buscar o usuario_id
      const [tecnico] = await db.query(
        'SELECT id, usuario_id FROM tecnicos WHERE id = ?',
        [tecnico_id]
      );

      if (!tecnico || tecnico.length === 0) {
        return res.status(404).json({ error: 'Técnico não encontrado' });
      }

      // Atualizar agendamento
      const query = `
        UPDATE agendamentos 
        SET tecnico_id = ?, status = 'atribuido', updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [tecnico_id, id]);

      // Criar notificação para o técnico
      if (tecnico[0].usuario_id) {
        const lojaNome = agendamento[0].loja_nome || 'a loja';
        const tipoServico = agendamento[0].tipo_servico || 'serviço';
        await db.query(
          `INSERT INTO notificacoes (usuario_id, mensagem, tipo) VALUES (?, ?, ?)`,
          [
            tecnico[0].usuario_id,
            `Você foi designado para um novo ${tipoServico} em ${lojaNome}`,
            'atribuicao_tecnico'
          ]
        );
      }

      res.json({
        message: 'Técnico atribuído com sucesso',
        agendamento_id: id,
        tecnico_id: tecnico_id,
        status: 'atribuido'
      });
    } catch (error) {
      console.error('Erro ao atribuir técnico:', error);
      res.status(500).json({ error: 'Erro ao atribuir técnico' });
    }
  },

  // Atualizar agendamento (status, datas de execução, check-in/check-out, etc)
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      console.log('=== ATUALIZAR AGENDAMENTO ===');
      console.log('ID:', id);
      console.log('Body recebido:', req.body);
      
      const {
        status,
        tecnico_id,
        data_hora,
        data_inicio_execucao,
        data_conclusao,
        data_final_montagem,
        observacoes,
        tempo_execucao,
        materiais_utilizados,
        checkin_latitude,
        checkin_longitude,
        checkin_endereco,
        checkout_latitude,
        checkout_longitude,
        checkout_endereco,
        loja_id,
        cliente_id,
        tipo_servico,
        descricao_servico
      } = req.body;

      const campos = [];
      const valores = [];

      if (status !== undefined) {
        campos.push('status = ?');
        valores.push(status);

        // Se está iniciando execução (mudando para em_andamento), fazer check-in
        if (status === 'em_andamento') {
          campos.push('data_inicio_execucao = NOW()');
          
          // Check-in obrigatório ao iniciar
          if (checkin_latitude && checkin_longitude) {
            campos.push('checkin_data = NOW()');
            campos.push('checkin_latitude = ?');
            valores.push(checkin_latitude);
            campos.push('checkin_longitude = ?');
            valores.push(checkin_longitude);
            
            if (checkin_endereco) {
              campos.push('checkin_endereco = ?');
              valores.push(checkin_endereco);
            }
          } else {
            return res.status(400).json({ 
              error: 'Check-in com localização é obrigatório ao iniciar a execução' 
            });
          }
        }

        // Se está concluindo, fazer checkout
        if (status === 'concluido') {
          campos.push('data_conclusao = NOW()');
          
          if (checkout_latitude && checkout_longitude) {
            campos.push('checkout_data = NOW()');
            campos.push('checkout_latitude = ?');
            valores.push(checkout_latitude);
            campos.push('checkout_longitude = ?');
            valores.push(checkout_longitude);
            
            if (checkout_endereco) {
              campos.push('checkout_endereco = ?');
              valores.push(checkout_endereco);
            }
          }
        }
      }

      if (data_inicio_execucao !== undefined) {
        campos.push('data_inicio_execucao = ?');
        valores.push(data_inicio_execucao);
      }
      if (data_conclusao !== undefined) {
        campos.push('data_conclusao = ?');
        valores.push(data_conclusao);
      }
      if (observacoes !== undefined) {
        campos.push('observacoes = ?');
        valores.push(observacoes);
      }
      if (tempo_execucao !== undefined) {
        campos.push('tempo_execucao = ?');
        valores.push(tempo_execucao);
      }
      if (materiais_utilizados !== undefined) {
        campos.push('materiais_utilizados = ?');
        valores.push(materiais_utilizados);
      }

      // Campos adicionais para edição de agendamento
      if (tecnico_id !== undefined) {
        campos.push('tecnico_id = ?');
        valores.push(tecnico_id || null);
      }
      if (data_hora !== undefined) {
        const formatarDataMySQL = (dataISO) => {
          if (!dataISO) return null;
          const data = new Date(dataISO);
          return data.toISOString().slice(0, 19).replace('T', ' ');
        };
        campos.push('data_hora = ?');
        valores.push(formatarDataMySQL(data_hora));
      }
      if (data_final_montagem !== undefined) {
        const formatarDataMySQL = (dataISO) => {
          if (!dataISO) return null;
          const data = new Date(dataISO);
          return data.toISOString().slice(0, 19).replace('T', ' ');
        };
        campos.push('data_final_montagem = ?');
        valores.push(formatarDataMySQL(data_final_montagem));
      }
      if (loja_id !== undefined) {
        campos.push('loja_id = ?');
        valores.push(loja_id);
      }
      if (cliente_id !== undefined) {
        campos.push('cliente_id = ?');
        valores.push(cliente_id);
      }
      if (tipo_servico !== undefined) {
        campos.push('tipo_servico = ?');
        valores.push(tipo_servico);
      }
      if (descricao_servico !== undefined) {
        campos.push('descricao_servico = ?');
        valores.push(descricao_servico);
      }

      if (campos.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      campos.push('updated_at = NOW()');
      valores.push(id);

      const query = `UPDATE agendamentos SET ${campos.join(', ')} WHERE id = ?`;

      console.log('Query UPDATE:', query);
      console.log('Valores:', valores);

      const [result] = await db.query(query, valores);

      console.log('Resultado UPDATE:', result);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json({
        message: 'Agendamento atualizado com sucesso',
        agendamento_id: id
      });
    } catch (error) {
      console.error('=== ERRO AO ATUALIZAR AGENDAMENTO ===');
      console.error('Erro:', error);
      res.status(500).json({ error: 'Erro ao atualizar agendamento' });
    }
  },

  // Deletar agendamento
  async deletar(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;
      const userTipo = req.user.tipo;

      // Buscar informações do agendamento antes de excluir
      const [agendamentos] = await db.query(`
        SELECT 
          a.*,
          l.nome as loja_nome,
          u.nome as cliente_nome,
          t.usuario_id as tecnico_usuario_id
        FROM agendamentos a
        LEFT JOIN lojas l ON a.loja_id = l.id
        LEFT JOIN usuarios u ON a.cliente_id = u.id
        LEFT JOIN tecnicos t ON a.tecnico_id = t.id
        WHERE a.id = ?
      `, [id]);

      if (agendamentos.length === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const agendamento = agendamentos[0];

      // Verificar permissões: Admin pode deletar qualquer um, cliente só pode deletar o seu próprio
      if (userTipo !== 'admin' && agendamento.cliente_id !== usuarioId) {
        return res.status(403).json({ error: 'Você não tem permissão para cancelar este agendamento' });
      }

      // Deletar o agendamento
      const [result] = await db.query(
        'DELETE FROM agendamentos WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Criar notificações para administradores
      const [admins] = await db.query(
        'SELECT id FROM usuarios WHERE tipo = "admin"'
      );

      const mensagemAdmin = `Solicitação cancelada: ${agendamento.tipo_servico} - Loja: ${agendamento.loja_nome} - Cliente: ${agendamento.cliente_nome}`;

      for (const admin of admins) {
        await db.query(
          'INSERT INTO notificacoes (usuario_id, mensagem, tipo) VALUES (?, ?, ?)',
          [admin.id, mensagemAdmin, 'cancelamento']
        );
      }

      // Criar notificação para o técnico se houver um atribuído
      if (agendamento.tecnico_usuario_id) {
        const mensagemTecnico = `Agendamento cancelado pelo cliente: ${agendamento.tipo_servico} - Loja: ${agendamento.loja_nome} - Data: ${new Date(agendamento.data_hora).toLocaleString('pt-BR')}`;
        
        await db.query(
          'INSERT INTO notificacoes (usuario_id, mensagem, tipo) VALUES (?, ?, ?)',
          [agendamento.tecnico_usuario_id, mensagemTecnico, 'cancelamento']
        );
      }

      res.json({ message: 'Agendamento cancelado com sucesso. Notificações enviadas.' });
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      res.status(500).json({ error: 'Erro ao deletar agendamento: ' + error.message });
    }
  },

  // Salvar checklist do agendamento
  async salvarChecklist(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items é obrigatório e deve ser um array' });
      }

      // Armazenar checklist como JSON
      const checklistJSON = JSON.stringify(items);

      const query = `
        UPDATE agendamentos 
        SET 
          observacoes = ?,
          status = 'checklist_preenchido'
        WHERE id = ?
      `;

      const [result] = await db.query(query, [checklistJSON, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json({
        message: 'Checklist salvo com sucesso',
        agendamentoId: id,
        itemsCount: items.length
      });
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      res.status(500).json({ error: 'Erro ao salvar checklist' });
    }
  }

};

module.exports = agendamentoController;
