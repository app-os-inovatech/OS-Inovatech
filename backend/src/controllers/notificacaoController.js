const nodemailer = require('nodemailer');

const DEFAULT_RECIPIENTS = [
  'anderson@grupoinovasp.com.br',
  'cecilia@grupoinovasp.com.br'
];

function buildTransporter() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message = `Configuração SMTP ausente: ${missing.join(', ')}`;
    const error = new Error(message);
    error.status = 500;
    throw error;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function buildChecklistTable(checklistDetalhado = []) {
  if (!Array.isArray(checklistDetalhado) || checklistDetalhado.length === 0) {
    return '<p>Checklist não informado.</p>';
  }

  const rows = checklistDetalhado
    .map((item) => {
      const status = item.status === true || item.status === 'Sim' ? 'Sim' : 'Não';
      return `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e0e0e0;">${item.secao || '-'}</td>
          <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:center;">${item.numero || '-'}</td>
          <td style="padding:6px 8px;border:1px solid #e0e0e0;">${item.descricao || '-'}</td>
          <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:center;">${status}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;">
      <thead>
        <tr style="background:#f7f7f7;">
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Seção</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:center;">#</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Item</th>
          <th style="padding:8px;border:1px solid #e0e0e0;text-align:center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

exports.enviarEmailAgendamento = async (req, res, next) => {
  try {
    const {
      dataAgendada,
      periodo,
      clienteNome,
      clienteEmail,
      lojaNome,
      descricao,
      checklistDetalhado = []
    } = req.body;

    if (!dataAgendada || !periodo || !clienteNome || !lojaNome) {
      return res.status(400).json({ error: 'Dados do agendamento incompletos' });
    }

    const transporter = buildTransporter();
    const destinatarios = (process.env.NOTIFY_AGENDAMENTO_TO || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const toList = destinatarios.length > 0 ? destinatarios : DEFAULT_RECIPIENTS;

    const htmlChecklist = buildChecklistTable(checklistDetalhado);
    const descricaoLimpa = descricao || 'Sem observações adicionais';
    const subject = `Novo agendamento - ${lojaNome} - ${dataAgendada}`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: toList,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
          <h2 style="margin:0 0 12px 0;">Novo agendamento confirmado</h2>
          <p style="margin:0 0 8px 0;"><strong>Data:</strong> ${dataAgendada}</p>
          <p style="margin:0 0 8px 0;"><strong>Período:</strong> ${periodo}</p>
          <p style="margin:0 0 8px 0;"><strong>Loja:</strong> ${lojaNome}</p>
          <p style="margin:0 0 8px 0;"><strong>Cliente:</strong> ${clienteNome}</p>
          ${clienteEmail ? `<p style="margin:0 0 8px 0;"><strong>Email do cliente:</strong> ${clienteEmail}</p>` : ''}
          <p style="margin:0 0 8px 0;"><strong>Observações:</strong> ${descricaoLimpa}</p>
          <div style="margin:16px 0 8px 0;font-weight:bold;">Checklist confirmado</div>
          ${htmlChecklist}
        </div>
      `
    });

    return res.json({ success: true, destinatarios: toList });
  } catch (error) {
    console.error('Erro ao enviar email de agendamento:', error.message);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Falha ao enviar email do agendamento' });
  }
};
