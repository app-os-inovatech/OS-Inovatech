// Configura no Odoo a estrutura de custo de uma montagem de loja.
//
// Cria (ou reaproveita, se já existir):
//   1. Projeto "Montagem <Loja>" com Planilha de horas + conta analítica <CLIENTE-LOJA>
//   2. Custo/hora do técnico (mão de obra entra no custo da loja via timesheet)
//   3. Categorias de despesa (produtos "pode ser despesa")
//   4. Diário bancário "Cartão Flash" (depósitos = transferência interna, gastos = custo)
//   5. Local "Consumo Montagens" + tipo de operação "Consumo – Montagem" (saída de material)
//
// Por padrão roda em modo simulação (não grava nada). Use --aplicar para gravar.
//
// Uso:
//   node scripts/odoo-setup-montagem.js \
//     --codigo PLK-PARANGABA --loja "PLK Parangaba" --empresa-id 2 --cliente-id 13162 \
//     --armazem-id 4 --funcionario-id 44 --valor-mensal 5000 [--horas-mes 176] [--aplicar]
//
// --codigo         código da conta analítica da loja (CLIENTE-LOJA)
// --empresa-id     empresa do projeto, da conta analítica e do diário Flash
// --cliente-id     cliente (loja) do projeto; liga o "Faturável" para a receita aparecer
// --armazem-id     armazém de onde sai o material (a operação fica na empresa do armazém)
// --funcionario-id técnico que recebe o custo/hora (ou --tecnico "Nome" para buscar por nome)
// --etapas         etapas a executar, ex.: 1,2 (padrão: todas)
//
// Requer ODOO_URL, ODOO_DB e ODOO_API_KEY (ver src/integrations/odoo/odooClient.js).
// No ambiente com proxy, rode com NODE_USE_ENV_PROXY=1.

// .env é opcional: o script roda só com Node 18+, sem npm install
try {
  require('dotenv').config();
} catch {}
const OdooClient = require('../src/integrations/odoo/odooClient');

const CATEGORIAS_DESPESA = [
  { code: 'DSP-ALIM', name: 'Alimentação' },
  { code: 'DSP-HOSP', name: 'Hospedagem' },
  { code: 'DSP-PASS', name: 'Passagem' },
  { code: 'DSP-COMB', name: 'Combustível' },
  { code: 'DSP-PEDG', name: 'Pedágio' },
  { code: 'DSP-TRLC', name: 'Transporte local (Uber/táxi)' },
  { code: 'DSP-MATE', name: 'Material emergencial' },
  { code: 'DSP-IMPR', name: 'Imprevistos' },
];

function lerArgs(argv) {
  const args = { aplicar: false, horasMes: 176, etapas: [1, 2, 3, 4, 5] };
  const numeros = { '--empresa-id': 'empresaId', '--armazem-id': 'armazemId', '--funcionario-id': 'funcionarioId',
    '--cliente-id': 'clienteId', '--valor-mensal': 'valorMensal', '--horas-mes': 'horasMes' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--aplicar') args.aplicar = true;
    else if (a === '--codigo') args.codigo = argv[++i];
    else if (a === '--loja') args.loja = argv[++i];
    else if (a === '--tecnico') args.tecnico = argv[++i];
    else if (a === '--etapas') args.etapas = argv[++i].split(',').map(Number);
    else if (numeros[a]) args[numeros[a]] = Number(argv[++i]);
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  if (!args.codigo || !args.loja || !args.empresaId) {
    throw new Error('Informe --codigo, --loja e --empresa-id (ex.: --codigo PLK-PARANGABA --loja "PLK Parangaba" --empresa-id 2).');
  }
  if ((args.tecnico || args.funcionarioId) && !(args.valorMensal > 0 && args.horasMes > 0)) {
    throw new Error('Para o técnico informe --valor-mensal (e opcionalmente --horas-mes).');
  }
  return args;
}

const log = (msg) => console.log(msg);

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const odoo = new OdooClient();
  await odoo.login();
  const versao = await odoo.version();
  log(`Conectado ao Odoo ${versao.server_version} (${odoo.url}, banco ${odoo.db}, usuário id ${odoo.uid})`);
  log(args.aplicar ? 'Modo: APLICAR (gravando)\n' : 'Modo: SIMULAÇÃO (nada será gravado; use --aplicar)\n');

  const [empresa] = await odoo.searchRead('res.company', [['id', '=', args.empresaId]], ['id', 'name']);
  if (!empresa) throw new Error(`Empresa id ${args.empresaId} não encontrada.`);
  log(`Empresa: ${empresa.name}\n`);

  const pendencias = [];
  const etapa = (n) => args.etapas.includes(n);

  // Executa a criação apenas no modo --aplicar
  const criar = async (model, vals, descricao) => {
    if (!args.aplicar) {
      log(`  [simulação] criaria ${descricao}`);
      return null;
    }
    const id = await odoo.create(model, vals);
    log(`  ✔ criado ${descricao} (id ${id})`);
    return id;
  };

  // 1. Conta analítica + projeto ------------------------------------------------
  if (etapa(1)) {
  log('1. Conta analítica e projeto da loja');
  // Padrão: projeto "Montagem <Loja>" com conta analítica de código <CLIENTE-LOJA> (ex.: PLK-PARANGABA)
  const nomeProjeto = `Montagem ${args.loja}`;

  // A conta fica na empresa do projeto: o material sai do estoque dessa mesma empresa
  let [conta] = await odoo.searchRead('account.analytic.account', [['code', '=', args.codigo]], ['id', 'name']);
  if (conta) {
    log(`  = conta analítica já existe: ${conta.name} (id ${conta.id})`);
  } else {
    const planos = await odoo.searchRead('account.analytic.plan', [['name', 'in', ['Project', 'Projeto', 'Projetos']]], ['id', 'name']);
    if (!planos.length) throw new Error('Plano analítico de projetos não encontrado.');
    const id = await criar(
      'account.analytic.account',
      { name: nomeProjeto, code: args.codigo, plan_id: planos[0].id, company_id: empresa.id, partner_id: args.clienteId || false },
      `conta analítica "${nomeProjeto}" (${args.codigo}, plano ${planos[0].name})`
    );
    if (id) conta = { id };
  }

  const [projeto] = conta?.id
    ? await odoo.searchRead('project.project', [['account_id', '=', conta.id]], ['id', 'name'])
    : [];
  if (projeto) {
    log(`  = projeto já existe: ${projeto.name} (id ${projeto.id})`);
  } else {
    const vals = { name: nomeProjeto, company_id: empresa.id, allow_timesheets: true };
    if (conta?.id) vals.account_id = conta.id;
    // Com cliente, o projeto fica faturável e mostra o pedido de venda na Rentabilidade
    if (args.clienteId) Object.assign(vals, { partner_id: args.clienteId, allow_billable: true });
    await criar('project.project', vals, `projeto "${nomeProjeto}" com Planilha de horas`);
  }

  }

  // 2. Custo/hora do técnico -----------------------------------------------------
  if (etapa(2) && (args.funcionarioId || args.tecnico)) {
    log('\n2. Custo/hora do técnico');
    const custoHora = Math.round((args.valorMensal / args.horasMes) * 100) / 100;
    log(`  R$ ${args.valorMensal.toFixed(2)} / ${args.horasMes} h = R$ ${custoHora.toFixed(2)}/h`);
    const dominio = args.funcionarioId ? [['id', '=', args.funcionarioId]] : [['name', 'ilike', args.tecnico]];
    const encontrados = await odoo.searchRead('hr.employee', dominio, ['id', 'name', 'hourly_cost', 'company_id']);
    if (encontrados.length !== 1) {
      pendencias.push(
        encontrados.length
          ? `Há ${encontrados.length} funcionários com "${args.tecnico}": use --funcionario-id com o id correto.`
          : 'Funcionário não encontrado: confira --funcionario-id / --tecnico.'
      );
    } else {
      const emp = encontrados[0];
      if (args.aplicar) await odoo.write('hr.employee', [emp.id], { hourly_cost: custoHora });
      log(`  ${args.aplicar ? '✔' : '[simulação]'} ${emp.name} (${emp.company_id[1]}): custo/hora ${emp.hourly_cost} → ${custoHora}`);
    }
  }

  // 3. Categorias de despesa -----------------------------------------------------
  if (etapa(3)) {
  log('\n3. Categorias de despesa');
  for (const cat of CATEGORIAS_DESPESA) {
    const [existe] = await odoo.searchRead('product.product', [['default_code', '=', cat.code]], ['id', 'name']);
    if (existe) {
      log(`  = ${cat.code} ${existe.name} já existe`);
      continue;
    }
    await criar(
      'product.product',
      { name: cat.name, default_code: cat.code, can_be_expensed: true, standard_price: 0, type: 'service', sale_ok: false, purchase_ok: false },
      `categoria ${cat.code} ${cat.name}`
    );
  }
  pendencias.push('Peça à contabilidade para conferir a conta de despesa de cada categoria DSP-* (aba Contabilidade do produto).');

  }

  // 4. Diário Cartão Flash -------------------------------------------------------
  if (etapa(4)) {
  log('\n4. Diário "Cartão Flash"');
  const [diario] = await odoo.searchRead(
    'account.journal',
    [['code', '=', 'FLASH'], ['company_id', '=', empresa.id]],
    ['id', 'name']
  );
  if (diario) log(`  = diário já existe: ${diario.name} (id ${diario.id})`);
  else {
    await criar(
      'account.journal',
      { name: 'Cartão Flash', code: 'FLASH', type: 'bank', company_id: empresa.id },
      `diário bancário "Cartão Flash" (FLASH) na ${empresa.name}`
    );
  }

  }

  // 5. Estoque: consumo de material na montagem --------------------------------
  if (etapa(5)) {
  log('\n5. Estoque: operação "Consumo – Montagem"');
  const [armazem] = await odoo.searchRead(
    'stock.warehouse',
    args.armazemId ? [['id', '=', args.armazemId]] : [['company_id', '=', empresa.id]],
    ['id', 'name', 'lot_stock_id', 'company_id'],
    { limit: 1 }
  );
  if (!armazem) {
    pendencias.push('Armazém não encontrado: informe --armazem-id.');
  } else {
    const empresaArmazem = armazem.company_id[0];
    log(`  Armazém: ${armazem.name} (${armazem.company_id[1]})`);
    let [local] = await odoo.searchRead(
      'stock.location',
      [['name', '=', 'Consumo Montagens'], ['company_id', '=', empresaArmazem]],
      ['id']
    );
    let localId = local?.id;
    if (localId) log('  = local "Consumo Montagens" já existe');
    else {
      const [virtual] = await odoo.searchRead(
        'ir.model.data',
        [['module', '=', 'stock'], ['name', '=', 'stock_location_locations_virtual']],
        ['res_id']
      );
      const vals = { name: 'Consumo Montagens', usage: 'inventory', company_id: empresaArmazem };
      if (virtual) vals.location_id = virtual.res_id;
      localId = await criar('stock.location', vals, 'local virtual "Consumo Montagens"');
    }

    const [tipoOp] = await odoo.searchRead(
      'stock.picking.type',
      [['sequence_code', '=', 'MONT'], ['warehouse_id', '=', armazem.id]],
      ['id', 'name']
    );
    if (tipoOp) log(`  = tipo de operação já existe: ${tipoOp.name}`);
    else {
      const vals = {
        name: 'Consumo – Montagem',
        code: 'outgoing',
        sequence_code: 'MONT',
        warehouse_id: armazem.id,
        company_id: empresaArmazem,
        default_location_src_id: armazem.lot_stock_id[0],
      };
      if (localId) vals.default_location_dest_id = localId;
      // Gera custo analítico no projeto ao validar a saída (project_stock_account)
      if (await odoo.hasField('stock.picking.type', 'analytic_costs')) vals.analytic_costs = true;
      else pendencias.push('Este Odoo não tem "Custos analíticos" na operação de estoque: confirme com o suporte Odoo como levar o material ao projeto.');
      await criar('stock.picking.type', vals, 'tipo de operação "Consumo – Montagem" (MONT)');
    }
    if (empresaArmazem !== empresa.id) {
      pendencias.push(
        `O material sai da ${armazem.company_id[1]} para um projeto da ${empresa.name}: alinhe com a contabilidade como faturar/transferir esse material entre as empresas.`
      );
    }
    pendencias.push('Inventário → Configurações: confirme a valorização automática e o custo médio (AVCO) nas categorias de produto do material.');
  }

  }

  log('\nPendências manuais:');
  pendencias.forEach((p, i) => log(`  ${i + 1}. ${p}`));
  if (!args.aplicar) log('\nNada foi gravado. Rode novamente com --aplicar.');
}

main().catch((err) => {
  console.error(`\nErro: ${err.message}`);
  process.exit(1);
});
