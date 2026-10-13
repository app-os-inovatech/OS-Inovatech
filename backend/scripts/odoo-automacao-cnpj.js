// Cria (ou atualiza) no Odoo a automação "Completar cadastro pelo CNPJ".
//
// Sem código dentro do Odoo: é uma regra de automação nativa que, ao salvar um
// contato com CNPJ novo ou alterado, envia um webhook para o backend
// (POST /api/odoo/webhooks/cnpj), que busca os dados e completa o cadastro.
//
// Uso:
//   node scripts/odoo-automacao-cnpj.js --url https://<backend>/api/odoo/webhooks/cnpj [--aplicar]
// O token vem de ODOO_WEBHOOK_TOKEN (o mesmo configurado no backend).
// Requer ODOO_URL, ODOO_DB e ODOO_API_KEY. No ambiente com proxy, rode com NODE_USE_ENV_PROXY=1.

try {
  require('dotenv').config();
} catch {}
const OdooClient = require('../src/integrations/odoo/odooClient');

const NOME = 'Completar cadastro pelo CNPJ';

async function main() {
  const argv = process.argv.slice(2);
  const aplicar = argv.includes('--aplicar');
  const url = argv[argv.indexOf('--url') + 1];
  const token = process.env.ODOO_WEBHOOK_TOKEN;
  if (!argv.includes('--url') || !/^https:\/\//.test(url || '')) throw new Error('Informe --url https://.../api/odoo/webhooks/cnpj');
  if (!token) throw new Error('Defina ODOO_WEBHOOK_TOKEN.');
  const webhookUrl = `${url}?token=${encodeURIComponent(token)}`;

  const odoo = new OdooClient();
  await odoo.login();
  console.log(aplicar ? 'Modo: APLICAR (gravando)' : 'Modo: SIMULAÇÃO (nada será gravado; use --aplicar)');

  const [modelo] = await odoo.searchRead('ir.model', [['model', '=', 'res.partner']], ['id'], {});
  const campos = await odoo.searchRead('ir.model.fields', [['model', '=', 'res.partner'], ['name', 'in', ['vat', 'name']]], ['id', 'name'], {});
  const vat = campos.find((c) => c.name === 'vat').id;

  const acao = {
    name: NOME,
    model_id: modelo.id,
    state: 'webhook',
    webhook_url: webhookUrl,
    webhook_field_ids: [[6, 0, campos.map((c) => c.id)]],
  };
  const regra = {
    name: NOME,
    model_id: modelo.id,
    trigger: 'on_create_or_write',
    trigger_field_ids: [[6, 0, [vat]]],
    filter_domain: "[('vat', '!=', False)]",
    active: true,
  };

  const [existente] = await odoo.searchRead('base.automation', [['name', '=', NOME]], ['id', 'action_server_ids'], {});
  if (!aplicar) {
    console.log(`${existente ? 'Atualizaria' : 'Criaria'} a automação "${NOME}": ao salvar um contato com CNPJ novo/alterado → webhook ${url}`);
    return;
  }
  if (existente) {
    await odoo.write('base.automation', [existente.id], regra);
    if (existente.action_server_ids.length) await odoo.write('ir.actions.server', existente.action_server_ids, acao);
    else await odoo.write('base.automation', [existente.id], { action_server_ids: [[0, 0, acao]] });
    console.log(`✔ automação atualizada (id ${existente.id})`);
  } else {
    const id = await odoo.create('base.automation', { ...regra, action_server_ids: [[0, 0, acao]] });
    console.log(`✔ automação criada (id ${id})`);
  }
}

main().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});
