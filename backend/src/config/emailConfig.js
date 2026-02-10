const nodemailer = require('nodemailer');

// Configuração do serviço de email
const emailConfig = {
  // Usando Gmail com senha de app
  // Para usar Gmail: configure as variáveis de ambiente
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'seu-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'sua-senha-de-app'
  }
};

// Criar transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verificar conexão
transporter.verify((error, success) => {
  if (error) {
    console.log('Email service error:', error.message);
  } else {
    console.log('Email service ready');
  }
});

module.exports = transporter;
