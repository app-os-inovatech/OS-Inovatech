// Vincula uma fatura de fornecedor (NF-e já importada) a um pedido de compra.
//
// Para cada item da fatura encontra a linha do pedido (mesmo produto, senão
// descrição parecida, senão mesma posição), troca o produto pelo do pedido,
// usa os impostos e a conta do pedido, liga a linha (purchase_line_id), grava a
// origem e aprende o código do fornecedor para as próximas notas.
// Se a fatura estiver lançada, volta para rascunho, corrige e lança de novo.
//
// Uso:
//   node scripts/vincular-nf-pedido.js --fatura "NFe 1580" --pedido P00253 [--aplicar]
// (--fatura aceita o nome, o id ou o número da NF-e; padrão: simulação)
// Requer ODOO_URL, ODOO_DB e ODOO_API_KEY. No ambiente com proxy, rode com NODE_USE_ENV_PROXY=1.

try {
  require('dotenv').config();
} catch {}
const OdooClient = require('../src/integrations/odoo/odooClient');

const reais = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const palavras = (t) => new Set(String(t || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^A-Z0-9]+/).filter((w) => w.length > 2));
const parecido = (a, b) => {
  const A = palavras(a);
  const B = palavras(b);
  return [...A].filter((w) => B.has(w)).length / Math.max(1, Math.min(A.size, B.size));
};

function lerArgs(argv) {
  const a = { aplicar: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--aplicar') a.aplicar = true;
    else if (argv[i] === '--fatura') a.fatura = argv[++i];
    else if (argv[i] === '--pedido') a.pedido = argv[++i];
    else throw new Error(`Argumento desconhecido: ${argv[i]}`);
  }
  if (!a.fatura || !a.pedido) throw new Error('Informe --fatura e --pedido (ex.: --fatura "NFe 1580" --pedido P00253).');
  return a;
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const odoo = new OdooClient();
  await odoo.login();
  console.log(args.aplicar ? 'Modo: APLICAR (gravando)\n' : 'Modo: SIMULAÇÃO (nada será gravado; use --aplicar)\n');

  const campos = ['id', 'name', 'ref', 'state', 'move_type', 'partner_id', 'amount_total', 'company_id', 'invoice_origin', 'l10n_latam_document_number', 'invoice_payment_term_id', 'invoice_date_due'];
  const tipos = ['in_invoice', 'in_receipt'];
  let [fatura] = /^\d+$/.test(args.fatura) ? await odoo.searchRead('account.move', [['id', '=', Number(args.fatura)]], campos) : [];
  if (!fatura) {
    const achadas = await odoo.searchRead('account.move', [['move_type', 'in', tipos], '|', ['name', '=', args.fatura], ['ref', 'ilike', args.fatura]], campos, { limit: 2 });
    if (achadas.length > 1) throw new Error(`Mais de uma fatura encontrada para "${args.fatura}": ${achadas.map((f) => f.name).join(', ')}`);
    fatura = achadas[0];
  }
  if (!fatura) throw new Error(`Fatura "${args.fatura}" não encontrada.`);
  const [pedido] = await odoo.searchRead('purchase.order', [['name', '=', args.pedido]], ['id', 'name', 'partner_id', 'company_id', 'state', 'amount_total', 'order_line'], { limit: 1 });
  if (!pedido) throw new Error(`Pedido ${args.pedido} não encontrado.`);
  if (pedido.partner_id[0] !== fatura.partner_id[0]) throw new Error(`Fornecedores diferentes: fatura ${fatura.partner_id[1]} × pedido ${pedido.partner_id[1]}.`);
  if (pedido.company_id[0] !== fatura.company_id[0]) throw new Error('Fatura e pedido são de empresas diferentes.');

  const linhasFat = await odoo.searchRead('account.move.line', [['move_id', '=', fatura.id], ['display_type', '=', 'product']], ['id', 'name', 'product_id', 'quantity', 'price_unit', 'purchase_line_id']);
  const linhasPed = await odoo.call('purchase.order.line', 'read', {
    ids: pedido.order_line,
    fields: ['id', 'name', 'product_id', 'product_qty', 'qty_invoiced', 'price_unit', 'tax_ids', 'display_type'],
  });
  const ped = linhasPed.filter((l) => !l.display_type);

  console.log(`Fatura ${fatura.name} (${fatura.ref || '-'}) · ${fatura.move_type === 'in_receipt' ? 'RECIBO DE COMPRA' : 'fatura'} · ${fatura.state} · total ${reais(fatura.amount_total)}`);
  console.log(`Pedido ${pedido.name} · ${pedido.partner_id[1]} · total ${reais(pedido.amount_total)}\n`);

  const usadas = new Set();
  const plano = linhasFat.map((lf, i) => {
    const livres = ped.filter((l) => !usadas.has(l.id));
    let lp = lf.product_id && livres.find((l) => l.product_id && l.product_id[0] === lf.product_id[0]);
    let como = 'mesmo produto';
    if (!lp) {
      const c = livres.map((l) => ({ l, s: parecido(lf.name, l.name) })).filter((x) => x.s >= 0.5).sort((a, b) => b.s - a.s)[0];
      if (c) [lp, como] = [c.l, `descrição parecida (${Math.round(c.s * 100)}%)`];
    }
    if (!lp && linhasFat.length === ped.length && !usadas.has(ped[i].id)) [lp, como] = [ped[i], 'mesma posição'];
    if (lp) usadas.add(lp.id);
    return { lf, lp, como };
  });

  const avisos = [];
  for (const { lf, lp, como } of plano) {
    console.log(`• ${lf.name.replace(/\n/g, ' ').slice(0, 60)} | ${lf.quantity} × ${reais(lf.price_unit)}`);
    if (!lp) {
      console.log('    ✖ sem linha correspondente no pedido');
      avisos.push(`Item "${lf.name}" sem linha no pedido.`);
      continue;
    }
    console.log(`    → ${lp.name.replace(/\n/g, ' ').slice(0, 60)} | ${lp.product_qty} × ${reais(lp.price_unit)} (${como})`);
    if (lf.product_id && lp.product_id && lf.product_id[0] !== lp.product_id[0]) console.log(`    produto corrigido: ${lf.product_id[1]} → ${lp.product_id[1]}`);
    if (Math.abs(lf.price_unit - lp.price_unit) > 0.01) avisos.push(`Preço diferente em "${lp.name}": NF ${reais(lf.price_unit)} × pedido ${reais(lp.price_unit)}.`);
    if (lf.quantity > lp.product_qty - lp.qty_invoiced + 1e-6) avisos.push(`Quantidade em "${lp.name}" acima do saldo do pedido.`);
  }
  avisos.forEach((a) => console.log(`  ⚠ ${a}`));
  if (!args.aplicar) {
    console.log('\nNada foi gravado. Rode novamente com --aplicar.');
    return;
  }
  if (plano.some((x) => !x.lp)) throw new Error('Há itens sem linha no pedido; vincule manualmente.');

  const estavaLancada = fatura.state === 'posted';
  if (estavaLancada) await odoo.call('account.move', 'button_draft', { ids: [fatura.id] });
  if (fatura.move_type === 'in_receipt') {
    // trocar o tipo faz o Odoo renumerar o documento e recalcular vencimentos: preserva número e condição
    await odoo.write('account.move', [fatura.id], { move_type: 'in_invoice' });
    const manter = { l10n_latam_document_number: fatura.l10n_latam_document_number };
    if (fatura.invoice_payment_term_id) manter.invoice_payment_term_id = fatura.invoice_payment_term_id[0];
    else manter.invoice_date_due = fatura.invoice_date_due;
    await odoo.write('account.move', [fatura.id], manter);
  }

  const [{ partner_id: [parceiroId] }] = [fatura];
  for (const { lf, lp } of plano) {
    const vals = { purchase_line_id: lp.id, tax_ids: [[6, 0, lp.tax_ids]] };
    if (lp.product_id) vals.product_id = lp.product_id[0];
    await odoo.write('account.move.line', [lf.id], vals);
    // conta e descrição podem ter sido recalculadas ao trocar o produto: preserva a descrição da NF-e
    await odoo.write('account.move.line', [lf.id], { name: lf.name, quantity: lf.quantity, price_unit: lf.price_unit });
    // aprende o código do fornecedor (só quando o código veio no início da descrição "[cód] ...")
    const cod = (lf.name.match(/^\[([^\]]+)\]/) || [])[1];
    if (cod && lp.product_id) {
      const [variante] = await odoo.call('product.product', 'read', { ids: [lp.product_id[0]], fields: ['product_tmpl_id'] });
      const ja = await odoo.searchRead('product.supplierinfo', [['partner_id', '=', parceiroId], ['product_code', '=', cod]], ['id', 'product_tmpl_id']);
      if (ja.length) await odoo.write('product.supplierinfo', ja.map((x) => x.id), { product_tmpl_id: variante.product_tmpl_id[0], product_id: lp.product_id[0] });
      else await odoo.create('product.supplierinfo', { partner_id: parceiroId, product_tmpl_id: variante.product_tmpl_id[0], product_id: lp.product_id[0], product_code: cod, price: lp.price_unit });
    }
  }
  await odoo.write('account.move', [fatura.id], { invoice_origin: pedido.name });
  const [depois] = await odoo.searchRead('account.move', [['id', '=', fatura.id]], ['amount_total']);
  await odoo.call('account.move', 'message_post', {
    ids: [fatura.id],
    body: `<p>Vinculada ao pedido de compra <b>${pedido.name}</b>${fatura.move_type === 'in_receipt' ? ' (tipo corrigido de Recibo de compra para Fatura de fornecedor)' : ''}. Total: ${reais(fatura.amount_total)} → ${reais(depois.amount_total)}.</p>`,
    body_is_html: true,
    message_type: 'comment',
    subtype_xmlid: 'mail.mt_note',
  });
  if (estavaLancada) await odoo.call('account.move', 'action_post', { ids: [fatura.id] });
  const [pos] = await odoo.searchRead('purchase.order', [['id', '=', pedido.id]], ['invoice_status']);
  console.log(`\n✔ ${fatura.name} vinculada a ${pedido.name}. Total ${reais(depois.amount_total)} · status de faturamento do pedido: ${pos.invoice_status}${estavaLancada ? ' · relançada' : ''}`);
}

main().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});
