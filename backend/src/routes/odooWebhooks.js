// Webhooks chamados pelas automações do Odoo.
//
// POST /api/odoo/webhooks/cnpj?token=<ODOO_WEBHOOK_TOKEN>
//   Disparado pela automação "Completar cadastro pelo CNPJ" (res.partner, ao salvar o CNPJ).
//   O Odoo envia {"_model": "res.partner", "_id": <id>, ...}. Respondemos na hora e
//   completamos o cadastro em segundo plano.
//
// POST /api/odoo/webhooks/santander?token=<ODOO_WEBHOOK_TOKEN>
//   Disparado pelas automações "Santander – rodar pagamentos" (fatura marcada para Pix/boleto
//   Santander ou pagamento confirmado). Só aperta o botão da rotina "Santander — boletos" no
//   GitHub (repositório automacoes-odoo); quem fala com o banco continua sendo o GitHub.
//   Requer GITHUB_DISPATCH_TOKEN (token com permissão só de Actions nesse repositório).

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { CnpjCadastro } = require('../services/cnpjCadastro');

const router = express.Router();
const emAndamento = new Map(); // id → horário, evita processar o mesmo contato duas vezes seguidas

const WORKFLOW_SANTANDER = 'https://api.github.com/repos/app-os-inovatech/automacoes-odoo/actions/workflows/santander-boletos.yml/dispatches';
const INTERVALO_SANTANDER = 20000; // vários avisos em sequência viram um disparo só
let ultimoDisparo = 0;
let disparoAgendado = null;

async function dispararSantander() {
  ultimoDisparo = Date.now();
  await axios.post(WORKFLOW_SANTANDER, { ref: 'main' }, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 15000,
  });
  console.log('Santander webhook: rotina disparada no GitHub');
}

function tokenOk(recebido) {
  const esperado = process.env.ODOO_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(String(recebido));
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post('/cnpj', (req, res) => {
  if (!tokenOk(req.query.token || req.get('x-webhook-token'))) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  const id = Number(req.body && (req.body._id || req.body.id));
  if (!id || (req.body._model && req.body._model !== 'res.partner')) {
    return res.status(400).json({ error: 'Esperado _model res.partner e _id' });
  }
  res.status(202).json({ ok: true, id });

  const ultimo = emAndamento.get(id);
  if (ultimo && Date.now() - ultimo < 30000) return;
  emAndamento.set(id, Date.now());
  new CnpjCadastro()
    .completar(id)
    .then((r) => console.log('CNPJ webhook:', JSON.stringify(r)))
    .catch((e) => console.error(`CNPJ webhook (contato ${id}):`, e.message))
    .finally(() => setTimeout(() => emAndamento.delete(id), 30000));
});

router.post('/santander', (req, res) => {
  if (!tokenOk(req.query.token || req.get('x-webhook-token'))) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (!process.env.GITHUB_DISPATCH_TOKEN) {
    return res.status(503).json({ error: 'GITHUB_DISPATCH_TOKEN não configurado' });
  }
  res.status(202).json({ ok: true });

  if (disparoAgendado) return;
  const espera = Math.max(0, ultimoDisparo + INTERVALO_SANTANDER - Date.now());
  disparoAgendado = setTimeout(() => {
    disparoAgendado = null;
    dispararSantander().catch((e) =>
      console.error('Santander webhook:', e.response ? `GitHub ${e.response.status}` : e.message));
  }, espera);
});

module.exports = router;
