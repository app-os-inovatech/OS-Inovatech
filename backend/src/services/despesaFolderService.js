const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const despesaFolderService = {
  /**
   * Cria pasta com fotos e planilha de despesa
   * @param {Object} despesaData - Dados da despesa
   * @param {Array} fotos - Array com fotos em base64 ou caminhos
   * @returns {Promise<string>} - Caminho da pasta criada
   */
  async criarPastaDespesa(despesaData, fotos = []) {
    try {
      // Caminho base para despesas
      const basePath = path.join(process.env.ADMIN_FOLDER || 'C:\\admin_despesas');
      
      // Criar pasta raiz se não existir
      if (!fs.existsSync(basePath)) {
        await mkdir(basePath, { recursive: true });
      }

      // Nome da pasta: YYYY-MM-DD_TecnicoNome_Loja
      const dataFormatada = new Date(despesaData.data_criacao || Date.now()).toISOString().split('T')[0];
      const nomePasta = `${dataFormatada}_${despesaData.tecnico_nome || 'Tecnico'}_${despesaData.loja_nome || 'Loja'}`.replace(/[/\\?*:|"<>]/g, '_');
      
      const pastaPath = path.join(basePath, nomePasta);
      
      // Criar pasta
      if (!fs.existsSync(pastaPath)) {
        await mkdir(pastaPath, { recursive: true });
      }

      // Criar subpasta para fotos
      const pastaFotos = path.join(pastaPath, 'fotos');
      if (!fs.existsSync(pastaFotos)) {
        await mkdir(pastaFotos, { recursive: true });
      }

      // Salvar fotos
      if (fotos && Array.isArray(fotos) && fotos.length > 0) {
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          try {
            let nomeArquivo = `foto_${i + 1}.jpg`;
            
            if (typeof foto === 'string') {
              if (foto.startsWith('data:image')) {
                // Base64 data URL
                const base64Data = foto.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const caminhoFoto = path.join(pastaFotos, nomeArquivo);
                await writeFile(caminhoFoto, buffer);
              } else {
                // Copiar arquivo existente
                nomeArquivo = path.basename(foto);
                const caminhoFoto = path.join(pastaFotos, nomeArquivo);
                if (fs.existsSync(foto)) {
                  fs.copyFileSync(foto, caminhoFoto);
                }
              }
            }
          } catch (fotoError) {
            console.error(`Erro ao salvar foto ${i + 1}:`, fotoError.message);
          }
        }
      }

      // Criar planilha Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Despesa');

      // Configurar colunas
      worksheet.columns = [
        { header: 'Campo', key: 'campo', width: 25 },
        { header: 'Valor', key: 'valor', width: 40 }
      ];

      // Estilo de cabeçalho
      worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

      // Adicionar dados
      const dados = [
        { campo: 'ID Despesa', valor: despesaData.id || 'N/A' },
        { campo: 'Técnico', valor: despesaData.tecnico_nome || 'N/A' },
        { campo: 'Loja', valor: despesaData.loja_nome || 'N/A' },
        { campo: 'Categoria', valor: despesaData.categoria || 'N/A' },
        { campo: 'Descrição', valor: despesaData.descricao || 'N/A' },
        { campo: 'Valor', valor: `R$ ${parseFloat(despesaData.valor || 0).toFixed(2)}` },
        { campo: 'Data da Despesa', valor: new Date(despesaData.data_criacao || Date.now()).toLocaleString('pt-BR') },
        { campo: 'Status', valor: despesaData.status || 'Pendente' },
        { campo: 'Comprovante', valor: despesaData.arquivo_nome || 'N/A' },
        { campo: 'Observações', valor: despesaData.observacoes || 'Nenhuma' }
      ];

      dados.forEach(linha => {
        worksheet.addRow(linha);
      });

      // Salvar planilha
      const caminhoExcel = path.join(pastaPath, 'despesa_detalhes.xlsx');
      await workbook.xlsx.writeFile(caminhoExcel);

      console.log(`Pasta de despesa criada: ${pastaPath}`);
      return pastaPath;

    } catch (error) {
      console.error('Erro ao criar pasta de despesa:', error.message);
      throw error;
    }
  },

  /**
   * Cria relatório consolidado de todas as despesas
   * @param {Array} despesas - Array com todas as despesas
   * @param {string} caminhoRelatorio - Caminho onde salvar o arquivo
   */
  async criarRelatorioDespesas(despesas, caminhoRelatorio) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Despesas');

      // Configurar colunas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Técnico', key: 'tecnico_nome', width: 20 },
        { header: 'Loja', key: 'loja_nome', width: 20 },
        { header: 'Categoria', key: 'categoria', width: 15 },
        { header: 'Descrição', key: 'descricao', width: 30 },
        { header: 'Valor', key: 'valor', width: 15 },
        { header: 'Data', key: 'data_criacao', width: 18 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      // Estilo de cabeçalho
      worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

      // Adicionar dados
      let totalDespesas = 0;
      despesas.forEach(despesa => {
        const valorNum = parseFloat(despesa.valor || 0);
        totalDespesas += valorNum;
        
        worksheet.addRow({
          id: despesa.id,
          tecnico_nome: despesa.tecnico_nome,
          loja_nome: despesa.loja_nome,
          categoria: despesa.categoria,
          descricao: despesa.descricao,
          valor: `R$ ${valorNum.toFixed(2)}`,
          data_criacao: new Date(despesa.data_criacao).toLocaleString('pt-BR'),
          status: despesa.status || 'Pendente'
        });
      });

      // Adicionar linha de total
      worksheet.addRow({});
      const ultimaLinha = worksheet.lastRow.number + 1;
      worksheet.getCell(`A${ultimaLinha}`).value = 'TOTAL';
      worksheet.getCell(`F${ultimaLinha}`).value = `R$ ${totalDespesas.toFixed(2)}`;
      worksheet.getCell(`A${ultimaLinha}`).font = { bold: true, size: 12 };
      worksheet.getCell(`F${ultimaLinha}`).font = { bold: true, size: 12 };

      await workbook.xlsx.writeFile(caminhoRelatorio);
      return caminhoRelatorio;

    } catch (error) {
      console.error('Erro ao criar relatório de despesas:', error.message);
      throw error;
    }
  }
};

module.exports = despesaFolderService;
