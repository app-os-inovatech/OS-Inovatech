const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const pdfService = {
  /**
   * Gera PDF do relatório com fotos
   * @param {Object} dados - Dados do relatório
   * @param {Array} fotos - Array com fotos em base64
   * @returns {Promise<Buffer>} - Buffer do PDF gerado
   */
  async gerarPDF(dados, fotos) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          bufferPages: true,
          margin: 50
        });

        let buffers = [];

        doc.on('data', (data) => {
          buffers.push(data);
        });

        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Título
        doc.fontSize(20).font('Helvetica-Bold').text('RELATÓRIO DE EXECUÇÃO', { align: 'center' });
        doc.moveDown();

        // Informações do serviço
        doc.fontSize(12).font('Helvetica-Bold').text('Informações da Ordem de Serviço', { underline: true });
        doc.fontSize(10).font('Helvetica');
        
        doc.text(`Loja: ${dados.lojaNome || 'N/A'}`);
        doc.text(`Tipo de Serviço: ${dados.tipoServico || 'N/A'}`);
        doc.text(`Data Agendamento: ${new Date(dados.dataAgendamento).toLocaleString('pt-BR')}`);
        doc.moveDown();

        // Check-in e Check-out
        doc.fontSize(12).font('Helvetica-Bold').text('Registros de Entrada/Saída', { underline: true });
        doc.fontSize(10).font('Helvetica');
        
        doc.text(`Check-in: ${new Date(dados.checkIn).toLocaleString('pt-BR')}`);
        doc.text(`Latitude: ${dados.checkInLatitude || 'N/A'}`);
        doc.text(`Longitude: ${dados.checkInLongitude || 'N/A'}`);
        doc.moveDown();

        doc.text(`Check-out: ${new Date(dados.checkOut).toLocaleString('pt-BR')}`);
        doc.text(`Latitude: ${dados.checkOutLatitude || 'N/A'}`);
        doc.text(`Longitude: ${dados.checkOutLongitude || 'N/A'}`);
        doc.moveDown();

        // Relato de execução
        if (dados.relato) {
          doc.fontSize(12).font('Helvetica-Bold').text('Descrição da Execução', { underline: true });
          doc.fontSize(10).font('Helvetica');
          doc.text(dados.relato, { align: 'left' });
          doc.moveDown();
        }

        // Fotos
        if (fotos && fotos.length > 0) {
          doc.addPage();
          doc.fontSize(12).font('Helvetica-Bold').text('Fotos da Execução', { underline: true });
          doc.moveDown();

          const fotosPorPagina = 2;
          let fotoAtual = 0;

          fotos.forEach((foto, index) => {
            try {
              // Converter base64 para buffer se necessário
              let fotoBuffer;
              if (typeof foto === 'string' && foto.startsWith('data:image')) {
                const base64Data = foto.split(',')[1];
                fotoBuffer = Buffer.from(base64Data, 'base64');
              } else if (typeof foto === 'string') {
                fotoBuffer = Buffer.from(foto, 'base64');
              } else {
                fotoBuffer = foto;
              }

              // Adicionar nova página a cada 2 fotos
              if (fotoAtual > 0 && fotoAtual % fotosPorPagina === 0) {
                doc.addPage();
              }

              // Adicionar foto
              doc.text(`Foto ${index + 1}`, { fontSize: 10 });
              doc.image(fotoBuffer, { width: 400, align: 'center' });
              doc.moveDown();

              fotoAtual++;
            } catch (err) {
              console.error(`Erro ao processar foto ${index + 1}:`, err.message);
              doc.text(`[Erro ao processar foto ${index + 1}]`);
              doc.moveDown();
            }
          });
        }

        // Rodapé com data de geração
        doc.fontSize(8).text(
          `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`,
          { align: 'center', color: '#999' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = pdfService;
