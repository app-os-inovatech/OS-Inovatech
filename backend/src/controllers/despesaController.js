const db = require('../config/database');
const despesaFolderService = require('../services/despesaFolderService');

// Criar despesa
const createDespesa = async (req, res) => {
  try {
    const { categoria, descricao, valor, lojaId, lojaNome, arquivo, fotos = [] } = req.body;
    const userId = req.user.id;
    
    if (!categoria || !valor || !lojaId) {
      return res.status(400).json({ error: 'Categoria, valor e loja são obrigatórios' });
    }

    if (!arquivo || !arquivo.dataUrl) {
      return res.status(400).json({ error: 'Comprovante (foto) é obrigatório' });
    }

    const query = `
      INSERT INTO despesas 
      (usuario_id, categoria, descricao, valor, loja_id, loja_nome, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_data_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(query, [
      userId,
      categoria,
      descricao || '',
      Number(valor),
      lojaId,
      lojaNome || null,
      arquivo?.nome || null,
      arquivo?.tipo || null,
      arquivo?.tamanho || null,
      arquivo?.dataUrl || null
    ]);

    const despesaId = result.insertId;

    // Buscar dados do técnico
    const [usuario] = await db.query('SELECT nome FROM usuarios WHERE id = ?', [userId]);
    const tecnicoNome = usuario?.[0]?.nome || 'Tecnico';

    // Preparar dados para criar pasta
    const despesaData = {
      id: despesaId,
      tecnico_nome: tecnicoNome,
      loja_nome: lojaNome,
      categoria: categoria,
      descricao: descricao,
      valor: valor,
      data_criacao: new Date().toISOString(),
      status: 'Pendente',
      arquivo_nome: arquivo?.nome
    };

    // Montar array de fotos (comprovante + fotos adicionais)
    const todasFotos = [arquivo.dataUrl];
    if (fotos && Array.isArray(fotos)) {
      todasFotos.push(...fotos);
    }

    // Criar pasta com fotos e planilha (async, não bloqueia a resposta)
    try {
      await despesaFolderService.criarPastaDespesa(despesaData, todasFotos);
    } catch (folderError) {
      console.error('Erro ao criar pasta de despesa:', folderError.message);
      // Não interrompe a criação da despesa se houver erro na pasta
    }

    res.status(201).json({
      id: despesaId,
      message: 'Despesa criada com sucesso',
      pastaGerada: true
    });
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
};

// Listar despesas (técnico vê apenas as suas, admin vê todas)
const listDespesas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.tipo;

    let query = `
      SELECT d.*, u.nome as tecnico_nome, u.email as tecnico_email, l.nome as loja_nome_completo
      FROM despesas d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN lojas l ON d.loja_id = l.id
    `;

    let params = [];
    
    // Técnico vê apenas suas despesas
    if (userRole === 'tecnico') {
      query += ' WHERE d.usuario_id = ?';
      params.push(userId);
    }
    // Admin vê todas as despesas

    query += ' ORDER BY d.created_at DESC';

    const [despesas] = await db.query(query, params);

    // Formatar resposta
    const formatted = despesas.map(d => ({
      id: d.id,
      usuarioId: d.usuario_id,
      tecnicoNome: d.tecnico_nome,
      tecnicoEmail: d.tecnico_email,
      categoria: d.categoria,
      descricao: d.descricao,
      valor: Number(d.valor),
      lojaId: d.loja_id,
      lojaNome: d.loja_nome_completo || d.loja_nome,
      arquivo: d.arquivo_nome ? {
        nome: d.arquivo_nome,
        tipo: d.arquivo_tipo,
        tamanho: d.arquivo_tamanho,
        dataUrl: d.arquivo_data_url
      } : null,
      criadoEm: d.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
};

// Deletar despesa
const deleteDespesa = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.tipo;

    // Verificar se a despesa existe e pertence ao usuário (se não for admin)
    let checkQuery = 'SELECT * FROM despesas WHERE id = ?';
    let checkParams = [id];

    if (userRole === 'tecnico') {
      checkQuery += ' AND usuario_id = ?';
      checkParams.push(userId);
    }

    const [despesas] = await db.query(checkQuery, checkParams);

    if (despesas.length === 0) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    await db.query('DELETE FROM despesas WHERE id = ?', [id]);

    res.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: 'Erro ao deletar despesa' });
  }
};

// Gerar relatório em Excel (apenas admin)
const gerarRelatorioExcel = async (req, res) => {
  try {
    const userRole = (req.user.tipo || '').toLowerCase();

    // Permitir variações de admin
    if (!['admin', 'administrador', 'adm'].includes(userRole)) {
      return res.status(403).json({ error: 'Apenas administradores podem gerar relatórios' });
    }

    const query = `
      SELECT 
        d.*,
        u.nome as tecnico_nome,
        u.email as tecnico_email,
        l.nome as loja_nome_completo
      FROM despesas d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN lojas l ON d.loja_id = l.id
      ORDER BY d.created_at DESC
    `;

    const [despesas] = await db.query(query);

    // Gerar Excel
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Despesas');

    // Configurar colunas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Data', key: 'created_at', width: 18 },
      { header: 'Técnico', key: 'tecnico_nome', width: 20 },
      { header: 'Email', key: 'tecnico_email', width: 25 },
      { header: 'Loja', key: 'loja_nome_completo', width: 20 },
      { header: 'Categoria', key: 'categoria', width: 15 },
      { header: 'Descrição', key: 'descricao', width: 30 },
      { header: 'Valor (R$)', key: 'valor', width: 15 },
      { header: 'Comprovante', key: 'arquivo_nome', width: 20 }
    ];

    // Estilo de cabeçalho
    worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

    // Adicionar dados
    let totalDespesas = 0;
    despesas.forEach(despesa => {
      const valor = parseFloat(despesa.valor || 0);
      totalDespesas += valor;

      worksheet.addRow({
        id: despesa.id,
        created_at: new Date(despesa.created_at).toLocaleString('pt-BR'),
        tecnico_nome: despesa.tecnico_nome || 'N/A',
        tecnico_email: despesa.tecnico_email || 'N/A',
        loja_nome_completo: despesa.loja_nome_completo || despesa.loja_nome || 'N/A',
        categoria: despesa.categoria,
        descricao: despesa.descricao || 'N/A',
        valor: valor.toFixed(2),
        arquivo_nome: despesa.arquivo_nome || 'N/A'
      });
    });

    // Adicionar linha em branco
    worksheet.addRow({});

    // Adicionar total
    const ultimaLinha = worksheet.lastRow.number + 1;
    worksheet.getCell(`A${ultimaLinha}`).value = 'TOTAL';
    worksheet.getCell(`H${ultimaLinha}`).value = totalDespesas.toFixed(2);

    // Estilo do total
    worksheet.getCell(`A${ultimaLinha}`).font = { bold: true, size: 12 };
    worksheet.getCell(`H${ultimaLinha}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${ultimaLinha}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    worksheet.getCell(`H${ultimaLinha}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

    // Formatar coluna de valores
    for (let i = 2; i <= worksheet.lastRow.number; i++) {
      const cell = worksheet.getCell(`H${i}`);
      cell.numFmt = '"R$ "#,##0.00;-"R$ "#,##0.00';
      cell.alignment = { horizontal: 'right' };
    }

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar arquivo
    const dataAtual = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Despesas_${dataAtual}.xlsx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de despesas' });
  }
};

module.exports = {
  createDespesa,
  listDespesas,
  deleteDespesa,
  gerarRelatorioExcel
};
