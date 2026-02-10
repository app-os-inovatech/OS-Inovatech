const db = require('../config/database');

const checklistEntradaObraController = {
  // Criar novo checklist
  async criar(req, res) {
    try {
      console.log('📋 [CHECKLIST] Recebendo nova checklist');
      console.log('📦 Payload:', req.body);
      console.log('👤 Usuário ID:', req.user?.id);
      
      const {
        agendamento_id,
        loja_nome,
        tipo_checklist = 'Kit de Montagem',
        itens,
        observacoes
      } = req.body;

      if (!agendamento_id) {
        console.warn('⚠️ [CHECKLIST] agendamento_id não fornecido');
        return res.status(400).json({ message: 'agendamento_id é obrigatório' });
      }

      const query = `
        INSERT INTO checklist_entrada_obra (
          agendamento_id, 
          loja_nome, 
          tipo_checklist,
          itens_json,
          observacoes,
          criado_por
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        agendamento_id, 
        loja_nome, 
        tipo_checklist,
        itens,
        observacoes,
        req.user.id
      ]);

      console.log('✅ [CHECKLIST] Checklist criado com sucesso. ID:', result.insertId);

      res.status(201).json({
        message: `Checklist ${tipo_checklist} criado com sucesso`,
        id: result.insertId,
        tipo: tipo_checklist
      });
    } catch (error) {
      console.error('❌ [CHECKLIST] Erro ao criar checklist:', error);
      res.status(500).json({ message: 'Erro ao criar checklist de entrada de obra', error: error.message });
    }
  },

  // Listar todos os checklists
  async listar(req, res) {
    try {
      const { agendamento_id } = req.query;
      
      let query = `
        SELECT 
          c.*,
          a.tipo_servico,
          l.nome as loja_agendamento,
          u.nome as criador_nome
        FROM checklist_entrada_obra c
        LEFT JOIN agendamentos a ON c.agendamento_id = a.id
        LEFT JOIN lojas l ON a.loja_id = l.id
        LEFT JOIN usuarios u ON c.criado_por = u.id
      `;
      
      const params = [];
      
      if (agendamento_id) {
        query += ' WHERE c.agendamento_id = ?';
        params.push(agendamento_id);
      }
      
      query += ' ORDER BY c.created_at DESC';
      
      const [checklists] = await db.query(query, params);
      res.json(checklists);
    } catch (error) {
      console.error('Erro ao listar checklists:', error);
      res.status(500).json({ message: 'Erro ao listar checklists' });
    }
  },

  // Buscar checklist por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          c.*,
          a.tipo_servico,
          l.nome as loja_agendamento,
          u.nome as criador_nome
        FROM checklist_entrada_obra c
        LEFT JOIN agendamentos a ON c.agendamento_id = a.id
        LEFT JOIN lojas l ON a.loja_id = l.id
        LEFT JOIN usuarios u ON c.criado_por = u.id
        WHERE c.id = ?
      `;
      
      const [checklists] = await db.query(query, [id]);
      
      if (checklists.length === 0) {
        return res.status(404).json({ message: 'Checklist não encontrado' });
      }
      
      res.json(checklists[0]);
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
      res.status(500).json({ message: 'Erro ao buscar checklist' });
    }
  },

  // Atualizar checklist
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        loja_nome,
        cidade,
        gerenciador,
        data_checklist,
        civil_1_equipamentos,
        civil_2_piso_forro,
        civil_3_agua,
        civil_4_eletrica,
        civil_5_gas,
        exaustao_6_sistema,
        exaustao_7_coifa,
        exaustao_8_intertravamento,
        drive_9_base_sensores,
        drive_10_fiacao,
        drive_11_totem,
        drive_12_tomadas,
        pendencias
      } = req.body;

      const query = `
        UPDATE checklist_entrada_obra SET
          loja_nome = ?, cidade = ?, gerenciador = ?, data_checklist = ?,
          civil_1_equipamentos = ?, civil_2_piso_forro = ?, civil_3_agua = ?, 
          civil_4_eletrica = ?, civil_5_gas = ?,
          exaustao_6_sistema = ?, exaustao_7_coifa = ?, exaustao_8_intertravamento = ?,
          drive_9_base_sensores = ?, drive_10_fiacao = ?, drive_11_totem = ?, 
          drive_12_tomadas = ?,
          pendencias = ?
        WHERE id = ?
      `;

      await db.query(query, [
        loja_nome, cidade, gerenciador, data_checklist,
        civil_1_equipamentos, civil_2_piso_forro, civil_3_agua, civil_4_eletrica, civil_5_gas,
        exaustao_6_sistema, exaustao_7_coifa, exaustao_8_intertravamento,
        drive_9_base_sensores, drive_10_fiacao, drive_11_totem, drive_12_tomadas,
        pendencias, id
      ]);

      res.json({ message: 'Checklist atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      res.status(500).json({ message: 'Erro ao atualizar checklist' });
    }
  },

  // Deletar checklist
  async deletar(req, res) {
    try {
      const { id } = req.params;
      
      await db.query('DELETE FROM checklist_entrada_obra WHERE id = ?', [id]);
      
      res.json({ message: 'Checklist deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar checklist:', error);
      res.status(500).json({ message: 'Erro ao deletar checklist' });
    }
  }
};

module.exports = checklistEntradaObraController;
