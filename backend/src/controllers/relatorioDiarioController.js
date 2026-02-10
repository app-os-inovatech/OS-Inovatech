const db = require('../config/database');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

const relatorioDiarioController = {
  // Criar novo relatório diário com fotos
  async criar(req, res) {
    try {
      const { 
        agendamento_id, 
        loja_id, 
        check_in, 
        check_out, 
        relato_execucao, 
        fotos, 
        loja_nome, 
        tipo_servico, 
        checkout_latitude, 
        checkout_longitude, 
        checkin_latitude, 
        checkin_longitude,
        // Novos campos de fotos
        foto_phu,
        foto_numero_serie_phu,
        foto_temperatura_phu,
        foto_microondas,
        foto_numero_serie_microondas,
        foto_cuba_1_fritadeira,
        foto_numero_serie_cuba_1_fritadeira,
        foto_cuba_2_fritadeira,
        foto_numero_serie_cuba_2_fritadeira,
        foto_cuba_3_fritadeira,
        foto_numero_serie_cuba_3_fritadeira,
        foto_broiler,
        foto_temperatura_broiler,
        foto_pressao_alta_broiler,
        foto_pressao_baixa_broiler,
        foto_numero_serie_broiler
      } = req.body;
      const usuarioId = req.user.id;

      // Buscar o técnico_id do usuário logado
      const [tecnico] = await db.query(
        'SELECT id FROM tecnicos WHERE usuario_id = ?',
        [usuarioId]
      );

      if (!tecnico || tecnico.length === 0) {
        return res.status(403).json({ error: 'Usuário não é um técnico' });
      }

      const tecnicoId = tecnico[0].id;

      // Validações
      if (!agendamento_id || !loja_id || !check_in || !check_out || !relato_execucao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      // Validar que todas as fotos obrigatórias foram enviadas
      const fotosObrigatorias = [
        foto_phu,
        foto_numero_serie_phu,
        foto_temperatura_phu,
        foto_microondas,
        foto_numero_serie_microondas,
        foto_cuba_1_fritadeira,
        foto_numero_serie_cuba_1_fritadeira,
        foto_cuba_2_fritadeira,
        foto_numero_serie_cuba_2_fritadeira,
        foto_cuba_3_fritadeira,
        foto_numero_serie_cuba_3_fritadeira,
        foto_broiler,
        foto_temperatura_broiler,
        foto_pressao_alta_broiler,
        foto_pressao_baixa_broiler,
        foto_numero_serie_broiler
      ];

      const fotosFaltando = fotosObrigatorias.some(foto => !foto);
      if (fotosFaltando) {
        return res.status(400).json({ error: 'Todas as fotos dos equipamentos são obrigatórias' });
      }

      // Criar relatório
      const query = `
        INSERT INTO relatorios_diarios 
        (agendamento_id, tecnico_id, loja_id, check_in, check_out, relato_execucao, fotos, foto_phu, foto_numero_serie_phu, foto_temperatura_phu, foto_microondas, foto_numero_serie_microondas, foto_cuba_1_fritadeira, foto_numero_serie_cuba_1_fritadeira, foto_cuba_2_fritadeira, foto_numero_serie_cuba_2_fritadeira, foto_cuba_3_fritadeira, foto_numero_serie_cuba_3_fritadeira, foto_broiler, foto_temperatura_broiler, foto_pressao_alta_broiler, foto_pressao_baixa_broiler, foto_numero_serie_broiler)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        agendamento_id,
        tecnicoId,
        loja_id,
        check_in,
        check_out,
        relato_execucao,
        JSON.stringify(fotos),
        foto_phu,
        foto_numero_serie_phu,
        foto_temperatura_phu,
        foto_microondas,
        foto_numero_serie_microondas,
        foto_cuba_1_fritadeira,
        foto_numero_serie_cuba_1_fritadeira,
        foto_cuba_2_fritadeira,
        foto_numero_serie_cuba_2_fritadeira,
        foto_cuba_3_fritadeira,
        foto_numero_serie_cuba_3_fritadeira,
        foto_broiler,
        foto_temperatura_broiler,
        foto_pressao_alta_broiler,
        foto_pressao_baixa_broiler,
        foto_numero_serie_broiler
      ]);

      // Buscar dados do usuário para enviar email
      const [usuario] = await db.query('SELECT email FROM usuarios WHERE id = ?', [usuarioId]);
      const emailTecnico = usuario?.[0]?.email;

      // Gerar PDF do relatório
      try {
        const dadosPDF = {
          lojaNome: loja_nome || 'N/A',
          tipoServico: tipo_servico || 'N/A',
          checkIn: check_in,
          checkOut: check_out,
          checkInLatitude: checkin_latitude,
          checkInLongitude: checkin_longitude,
          checkOutLatitude: checkout_latitude,
          checkOutLongitude: checkout_longitude,
          relato: relato_execucao,
          dataAgendamento: check_in
        };

        const pdfBuffer = await pdfService.gerarPDF(dadosPDF, fotos);

        // Enviar email com PDF
        if (emailTecnico) {
          await emailService.enviarRelatorioPDF(emailTecnico, dadosPDF, pdfBuffer);
        }
      } catch (pdfError) {
        console.error('Erro ao gerar/enviar PDF:', pdfError.message);
        // Não interrompe a criação do relatório se houver erro no PDF
      }

      res.status(201).json({
        message: 'Relatório criado com sucesso',
        id: result.insertId,
        emailEnviado: !!emailTecnico
      });

    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      res.status(500).json({ error: 'Erro ao criar relatório diário' });
    }
  },

  // Listar relatórios
  async listar(req, res) {
    try {
      const usuarioId = req.user.id;
      const tipoUsuario = req.user.tipo;

      let query = `
        SELECT 
          rd.*,
          t.usuario_id,
          u.nome as tecnico_nome,
          l.nome as loja_nome,
          l.endereco as loja_endereco,
          l.cidade as loja_cidade,
          l.estado as loja_estado,
          a.tipo_servico,
          a.data_hora as data_agendamento
        FROM relatorios_diarios rd
        INNER JOIN tecnicos t ON rd.tecnico_id = t.id
        INNER JOIN usuarios u ON t.usuario_id = u.id
        INNER JOIN lojas l ON rd.loja_id = l.id
        INNER JOIN agendamentos a ON rd.agendamento_id = a.id
      `;

      const params = [];

      // Se for técnico, mostrar apenas seus relatórios
      if (tipoUsuario === 'tecnico') {
        query += ' WHERE t.usuario_id = ?';
        params.push(usuarioId);
      }

      query += ' ORDER BY rd.created_at DESC';

      const [relatorios] = await db.query(query, params);

      // Parse JSON de fotos
      const relatoriosComFotos = relatorios.map(rel => ({
        ...rel,
        fotos: JSON.parse(rel.fotos)
      }));

      res.json(relatoriosComFotos);

    } catch (error) {
      console.error('Erro ao listar relatórios:', error);
      res.status(500).json({ error: 'Erro ao listar relatórios diários' });
    }
  },

  // Buscar relatório por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          rd.*,
          t.usuario_id,
          u.nome as tecnico_nome,
          u.email as tecnico_email,
          l.nome as loja_nome,
          l.endereco as loja_endereco,
          l.cidade as loja_cidade,
          l.estado as loja_estado,
          l.cep as loja_cep,
          a.tipo_servico,
          a.data_hora as data_agendamento
        FROM relatorios_diarios rd
        INNER JOIN tecnicos t ON rd.tecnico_id = t.id
        INNER JOIN usuarios u ON t.usuario_id = u.id
        INNER JOIN lojas l ON rd.loja_id = l.id
        INNER JOIN agendamentos a ON rd.agendamento_id = a.id
        WHERE rd.id = ?
      `;

      const [relatorios] = await db.query(query, [id]);

      if (relatorios.length === 0) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
      }

      const relatorio = {
        ...relatorios[0],
        fotos: JSON.parse(relatorios[0].fotos)
      };

      res.json(relatorio);

    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ error: 'Erro ao buscar relatório' });
    }
  },

  // Deletar relatório (apenas admin)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(
        'DELETE FROM relatorios_diarios WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
      }

      res.json({ message: 'Relatório deletado com sucesso' });

    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      res.status(500).json({ error: 'Erro ao deletar relatório' });
    }
  }
};

module.exports = relatorioDiarioController;
