// Webhooks chamados pelas automações do Odoo.
//
// POST /api/odoo/webhooks/cnpj?token=<ODOO_WEBHOOK_TOKEN>
//   Disparado pela automação "Completar cadastro pelo CNPJ" (res.partner, ao salvar o CNPJ).
//   O Odoo envia {"_model": "res.partner", "_id": <id>, ...}. Respondemos na hora e
//   completamos o cadastro em segundo plano.

const express = require('express');
const crypto = require('crypto');
const { CnpjCadastro } = require('../services/cnpjCadastro');

const router = express.Router();
const emAndamento = new Map(); // id → horário, evita processar o mesmo contato duas vezes seguidas

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

module.exports = router;
