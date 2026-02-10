const transporter = require('../config/emailConfig');

const emailService = {
  /**
   * Envia email com PDF do relatório
   * @param {string} destinatario - Email do destinatário
   * @param {Object} dados - Dados do relatório
   * @param {Buffer} pdfBuffer - PDF em buffer
   */
  async enviarRelatorioPDF(destinatario, dados, pdfBuffer) {
    try {
      const dataAgora = new Date().toLocaleString('pt-BR');
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'seu-email@gmail.com',
        to: destinatario,
        subject: `Relatório de Execução - ${dados.lojaNome} - ${new Date(dados.checkIn).toLocaleDateString('pt-BR')}`,
        html: `
          <h2>Relatório de Execução de Serviço</h2>
          <p><strong>Loja:</strong> ${dados.lojaNome || 'N/A'}</p>
          <p><strong>Tipo de Serviço:</strong> ${dados.tipoServico || 'N/A'}</p>
          <p><strong>Data do Serviço:</strong> ${new Date(dados.checkIn).toLocaleString('pt-BR')}</p>
          <p><strong>Duração:</strong> ${dados.duracao || 'N/A'}</p>
          
          <h3>Registros</h3>
          <p><strong>Check-in:</strong> ${new Date(dados.checkIn).toLocaleString('pt-BR')}</p>
          <p><strong>Check-out:</strong> ${new Date(dados.checkOut).toLocaleString('pt-BR')}</p>
          
          ${dados.relato ? `<h3>Descrição</h3><p>${dados.relato}</p>` : ''}
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Relatório gerado em: ${dataAgora}
          </p>
        `,
        attachments: [
          {
            filename: `relatorio-${new Date(dados.checkIn).getTime()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const resultado = await transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso:', resultado.messageId);
      return { sucesso: true, messageId: resultado.messageId };
    } catch (error) {
      console.error('Erro ao enviar email:', error.message);
      throw error;
    }
  }
};

module.exports = emailService;
