// Boletos C6 (Bolepix: boleto + Pix QR Code opcional) a partir de faturas do Odoo.
//
// Comandos:
//   emitir   --fatura 146101 [--pix-chave <chave aleatória C6>] [--multa-pct 2] [--juros-mes-pct 1]
//            [--vencimento AAAA-MM-DD] [--empresa-id 1] [--aplicar]
//            Emite a cobrança no C6 pelo saldo em aberto da fatura, anexa o PDF à fatura
//            e registra linha digitável e Pix copia-e-cola no histórico da fatura.
//   status   [--empresa-id 1]
//            Consulta no C6 a situação dos boletos emitidos por este script.
//   cancelar --fatura 146101 [--empresa-id 1] [--aplicar]
//            Cancela (dá baixa) no boleto em aberto da fatura.
//
// Por padrão roda em simulação. Use --aplicar para emitir/cancelar de verdade.
// Requer as variáveis do Odoo e do C6 (ver src/integrations/*/). C6_CARTEIRA sobrescreve a carteira.

try {
  require('dotenv').config();
} catch {}
const OdooClient = require('../src/integrations/odoo/odooClient');
const C6Client = require('../src/integrations/c6/c6Client');

const PREFIXO_ANEXO = 'Boleto C6 ';

function lerArgs(argv) {
  const args = { comando: argv[0], aplicar: false, empresaId: 1 };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--aplicar') args.aplicar = true;
    else if (a === '--fatura') args.fatura = argv[++i];
    else if (a === '--pix-chave') args.pixChave = argv[++i];
    else if (a === '--multa-pct') args.multaPct = Number(argv[++i]);
    else if (a === '--juros-mes-pct') args.jurosMesPct = Number(argv[++i]);
    else if (a === '--vencimento') args.vencimento = argv[++i];
    else if (a === '--empresa-id') args.empresaId = Number(argv[++i]);
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  if (!['emitir', 'status', 'cancelar'].includes(args.comando)) {
    throw new Error('Use: emitir | status | cancelar (veja o cabeçalho do script).');
  }
  if (args.comando !== 'status' && !args.fatura) throw new Error('Informe --fatura com o número da fatura.');
  return args;
}

const hoje = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const digitos = (v) => String(v || '').replace(/\D/g, '');
const corta = (v, n) => String(v || '').trim().slice(0, n);
const reais = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function buscarFatura(odoo, args) {
  const faturas = await odoo.searchRead(
    'account.move',
    [['name', '=', args.fatura], ['move_type', '=', 'out_invoice'], ['company_id', '=', args.empresaId]],
    ['id', 'name', 'state', 'partner_id', 'amount_residual', 'invoice_date_due', 'payment_state']
  );
  if (faturas.length !== 1) throw new Error(`Fatura de cliente ${args.fatura} não encontrada na empresa ${args.empresaId}.`);
  return faturas[0];
}

async function boletosDaFatura(odoo, faturaId) {
  return odoo.searchRead(
    'ir.attachment',
    [['res_model', '=', 'account.move'], ['res_id', '=', faturaId], ['name', '=like', `${PREFIXO_ANEXO}%`]],
    ['id', 'name']
  );
}

const idDoAnexo = (nome) => (nome.match(/([A-Z0-9]{26})\.pdf$/) || [])[1];

// Monta o pedido de cobrança a partir da fatura e do cliente
function montarCobranca(fatura, cliente, args, carteira) {
  const faltando = [];
  const taxId = digitos(cliente.vat);
  if (![11, 14].includes(taxId.length)) faltando.push('CPF/CNPJ');
  const rua = cliente.street_name ? `${cliente.street_name}, ${cliente.street_number || 'S/N'}` : cliente.street;
  if (!rua) faltando.push('endereço');
  if (!cliente.street2) faltando.push('bairro (campo "Rua 2")');
  if (!cliente.city) faltando.push('cidade');
  if (!cliente.state_code) faltando.push('estado');
  if (digitos(cliente.zip).length !== 8) faltando.push('CEP');
  if (faltando.length) throw new Error(`Cadastro do cliente ${cliente.name} incompleto: ${faltando.join(', ')}.`);

  const vencimento = args.vencimento || fatura.invoice_date_due;
  if (!vencimento || vencimento < hoje()) {
    throw new Error(`Vencimento ${vencimento || '(vazio)'} já passou: informe --vencimento AAAA-MM-DD a partir de hoje.`);
  }

  const cobranca = {
    external_reference_id: C6Client.novoIdCobranca(),
    amount: Math.round(fatura.amount_residual * 100) / 100,
    due_date: vencimento,
    description: corta(`Fatura ${fatura.name}`, 100),
    payer: {
      name: corta(cliente.name, 40),
      tax_id: taxId,
      address: {
        address: corta(rua, 40),
        neighborhood: corta(cliente.street2, 40),
        city: corta(cliente.city, 40),
        state: cliente.state_code,
        zip_code: digitos(cliente.zip),
      },
    },
    payment_method: { bank_slip: { billing_scheme: carteira } },
    origin: 'ERP Odoo',
  };
  if (cliente.email) cobranca.payer.email = corta(cliente.email.split(/[;,]/)[0], 70);
  const numero = digitos(fatura.name);
  if (numero) cobranca.payment_method.bank_slip.your_number = numero.slice(-10);
  if (args.pixChave) cobranca.payment_method.pix = { key: args.pixChave, type: 'EVP' };
  if (args.multaPct || args.jurosMesPct) {
    cobranca.fees = {};
    if (args.multaPct) Object.assign(cobranca.fees, { fine_type: 'PERCENTAGE', fine_value: args.multaPct, fine_deadline: 1 });
    if (args.jurosMesPct) Object.assign(cobranca.fees, { interest_type: 'MONTHLY_PERCENTAGE', interest_value: args.jurosMesPct, interest_deadline: 1 });
  }
  return cobranca;
}

async function emitir(odoo, c6, args) {
  const fatura = await buscarFatura(odoo, args);
  if (fatura.state !== 'posted') throw new Error(`Fatura ${fatura.name} não está lançada (situação: ${fatura.state}).`);
  if (!(fatura.amount_residual > 0)) throw new Error(`Fatura ${fatura.name} não tem saldo em aberto.`);
  const existentes = await boletosDaFatura(odoo, fatura.id);
  if (existentes.length) {
    throw new Error(`Fatura ${fatura.name} já tem boleto C6 (${existentes.map((a) => a.name).join(', ')}). Cancele antes de emitir outro.`);
  }

  const [cliente] = await odoo.searchRead('res.partner', [['id', '=', fatura.partner_id[0]]],
    ['name', 'vat', 'email', 'street', 'street2', 'street_name', 'street_number', 'city', 'state_id', 'zip']);
  if (cliente.state_id) {
    const [uf] = await odoo.searchRead('res.country.state', [['id', '=', cliente.state_id[0]]], ['code']);
    cliente.state_code = uf && uf.code;
  }
  const cobranca = montarCobranca(fatura, cliente, args, process.env.C6_CARTEIRA || c6.carteira);

  console.log(`Fatura ${fatura.name} – ${cliente.name}`);
  console.log(`Valor ${reais(cobranca.amount)} | vencimento ${cobranca.due_date} | ${cobranca.payment_method.pix ? 'boleto + Pix' : 'só boleto'}`);
  if (!args.aplicar) {
    console.log('\n[simulação] cobrança que seria enviada ao C6:');
    console.log(JSON.stringify(cobranca, null, 2));
    console.log('\nNada foi emitido. Rode novamente com --aplicar.');
    return;
  }

  const r = await c6.emitirCobranca(cobranca);
  const boleto = (r.payment_method && r.payment_method.bank_slip) || {};
  const pix = (r.payment_method && r.payment_method.pix) || {};
  console.log(`✔ Cobrança emitida no C6: ${cobranca.external_reference_id}`);

  const pdf = await c6.pdfCobranca(cobranca.external_reference_id);
  await odoo.create('ir.attachment', {
    name: `${PREFIXO_ANEXO}${cobranca.external_reference_id}.pdf`,
    res_model: 'account.move',
    res_id: fatura.id,
    type: 'binary',
    mimetype: 'application/pdf',
    datas: pdf.toString('base64'),
  });
  const corpo = [
    `<p><b>Boleto C6 emitido</b> – ${reais(cobranca.amount)}, vencimento ${cobranca.due_date}</p>`,
    `<p>Linha digitável: ${boleto.digitable_line || '-'}<br/>Nosso número: ${boleto.our_number || '-'}<br/>Identificador C6: ${cobranca.external_reference_id}</p>`,
    pix.qr_code ? `<p>Pix copia e cola: ${pix.qr_code}</p>` : '',
  ].join('');
  await odoo.call('account.move', 'message_post', { ids: [fatura.id], body: corpo, message_type: 'comment', subtype_xmlid: 'mail.mt_note' });
  console.log(`✔ PDF anexado à fatura ${fatura.name} e linha digitável registrada no histórico`);
  if (boleto.digitable_line) console.log(`  Linha digitável: ${boleto.digitable_line}`);
}

async function status(odoo, c6, args) {
  const anexos = await odoo.searchRead(
    'ir.attachment',
    [['res_model', '=', 'account.move'], ['name', '=like', `${PREFIXO_ANEXO}%`], ['company_id', 'in', [args.empresaId, false]]],
    ['res_id', 'name']
  );
  if (!anexos.length) return console.log('Nenhum boleto C6 emitido por esta integração.');
  const faturas = await odoo.searchRead('account.move', [['id', 'in', anexos.map((a) => a.res_id)]], ['id', 'name', 'payment_state', 'amount_residual']);
  const porId = Object.fromEntries(faturas.map((f) => [f.id, f]));
  const rotulo = { CREATED: 'em aberto', PAID: 'PAGO', CANCELED: 'cancelado', WAITING_CONFIRMATION: 'aguardando confirmação' };
  for (const a of anexos) {
    const id = idDoAnexo(a.name);
    const f = porId[a.res_id];
    if (!id || !f) continue;
    try {
      const c = await c6.consultarCobranca(id);
      const aviso = c.status === 'PAID' && f.payment_state !== 'paid' ? '  ← pago no banco; concilie o extrato no Odoo' : '';
      console.log(`${f.name.padEnd(10)} ${reais(c.amount).padStart(14)}  venc. ${c.due_date}  ${rotulo[c.status] || c.status}${aviso}`);
    } catch (e) {
      console.log(`${f.name.padEnd(10)} erro ao consultar ${id}: ${e.message}`);
    }
  }
}

async function cancelar(odoo, c6, args) {
  const fatura = await buscarFatura(odoo, args);
  const anexos = await boletosDaFatura(odoo, fatura.id);
  if (!anexos.length) throw new Error(`Fatura ${fatura.name} não tem boleto C6 em aberto.`);
  for (const a of anexos) {
    const id = idDoAnexo(a.name);
    if (!args.aplicar) {
      console.log(`[simulação] cancelaria o boleto ${id} da fatura ${fatura.name}`);
      continue;
    }
    await c6.cancelarCobranca(id);
    await odoo.write('ir.attachment', [a.id], { name: `Boleto C6 CANCELADO ${id}.pdf` });
    await odoo.call('account.move', 'message_post', { ids: [fatura.id], body: `<p>Boleto C6 ${id} cancelado.</p>`, message_type: 'comment', subtype_xmlid: 'mail.mt_note' });
    console.log(`✔ Boleto ${id} cancelado`);
  }
  if (!args.aplicar) console.log('Nada foi cancelado. Rode novamente com --aplicar.');
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const odoo = new OdooClient();
  await odoo.login();
  odoo.context = { ...odoo.context, allowed_company_ids: [args.empresaId, ...odoo.context.allowed_company_ids.filter((c) => c !== args.empresaId)] };
  const c6 = new C6Client();
  console.log(args.aplicar ? 'Modo: APLICAR\n' : args.comando === 'status' ? '' : 'Modo: SIMULAÇÃO (use --aplicar)\n');
  await { emitir, status, cancelar }[args.comando](odoo, c6, args);
}

main().catch((err) => {
  console.error(`\nErro: ${err.message}`);
  process.exit(1);
});
