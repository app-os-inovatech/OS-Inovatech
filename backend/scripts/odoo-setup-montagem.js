// Configura no Odoo a estrutura de custo de uma montagem de loja.
//
// Cria (ou reaproveita, se já existir):
//   1. Projeto da loja com Planilha de horas e conta analítica com código (ex.: LJ-0001)
//   2. Custo/hora do técnico (mão de obra entra no custo da loja via timesheet)
//   3. Categorias de despesa (produtos "pode ser despesa")
//   4. Diário bancário "Cartão Flash" (depósitos = transferência interna, gastos = custo)
//   5. Local "Consumo Montagens" + tipo de operação "Consumo – Montagem" (saída de material)
//
// Por padrão roda em modo simulação (não grava nada). Use --aplicar para gravar.
//
// Uso:
//   node scripts/odoo-setup-montagem.js \
//     --codigo LJ-0001 --loja "Fortaleza" \
//     --tecnico "Ricardo" --valor-mensal 5000 --horas-mes 176 [--aplicar]
//
// Requer ODOO_URL, ODOO_DB, ODOO_USER e ODOO_API_KEY (ver src/integrations/odoo/odooClient.js).

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
  const args = { aplicar: false, horasMes: 176 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const prox = () => argv[++i];
    if (a === '--aplicar') args.aplicar = true;
    else if (a === '--codigo') args.codigo = prox();
    else if (a === '--loja') args.loja = prox();
    else if (a === '--tecnico') args.tecnico = prox();
    else if (a === '--valor-mensal') args.valorMensal = Number(prox());
    else if (a === '--horas-mes') args.horasMes = Number(prox());
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  if (!args.codigo || !args.loja) {
    throw new Error('Informe --codigo e --loja (ex.: --codigo LJ-0001 --loja "Fortaleza").');
  }
  if (args.tecnico && !(args.valorMensal > 0 && args.horasMes > 0)) {
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
  log(`Conectado ao Odoo ${versao.server_version} (${odoo.url}, banco ${odoo.db})`);
  log(args.aplicar ? 'Modo: APLICAR (gravando)\n' : 'Modo: SIMULAÇÃO (nada será gravado; use --aplicar)\n');

  const pendencias = [];

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

  // 1. Projeto + conta analítica ------------------------------------------------
  log('1. Projeto e conta analítica da loja');
  const nomeProjeto = `${args.codigo} – Montagem ${args.loja}`;
  const campoAnalitica = (await odoo.hasField('project.project', 'account_id'))
    ? 'account_id'
    : 'analytic_account_id';
  const temTimesheet = await odoo.hasField('project.project', 'allow_timesheets');

  let [projeto] = await odoo.searchRead(
    'project.project',
    [['name', 'ilike', args.codigo]],
    ['id', 'name', campoAnalitica]
  );
  if (projeto) {
    log(`  = projeto já existe: ${projeto.name} (id ${projeto.id})`);
  } else {
    const vals = { name: nomeProjeto };
    if (temTimesheet) vals.allow_timesheets = true;
    else pendencias.push('Módulo Planilha de horas (Timesheets) não está instalado: instale para lançar mão de obra.');
    const id = await criar('project.project', vals, `projeto "${nomeProjeto}"`);
    if (id) [projeto] = await odoo.searchRead('project.project', [['id', '=', id]], ['id', 'name', campoAnalitica]);
  }

  if (projeto) {
    const conta = projeto[campoAnalitica];
    if (conta) {
      // O Odoo cria a conta analítica no plano de projetos; padronizamos nome e código
      if (args.aplicar) {
        await odoo.write('account.analytic.account', [conta[0]], { name: nomeProjeto, code: args.codigo });
      }
      log(`  ${args.aplicar ? '✔' : '[simulação]'} conta analítica "${nomeProjeto}" com código ${args.codigo}`);
    } else {
      pendencias.push(
        `O projeto "${projeto.name}" ficou sem conta analítica: em Projeto → Configurações do projeto, defina a conta analítica ${args.codigo}.`
      );
    }
  }

  // 2. Custo/hora do técnico -----------------------------------------------------
  if (args.tecnico) {
    log('\n2. Custo/hora do técnico');
    const custoHora = Math.round((args.valorMensal / args.horasMes) * 100) / 100;
    log(`  R$ ${args.valorMensal.toFixed(2)} / ${args.horasMes} h = R$ ${custoHora.toFixed(2)}/h`);
    if (!(await odoo.hasField('hr.employee', 'hourly_cost'))) {
      pendencias.push('Campo de custo/hora indisponível em Funcionários: verifique se Planilha de horas está instalado.');
    } else {
      const encontrados = await odoo.searchRead(
        'hr.employee',
        [['name', 'ilike', args.tecnico]],
        ['id', 'name', 'hourly_cost']
      );
      if (encontrados.length > 1) {
        pendencias.push(
          `Há ${encontrados.length} funcionários com "${args.tecnico}" (${encontrados.map((e) => e.name).join(', ')}): ajuste o custo/hora manualmente no correto.`
        );
      } else if (encontrados.length === 1) {
        const emp = encontrados[0];
        if (args.aplicar) await odoo.write('hr.employee', [emp.id], { hourly_cost: custoHora });
        log(`  ${args.aplicar ? '✔' : '[simulação]'} ${emp.name}: custo/hora ${emp.hourly_cost} → ${custoHora}`);
      } else {
        const vals = { name: args.tecnico, hourly_cost: custoHora };
        const tipos = (await odoo.fields('hr.employee')).employee_type?.selection || [];
        if (tipos.some(([v]) => v === 'freelance')) vals.employee_type = 'freelance';
        await criar('hr.employee', vals, `funcionário "${args.tecnico}" (PJ) com custo/hora ${custoHora}`);
      }
    }
  }

  // 3. Categorias de despesa -----------------------------------------------------
  log('\n3. Categorias de despesa');
  if (!(await odoo.hasField('product.product', 'can_be_expensed'))) {
    pendencias.push('Módulo Despesas não está instalado: instale para lançar os gastos do cartão Flash.');
  } else {
    const tipos = (await odoo.fields('product.product')).type?.selection || [];
    const tipoServico = tipos.some(([v]) => v === 'service') ? 'service' : undefined;
    for (const cat of CATEGORIAS_DESPESA) {
      const [existe] = await odoo.searchRead(
        'product.product',
        [['default_code', '=', cat.code]],
        ['id', 'name', 'can_be_expensed']
      );
      if (existe) {
        if (!existe.can_be_expensed && args.aplicar) {
          await odoo.write('product.product', [existe.id], { can_be_expensed: true });
        }
        log(`  = ${cat.code} ${existe.name} já existe`);
        continue;
      }
      const vals = { name: cat.name, default_code: cat.code, can_be_expensed: true, standard_price: 0 };
      if (tipoServico) vals.type = tipoServico;
      await criar('product.product', vals, `categoria ${cat.code} ${cat.name}`);
    }
    pendencias.push(
      'Peça à contabilidade para conferir a conta de despesa de cada categoria DSP-* (aba Contabilidade do produto).'
    );
  }

  // 4. Diário Cartão Flash -------------------------------------------------------
  log('\n4. Diário "Cartão Flash"');
  const [diario] = await odoo.searchRead('account.journal', [['code', '=', 'FLASH']], ['id', 'name']);
  if (diario) log(`  = diário já existe: ${diario.name} (id ${diario.id})`);
  else await criar('account.journal', { name: 'Cartão Flash', code: 'FLASH', type: 'bank' }, 'diário bancário "Cartão Flash" (FLASH)');

  // 5. Estoque: consumo de material na montagem --------------------------------
  log('\n5. Estoque: operação "Consumo – Montagem"');
  if (!(await odoo.hasField('stock.picking.type', 'code'))) {
    pendencias.push('Módulo Inventário não está instalado: a saída de material não pode ser lançada por projeto.');
  } else {
    const [armazem] = await odoo.searchRead('stock.warehouse', [], ['id', 'name', 'lot_stock_id'], { limit: 1 });
    if (!armazem) {
      pendencias.push('Nenhum armazém encontrado no Inventário.');
    } else {
      let [local] = await odoo.searchRead('stock.location', [['name', '=', 'Consumo Montagens']], ['id']);
      let localId = local?.id;
      if (!localId) {
        const [virtual] = await odoo.searchRead(
          'ir.model.data',
          [['module', '=', 'stock'], ['name', '=', 'stock_location_locations_virtual']],
          ['res_id']
        );
        const vals = { name: 'Consumo Montagens', usage: 'inventory' };
        if (virtual) vals.location_id = virtual.res_id;
        localId = await criar('stock.location', vals, 'local virtual "Consumo Montagens"');
      } else {
        log('  = local "Consumo Montagens" já existe');
      }

      const [tipoOp] = await odoo.searchRead('stock.picking.type', [['sequence_code', '=', 'MONT']], ['id', 'name']);
      if (tipoOp) {
        log(`  = tipo de operação já existe: ${tipoOp.name}`);
      } else {
        const vals = {
          name: 'Consumo – Montagem',
          code: 'outgoing',
          sequence_code: 'MONT',
          warehouse_id: armazem.id,
          default_location_src_id: armazem.lot_stock_id[0],
        };
        if (localId) vals.default_location_dest_id = localId;
        // Gera custo analítico no projeto ao validar a saída (project_stock_account)
        if (await odoo.hasField('stock.picking.type', 'analytic_costs')) vals.analytic_costs = true;
        else pendencias.push('Este Odoo não tem "Custos analíticos" na operação de estoque: lance o material no projeto pela saída com conta analítica ou confirme com o suporte Odoo.');
        await criar('stock.picking.type', vals, 'tipo de operação "Consumo – Montagem" (MONT)');
      }
      pendencias.push(
        'Inventário → Configurações: confirme a valorização automática e o custo médio (AVCO) nas categorias de produto do material.'
      );
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
