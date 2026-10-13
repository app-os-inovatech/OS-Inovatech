// Sincroniza o extrato e o saldo da conta C6 com um diário bancário do Odoo.
//
// - Busca os lançamentos no C6 (API Saldo & Extrato) e cria as linhas de extrato no diário.
// - Não duplica: cada linha leva o identificador do C6 em "unique_import_id".
// - Compara o saldo do C6 com o saldo do diário no Odoo.
// - Por padrão roda em simulação. Use --aplicar para gravar.
//
// Uso:
//   node scripts/c6-sincronizar-extrato.js [--diario C6] [--empresa-id 1] \
//     [--desde 2026-10-01] [--ate 2026-10-10] [--aplicar]
//
// Sem --desde, continua do dia seguinte à última linha do diário.
// Requer as variáveis do Odoo (ver src/integrations/odoo/odooClient.js)
// e do C6 (ver src/integrations/c6/c6Client.js).

try {
  require('dotenv').config();
} catch {}
const OdooClient = require('../src/integrations/odoo/odooClient');
const C6Client = require('../src/integrations/c6/c6Client');

function lerArgs(argv) {
  const args = { aplicar: false, diario: 'C6', empresaId: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--aplicar') args.aplicar = true;
    else if (a === '--diario') args.diario = argv[++i];
    else if (a === '--empresa-id') args.empresaId = Number(argv[++i]);
    else if (a === '--desde') args.desde = argv[++i];
    else if (a === '--ate') args.ate = argv[++i];
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  return args;
}

const hoje = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10); // horário de Brasília
const somaDias = (data, n) => new Date(new Date(`${data}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Converte um lançamento do C6 em linha de extrato do Odoo
function paraLinha(l, diarioId) {
  const id = l.reference || l.local_reference || l.end_to_end_id;
  const valor = Math.abs(Number(l.amount)) * (l.operation_type === 'OUTGOING' ? -1 : 1);
  const texto = [l.title, l.description].filter((t) => t && t.trim()).join(' – ');
  return {
    journal_id: diarioId,
    date: l.entry_date,
    amount: Math.round(valor * 100) / 100,
    payment_ref: texto || l.transaction_type,
    unique_import_id: `c6-${id}`,
    transaction_type: l.transaction_type,
    transaction_details: l,
  };
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const odoo = new OdooClient();
  await odoo.login();
  odoo.context = { ...odoo.context, allowed_company_ids: [args.empresaId, ...odoo.context.allowed_company_ids.filter((c) => c !== args.empresaId)] };
  const c6 = new C6Client();
  console.log(args.aplicar ? 'Modo: APLICAR (gravando)\n' : 'Modo: SIMULAÇÃO (nada será gravado; use --aplicar)\n');

  const [diario] = await odoo.searchRead('account.journal', [['code', '=', args.diario], ['company_id', '=', args.empresaId], ['type', '=', 'bank']], ['id', 'name']);
  if (!diario) throw new Error(`Diário bancário ${args.diario} não encontrado na empresa ${args.empresaId}.`);

  // Período: do dia seguinte à última linha do diário até hoje
  const [ultima] = await odoo.searchRead('account.bank.statement.line', [['journal_id', '=', diario.id]], ['date'], { order: 'date desc', limit: 1 });
  const desde = args.desde || (ultima ? somaDias(ultima.date, 1) : somaDias(hoje(), -30));
  const ate = args.ate || hoje();
  console.log(`Diário: ${diario.name} | período ${desde} a ${ate}`);

  const lancamentos = await c6.extrato(desde, ate);
  const linhas = lancamentos.map((l) => paraLinha(l, diario.id));

  // Não duplica o que já foi importado (por esta integração)
  const existentes = new Set(
    (await odoo.searchRead('account.bank.statement.line', [['journal_id', '=', diario.id], ['unique_import_id', 'in', linhas.map((l) => l.unique_import_id)]], ['unique_import_id']))
      .map((l) => l.unique_import_id)
  );
  const novas = linhas.filter((l) => !existentes.has(l.unique_import_id));

  const entradas = novas.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const saidas = novas.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0);
  console.log(`C6: ${lancamentos.length} lançamentos | já importados: ${existentes.size} | novos: ${novas.length}`);
  console.log(`Novos: entradas ${reais(entradas)} | saídas ${reais(saidas)}\n`);
  novas.slice(0, 15).forEach((l) => console.log(`  ${l.date}  ${reais(l.amount).padStart(14)}  ${l.payment_ref.slice(0, 70)}`));
  if (novas.length > 15) console.log(`  … e mais ${novas.length - 15}`);

  if (args.aplicar && novas.length) {
    const ids = await odoo.call('account.bank.statement.line', 'create', { vals_list: novas });
    console.log(`\n✔ ${ids.length} linhas criadas no diário ${diario.name}`);
  }

  // Conferência de saldo
  const saldoC6 = await c6.saldo();
  const todas = await odoo.searchRead('account.bank.statement.line', [['journal_id', '=', diario.id]], ['amount']);
  const saldoOdoo = todas.reduce((s, l) => s + l.amount, 0) + (args.aplicar ? 0 : novas.reduce((s, l) => s + l.amount, 0));
  const diferenca = Math.round((saldoC6.available - saldoOdoo) * 100) / 100;
  console.log(`\nSaldo C6 (${saldoC6.date}): ${reais(saldoC6.available)}${saldoC6.locked ? ` | bloqueado ${reais(saldoC6.locked)}` : ''}`);
  console.log(`Saldo no Odoo${args.aplicar ? '' : ' (após importar)'}: ${reais(saldoOdoo)}`);
  console.log(diferenca === 0 ? '✔ Saldos conferem' : `⚠ Diferença de ${reais(diferenca)}: confira lançamentos fora do período ou importados por OFX`);
  if (!args.aplicar) console.log('\nNada foi gravado. Rode novamente com --aplicar.');
}

main().catch((err) => {
  console.error(`\nErro: ${err.message}`);
  process.exit(1);
});
