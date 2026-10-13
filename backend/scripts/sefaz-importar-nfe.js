// Importa para o Odoo, como fatura de fornecedor em rascunho, toda NF-e emitida contra o CNPJ das empresas
// e todo CT-e (frete) em que a empresa é a tomadora do serviço.
// Não depende do fornecedor mandar o XML: busca direto no Ambiente Nacional da SEFAZ (Distribuição DF-e).
//
// Fluxo por empresa (uma por CNPJ com certificado configurado):
//   1. Consulta os documentos novos a partir do último NSU salvo no Odoo.
//   2. Resumo de NF-e (resNFe): envia a "Ciência da Operação" para a SEFAZ liberar o XML completo,
//      que chega numa próxima consulta.
//   3. XML completo (procNFe): cria a fatura de fornecedor em rascunho, com o XML anexado.
//      Fornecedor novo é cadastrado; produtos são vinculados pelo código do fornecedor, EAN ou referência.
//   4. Evento de cancelamento: avisa no histórico da fatura já importada.
//   5. Salva o último NSU no Odoo (parâmetro de sistema sefaz_dfe.ult_nsu.<CNPJ>).
//   6. CT-e (serviço próprio da SEFAZ, NSU em sefaz_dfe.ult_nsu_cte.<CNPJ>): quando a empresa é a
//      tomadora, cria a fatura do frete no diário de fretes (ou no de compras, se a empresa não tiver).
//
// A SEFAZ só permite nova consulta 1 hora depois de responder "nenhum documento" (cStat 137);
// por isso a próxima consulta permitida também fica salva (sefaz_dfe.proxima.<CNPJ>).
//
// Uso:
//   node scripts/sefaz-importar-nfe.js [--empresa-id 2] [--desde 2026-10-01] [--aplicar]
//
//   --desde    ignora NF-e emitidas antes desta data (útil na primeira execução: a SEFAZ devolve até 90 dias)
//   --aplicar  grava no Odoo, envia a ciência e avança o NSU. Sem ele, só mostra o que faria.
//
// Requer as variáveis do Odoo (ver src/integrations/odoo/odooClient.js)
// e o certificado A1 de cada empresa (ver src/integrations/sefaz/sefazClient.js).

try {
  require('dotenv').config();
} catch {}
const OdooClient = require('../src/integrations/odoo/odooClient');
const SefazClient = require('../src/integrations/sefaz/sefazClient');
const gerarDanfe = require('../src/danfe');
const gerarDacte = require('../src/dacte');

const TIPO_DOC_NFE = '55';
const TIPO_DOC_CTE = '57';
const MAX_LOTES = 20; // 50 documentos por lote
const MAX_CONSULTAS_CHAVE = 10; // por empresa e execução: a SEFAZ limita o uso da consulta por chave

function lerArgs(argv) {
  const args = { aplicar: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--aplicar') args.aplicar = true;
    else if (a === '--empresa-id') args.empresaId = Number(argv[++i]);
    else if (a === '--desde') args.desde = argv[++i];
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  return args;
}

const digitos = (s) => String(s || '').replace(/\D/g, '');
const num = (v) => Number(v || 0);
const quantidade = (v) => num(v).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
const reais = (v) => num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarCnpj = (c) => (c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'));
const chaveDoc = (doc) => (doc.tipo === 'resNFe' ? doc.dados.resNFe.chNFe : doc.tipo === 'procNFe' ? digitos(doc.dados.nfeProc.NFe.infNFe['@_Id']) : null);
const eventoDoc = (doc) =>
  doc.tipo === 'resEvento' ? doc.dados.resEvento
  : doc.tipo === 'procEventoNFe' ? doc.dados.procEventoNFe.evento.infEvento
  : doc.tipo === 'procEventoCTe' ? doc.dados.procEventoCTe.eventoCTe.infEvento
  : null;
const lista = (v) => (v === undefined || v === null ? [] : [].concat(v));
const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Semelhança entre descrições (palavras com 3+ letras em comum ÷ menor descrição)
const palavras = (t) => new Set(String(t || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^A-Z0-9]+/).filter((w) => w.length > 2));
const parecido = (a, b) => {
  const A = palavras(a);
  const B = palavras(b);
  const comuns = [...A].filter((w) => B.has(w)).length;
  return comuns / Math.max(1, Math.min(A.size, B.size));
};

class Importador {
  constructor(odoo, empresa, sefaz, args) {
    this.odoo = odoo;
    this.empresa = empresa;
    this.sefaz = sefaz;
    this.args = { ...args };
    this.cnpj = digitos(empresa.vat);
    this.resumo = { criadas: [], ciencia: [], ignoradas: [], cancelamentos: [], erros: [], antigas: 0, cteDeTerceiros: 0 };
    this.canceladas = new Set();
    this.importadasAgora = new Set();
    this._cache = {};
  }

  async param(chave, valor) {
    const nome = `sefaz_dfe.${chave}.${this.cnpj}`;
    if (valor === undefined) return this.odoo.call('ir.config_parameter', 'get_param', { key: nome });
    if (this.args.aplicar) await this.odoo.call('ir.config_parameter', 'set_param', { key: nome, value: String(valor) });
  }

  // Fatura já lançada: pela chave de acesso ou pelo número da NF-e do mesmo fornecedor.
  // Só faturas de fornecedor: devoluções copiam a chave da nota original.
  async faturaExistente(chave, cnpjEmitente, numero) {
    const base = [['company_id', '=', this.empresa.id], ['move_type', '=', 'in_invoice']];
    const ordem = { order: 'state desc, id desc', limit: 1 }; // posted/draft antes de cancel
    const [porChave] = await this.odoo.searchRead('account.move', [...base, ['l10n_br_access_key', 'in', [chave, `NFe${chave}`]]], ['id', 'name', 'state'], ordem);
    if (porChave || !cnpjEmitente) return porChave;
    const doc = digitos(cnpjEmitente);
    const n = String(Number(numero));
    const [porNumero] = await this.odoo.searchRead(
      'account.move',
      [...base, ['partner_id.vat', 'in', [doc, formatarCnpj(doc)]], '|', ['name', '=', n], ['ref', '=', n]],
      ['id', 'name', 'state'],
      ordem
    );
    return porNumero;
  }

  async processar() {
    // A data inicial vale também para as execuções seguintes (a primeira carga pode levar várias)
    if (this.args.desde) await this.param('desde', this.args.desde);
    else this.args.desde = (await this.param('desde')) || undefined;
    this.pendentes = new Set(JSON.parse((await this.param('pendentes')) || '[]'));
    if (this.args.aplicar) await this.reprocessarPendentes();
    this.aBuscar = [];
    await this.consultar('nfe');
    if (this.args.aplicar) await this.buscarLiberadas();
    await this.consultar('cte');
    await this.param('pendentes', JSON.stringify([...this.pendentes]));
    return this.resumo;
  }

  // Lê os lotes novos de um dos serviços de distribuição (NF-e ou CT-e), cada um com seu NSU
  async consultar(modelo) {
    const sufixo = modelo === 'cte' ? '_cte' : '';
    const nome = modelo === 'cte' ? 'CT-e' : 'NF-e';
    const proxima = Number((await this.param(`proxima${sufixo}`)) || 0);
    if (proxima > Date.now()) {
      console.log(`  ${nome}: aguardando a janela da SEFAZ (próxima consulta às ${new Date(proxima).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`);
      return;
    }
    let ultNSU = (await this.param(`ult_nsu${sufixo}`)) || '0';
    for (let lote = 0; lote < MAX_LOTES; lote++) {
      const r = modelo === 'cte' ? await this.sefaz.distribuicaoCte(ultNSU) : await this.sefaz.distribuicao(ultNSU);
      if (r.cStat === '137') {
        console.log(`  ${nome}: ${r.xMotivo} (NSU ${Number(r.ultNSU)})`);
        await this.param(`proxima${sufixo}`, Date.now() + 61 * 60 * 1000);
        break;
      }
      if (r.cStat === '656') {
        // Consumo indevido: a SEFAZ bloqueia o CNPJ por 1 hora
        console.log(`  ${nome}: SEFAZ pediu para aguardar 1 hora: ${r.xMotivo}`);
        await this.param(`proxima${sufixo}`, Date.now() + 61 * 60 * 1000);
        break;
      }
      if (r.cStat !== '138') throw new Error(`SEFAZ recusou a consulta de ${nome}: ${r.cStat} – ${r.xMotivo}`);
      console.log(`  ${nome}: ${r.documentos.length} documentos (NSU ${Number(ultNSU)} → ${Number(r.ultNSU)} de ${Number(r.maxNSU)})`);
      // Documentos cancelados no mesmo lote não viram fatura
      for (const doc of r.documentos) {
        const ev = eventoDoc(doc);
        if (ev && String(ev.tpEvento) === '110111') this.canceladas.add(ev.chNFe || ev.chCTe);
        if (doc.tipo === 'resNFe' && doc.dados.resNFe.cSitNFe === '3') this.canceladas.add(doc.dados.resNFe.chNFe);
      }
      for (const doc of r.documentos) {
        try {
          await this.documento(doc);
        } catch (err) {
          this.resumo.erros.push(`${nome} NSU ${Number(doc.nsu)} (${doc.tipo}): ${err.message}`);
          const chave = chaveDoc(doc);
          if (chave) this.pendentes.add(chave);
        }
      }
      ultNSU = r.ultNSU;
      await this.param(`ult_nsu${sufixo}`, ultNSU);
      if (r.ultNSU === r.maxNSU) {
        // Já está em dia: a SEFAZ pede 1 hora antes da próxima consulta
        await this.param(`proxima${sufixo}`, Date.now() + 61 * 60 * 1000);
        break;
      }
    }
  }

  // Logo após a ciência, busca o XML completo pela chave, sem esperar a próxima hora.
  // O que não vier agora (limite atingido ou XML ainda indisponível) chega pelo NSU na execução seguinte.
  async buscarLiberadas() {
    let consultas = 0;
    for (const chave of this.aBuscar) {
      if (consultas >= MAX_CONSULTAS_CHAVE) break;
      consultas++;
      try {
        const r = await this.sefaz.consultarChave(chave);
        if (r.cStat === '656') {
          console.log(`  NF-e: SEFAZ limitou a consulta por chave: ${r.xMotivo}`);
          await this.param('proxima', Date.now() + 61 * 60 * 1000);
          break;
        }
        for (const doc of r.documentos.filter((d) => d.tipo === 'procNFe')) await this.documento(doc);
      } catch (err) {
        this.resumo.erros.push(`Busca da NF-e ${chave} após a ciência: ${err.message}`);
      }
    }
    const restantes = this.aBuscar.filter((c) => !this.importadasAgora.has(c)).length;
    if (restantes) console.log(`  ${restantes} NF-e com ciência enviada chegam pelo NSU na próxima execução`);
  }

  // NF-e que falharam numa execução anterior: busca de novo pela chave
  async reprocessarPendentes() {
    for (const chave of [...this.pendentes]) {
      try {
        if (!(await this.faturaExistente(chave))) {
          const r = await this.sefaz.consultarChave(chave);
          for (const doc of r.documentos) await this.documento(doc);
        }
        if (await this.faturaExistente(chave)) this.pendentes.delete(chave);
      } catch (err) {
        this.resumo.erros.push(`Reprocessar ${chave}: ${err.message}`);
      }
    }
  }

  async documento(doc) {
    if (doc.tipo === 'resNFe') return this.resumoNfe(doc.dados.resNFe);
    if (doc.tipo === 'procNFe') return this.nfeCompleta(doc);
    if (doc.tipo === 'resEvento') return this.evento(doc.dados.resEvento);
    if (doc.tipo === 'procEventoNFe' || doc.tipo === 'procEventoCTe') return this.evento(eventoDoc(doc));
    if (doc.tipo === 'procCTe') return this.cteCompleto(doc);
    this.resumo.ignoradas.push(`NSU ${Number(doc.nsu)}: documento ${doc.schema} não tratado`);
  }

  antesDoInicio(dhEmi) {
    return this.args.desde && String(dhEmi).slice(0, 10) < this.args.desde;
  }

  async resumoNfe(res) {
    const rotulo = `${res.xNome} – ${reais(res.vNF)} (chave ${res.chNFe})`;
    if (this.antesDoInicio(res.dhEmi)) return this.resumo.antigas++;
    if (this.canceladas.has(res.chNFe)) return this.resumo.ignoradas.push(`${rotulo}: cancelada pelo emitente`);
    if (res.cSitNFe !== '1') return this.resumo.ignoradas.push(`${rotulo}: situação ${res.cSitNFe === '3' ? 'cancelada' : 'denegada'}`);
    if (await this.faturaExistente(res.chNFe, res.CNPJ || res.CPF, res.chNFe.substr(25, 9))) return;
    if (!this.args.aplicar) return this.resumo.ciencia.push(`${rotulo} (simulação)`);
    await this.ciencia(res.chNFe, rotulo);
  }

  // Ciência da Operação. Se falhar, a chave fica pendente e é reenviada na próxima execução
  // (o NSU já avançou, então o resumo não volta a chegar).
  async ciencia(chave, rotulo) {
    let r;
    try {
      r = await this.sefaz.manifestar(chave, 210210);
    } catch (err) {
      r = { cStat: 'falha', xMotivo: err.message };
    }
    if (r.cStat === '135' || r.cStat === '573') {
      this.resumo.ciencia.push(rotulo);
      this.pendentes.delete(chave);
      this.aBuscar.push(chave);
    } else {
      this.resumo.erros.push(`Ciência de ${rotulo}: ${r.cStat} – ${r.xMotivo}`);
      this.pendentes.add(chave);
    }
  }

  async evento(ev) {
    if (String(ev.tpEvento) !== '110111') return; // só cancelamento interessa
    const chave = ev.chNFe || ev.chCTe;
    const modelo = ev.chCTe ? 'CT-e' : 'NF-e';
    const fatura = await this.faturaExistente(chave, chave.substr(6, 14), chave.substr(25, 9));
    const texto = `${modelo} ${chave} cancelado(a) pelo emitente`;
    if (!fatura) return;
    this.resumo.cancelamentos.push(`${texto}: fatura ${fatura.name} (${fatura.state}) precisa ser revista`);
    if (this.args.aplicar) {
      await this.odoo.call('account.move', 'message_post', {
        ids: [fatura.id],
        body: `<p><b>Atenção:</b> a SEFAZ informou que o documento ${modelo} ${chave} foi <b>cancelado pelo emitente</b>. Revise ou cancele esta fatura.</p>`,
        body_is_html: true,
        message_type: 'comment',
        subtype_xmlid: 'mail.mt_note',
      });
      await this.odoo.call('account.move', 'activity_schedule', {
        ids: [fatura.id],
        act_type_xmlid: 'mail.mail_activity_data_todo',
        summary: `${modelo} cancelado(a) pelo fornecedor`,
      });
    }
  }

  // CNPJ de quem paga o frete: toma3 aponta uma das partes; toma4 (ou toma, no CT-e OS) traz o CNPJ
  static tomadorCte(cte) {
    const ide = cte.ide;
    const explicito = cte.toma || ide.toma4;
    if (explicito) return digitos(explicito.CNPJ || explicito.CPF);
    const indice = (ide.toma3 || ide.toma03 || {}).toma;
    const parte = { 0: cte.rem, 1: cte.exped, 2: cte.receb, 3: cte.dest }[indice];
    return digitos(parte && (parte.CNPJ || parte.CPF));
  }

  async cteCompleto(doc) {
    const cte = doc.dados.cteProc.CTe.infCte;
    const chave = digitos(cte['@_Id']);
    const { ide, emit, vPrest } = cte;
    const rotulo = `CT-e ${ide.nCT} – ${emit.xNome} – ${reais(vPrest.vTPrest)}`;

    if (this.antesDoInicio(ide.dhEmi)) return this.resumo.antigas++;
    if (Importador.tomadorCte(cte) !== this.cnpj) return this.resumo.cteDeTerceiros++; // frete pago por outra empresa
    if (this.canceladas.has(chave)) return this.resumo.ignoradas.push(`${rotulo}: cancelado pelo emitente`);
    const existente = await this.faturaExistente(chave, emit.CNPJ || emit.CPF, ide.nCT);
    if (existente) return this.resumo.ignoradas.push(`${rotulo}: já lançado (${existente.name})`);

    const parceiro = await this.fornecedor(emit);
    const notas = lista(cte.infCTeNorm && cte.infCTeNorm.infDoc && cte.infCTeNorm.infDoc.infNFe).map((n) => n.chave);
    const fatura = {
      move_type: 'in_invoice',
      company_id: this.empresa.id,
      journal_id: this.empresa.diarioFretes || this.empresa.diarioCompras,
      partner_id: parceiro.id,
      invoice_date: String(ide.dhEmi).slice(0, 10),
      l10n_latam_document_type_id: this.empresa.tipoDocCte || false,
      l10n_latam_document_number: String(Number(ide.nCT)),
      l10n_br_access_key: chave,
      ref: `CT-e ${Number(ide.nCT)} série ${ide.serie}`,
      invoice_line_ids: [[0, 0, {
        product_id: this.empresa.produtoFrete || false,
        name: `Frete CT-e ${Number(ide.nCT)}: ${ide.xMunIni}/${ide.UFIni} → ${ide.xMunFim}/${ide.UFFim}`,
        quantity: 1,
        price_unit: num(vPrest.vTPrest),
        tax_ids: [[6, 0, []]], // o valor do CT-e já é o total a pagar, como nos fretes lançados à mão
        ...(this.empresa.contaFrete && { account_id: this.empresa.contaFrete }),
      }]],
    };
    const diario = this.empresa.diarioFretes ? 'Fretes' : 'Compras';
    if (!this.args.aplicar) {
      this.resumo.criadas.push(`${rotulo} → diário ${diario} (simulação)${parceiro.novo ? ' — transportadora nova' : ''}`);
      return;
    }
    if (parceiro.novo) parceiro.id = await this.odoo.create('res.partner', parceiro.valores);
    fatura.partner_id = parceiro.id;
    const id = await this.odoo.create('account.move', fatura);
    await this.odoo.create('ir.attachment', {
      name: `CTe${chave}.xml`,
      raw: Buffer.from(doc.xml, 'utf8').toString('base64'),
      mimetype: 'application/xml',
      res_model: 'account.move',
      res_id: id,
    });
    let semDacte = '';
    try {
      const pdf = await gerarDacte(doc.xml);
      await this.odoo.create('ir.attachment', {
        name: `DACTE CT-e ${Number(ide.nCT)} - ${emit.xNome}.pdf`,
        raw: pdf.toString('base64'),
        mimetype: 'application/pdf',
        res_model: 'account.move',
        res_id: id,
      });
    } catch (err) {
      semDacte = `<p><b>Revisar:</b> DACTE não gerado (${escapar(err.message)}); o XML está anexado.</p>`;
    }
    const icms = cte.imp && cte.imp.ICMS && Object.values(cte.imp.ICMS)[0];
    const corpo =
      `<p>CT-e importado automaticamente da SEFAZ (Distribuição DF-e).</p>` +
      `<ul><li>Chave: ${chave}</li><li>Emitido em ${String(ide.dhEmi).slice(0, 10).split('-').reverse().join('/')} – ${escapar(ide.natOp || 'prestação de serviço de transporte')}</li>` +
      `<li>Trajeto: ${escapar(`${ide.xMunIni}/${ide.UFIni} → ${ide.xMunFim}/${ide.UFFim}`)}</li>` +
      `<li><b>Valor do frete ${reais(vPrest.vTPrest)}</b>${icms && num(icms.vICMS) ? ` | ICMS ${reais(icms.vICMS)}` : ''}</li>` +
      (notas.length ? `<li>NF-e transportadas: ${notas.join(', ')}</li>` : '') +
      `</ul>` +
      (parceiro.novo ? '<p><b>Revisar:</b> transportadora cadastrada automaticamente a partir do XML.</p>' : '') +
      semDacte;
    await this.odoo.call('account.move', 'message_post', { ids: [id], body: corpo, body_is_html: true, message_type: 'comment', subtype_xmlid: 'mail.mt_note' });
    const [criada] = await this.odoo.call('account.move', 'read', { ids: [id], fields: ['name'] });
    this.resumo.criadas.push(`${rotulo} → ${criada.name || `rascunho #${id}`} (diário ${diario})`);
  }

  async nfeCompleta(doc) {
    const nfe = doc.dados.nfeProc.NFe.infNFe;
    const chave = digitos(nfe['@_Id']);
    const { ide, emit, dest, total, cobr } = nfe;
    const tot = total.ICMSTot;
    const cnpjEmit = emit.CNPJ || emit.CPF;
    const rotulo = `NF-e ${ide.nNF} – ${emit.xNome} – ${reais(tot.vNF)}`;

    if (this.antesDoInicio(ide.dhEmi)) return this.resumo.antigas++;
    if (this.canceladas.has(chave)) return this.resumo.ignoradas.push(`${rotulo}: cancelada pelo emitente`);
    if (digitos(dest && (dest.CNPJ || dest.CPF)) !== this.cnpj) return this.resumo.ignoradas.push(`${rotulo}: a empresa não é a destinatária (transporte ou autorização de XML)`);
    if (ide.tpNF !== '1') return this.resumo.ignoradas.push(`${rotulo}: nota de entrada emitida pelo próprio fornecedor`);
    if (ide.finNFe === '4') return this.resumo.ignoradas.push(`${rotulo}: devolução de cliente — lançar como nota de crédito de venda`);
    const existente = await this.faturaExistente(chave, cnpjEmit, ide.nNF);
    if (existente) return this.resumo.ignoradas.push(`${rotulo}: já lançada (${existente.name})`);

    const parceiro = await this.fornecedor(emit);
    const produtos = [];
    for (const det of nfe.det) produtos.push(parceiro.id ? await this.produto(parceiro.id, det.prod) : null);
    const busca = parceiro.id ? await this.pedidoDeCompra(nfe, cnpjEmit, produtos) : null;
    const vinculo = busca && busca.pedido ? busca : null;
    const avisos = [];
    if (busca && !busca.pedido) avisos.push(`Não foi possível ligar a um pedido automaticamente. Pedidos em aberto deste fornecedor: ${busca.abertos.join(', ')} — vincule com scripts/vincular-nf-pedido.js.`);
    const aprender = []; // códigos do fornecedor a cadastrar no produto quando o item só foi ligado pelo pedido
    const linhas = [];
    let semProduto = 0;
    nfe.det.forEach((det, i) => {
      const p = det.prod;
      const linhaPedido = vinculo && vinculo.itens[i];
      const produto = linhaPedido ? linhaPedido.product_id && linhaPedido.product_id[0] : produtos[i];
      if (!produto) semProduto++;
      const bruto = num(p.vProd);
      const linha = {
        product_id: produto || false,
        name: `[${p.cProd}] ${p.xProd}`,
        quantity: num(p.qCom),
        price_unit: num(p.vUnCom),
        discount: bruto && num(p.vDesc) ? Math.round((num(p.vDesc) / bruto) * 1e6) / 1e4 : 0,
      };
      if (linhaPedido) {
        linha.purchase_line_id = linhaPedido.id;
        linha.tax_ids = [[6, 0, linhaPedido.tax_ids]];
        const preco = num(linhaPedido.price_unit);
        if (preco && Math.abs(num(p.vUnCom) - preco) / preco > 0.01) avisos.push(`Item ${i + 1} (${p.xProd}): preço na NF-e ${reais(p.vUnCom)} × no pedido ${reais(preco)}.`);
        const saldo = num(linhaPedido.product_qty) - num(linhaPedido.qty_invoiced);
        if (num(p.qCom) > saldo + 1e-6) avisos.push(`Item ${i + 1} (${p.xProd}): NF-e fatura ${quantidade(p.qCom)}, mas o pedido só tem ${quantidade(saldo)} a faturar.`);
        if (!produtos[i] && produto) aprender.push({ produto, cProd: p.cProd, xProd: p.xProd, preco: num(p.vUnCom) });
      } else if (vinculo) {
        avisos.push(`Item ${i + 1} (${p.xProd}) não encontrado no pedido ${vinculo.pedido.name}.`);
      }
      linhas.push(linha);
    });
    // Despesas que fazem parte do valor a pagar e não são imposto
    [['vFrete', 'Frete'], ['vSeg', 'Seguro'], ['vOutro', 'Outras despesas acessórias']].forEach(([campo, nome]) => {
      if (num(tot[campo])) linhas.push({ name: `${nome} (NF-e ${ide.nNF})`, quantity: 1, price_unit: num(tot[campo]) });
    });

    const dups = (cobr && cobr.dup) || [];
    const fatura = {
      move_type: 'in_invoice',
      company_id: this.empresa.id,
      journal_id: this.empresa.diarioCompras,
      partner_id: parceiro.id,
      invoice_date: String(ide.dhEmi).slice(0, 10),
      l10n_latam_document_type_id: this.empresa.tipoDocNfe,
      l10n_latam_document_number: String(Number(ide.nNF)),
      l10n_br_access_key: chave,
      ref: `NF-e ${Number(ide.nNF)} série ${ide.serie}`,
      invoice_line_ids: linhas.map((l) => [0, 0, l]),
    };
    if (vinculo) fatura.invoice_origin = vinculo.pedido.name;
    if (dups.length) fatura.invoice_date_due = dups[0].dVenc;

    if (parceiro.novo) avisos.push('Fornecedor cadastrado automaticamente a partir do XML: confira regime tributário e setor de atividade.');
    if (semProduto) avisos.push(`${semProduto} de ${nfe.det.length} itens sem produto vinculado no Odoo.`);

    if (!this.args.aplicar) {
      this.resumo.criadas.push(`${rotulo}${vinculo ? ` → pedido ${vinculo.pedido.name}` : ''} (simulação)${avisos.length ? ` — ${avisos.join(' ')}` : ''}`);
      return;
    }

    if (parceiro.novo) parceiro.id = await this.odoo.create('res.partner', parceiro.valores);
    fatura.partner_id = parceiro.id;
    const id = await this.odoo.create('account.move', fatura);
    await this.odoo.create('ir.attachment', {
      name: `NFe${chave}.xml`,
      raw: Buffer.from(doc.xml, 'utf8').toString('base64'),
      mimetype: 'application/xml',
      res_model: 'account.move',
      res_id: id,
    });
    try {
      const pdf = await gerarDanfe(doc.xml);
      await this.odoo.create('ir.attachment', {
        name: `DANFE NF-e ${Number(ide.nNF)} - ${emit.xNome}.pdf`,
        raw: pdf.toString('base64'),
        mimetype: 'application/pdf',
        res_model: 'account.move',
        res_id: id,
      });
    } catch (err) {
      avisos.push(`DANFE não gerado (${err.message}); o XML está anexado.`);
    }
    const [criada] = await this.odoo.call('account.move', 'read', { ids: [id], fields: ['name', 'amount_total'] });
    let recebimento = '';
    if (vinculo) {
      await this.aprenderCodigos(parceiro.id, aprender);
      const pendentes = vinculo.pedido.picking_ids.length
        ? await this.odoo.searchRead('stock.picking', [['id', 'in', vinculo.pedido.picking_ids], ['state', 'not in', ['done', 'cancel']]], ['name'])
        : [];
      recebimento =
        `<li>Pedido de compra: <b>${escapar(vinculo.pedido.name)}</b> (${escapar(vinculo.criterio)})</li>` +
        (pendentes.length ? `<li>Recebimento pendente: ${pendentes.map((r) => escapar(r.name)).join(', ')} — valide no Estoque quando a mercadoria chegar.</li>` : '');
    }

    const impostos = [['vICMS', 'ICMS'], ['vST', 'ICMS-ST'], ['vFCPST', 'FCP-ST'], ['vIPI', 'IPI'], ['vPIS', 'PIS'], ['vCOFINS', 'COFINS']]
      .filter(([c]) => num(tot[c]))
      .map(([c, n]) => `${n} ${reais(tot[c])}`);
    const diferenca = Math.round((num(tot.vNF) - criada.amount_total) * 100) / 100;
    if (diferenca) avisos.push(`Total do rascunho (${reais(criada.amount_total)}) difere do total da NF-e em ${reais(diferenca)}: confira impostos (ex.: ICMS-ST, IPI) antes de confirmar.`);
    const corpo =
      `<p>Importada automaticamente da SEFAZ (Distribuição DF-e).</p>` +
      `<ul><li>Chave: ${chave}</li><li>Emitida em ${String(ide.dhEmi).slice(0, 10).split('-').reverse().join('/')} – natureza: ${escapar(ide.natOp)}</li>` +
      `<li>Produtos ${reais(tot.vProd)} | Desconto ${reais(tot.vDesc)} | <b>Total da NF-e ${reais(tot.vNF)}</b></li>` +
      recebimento +
      (impostos.length ? `<li>Impostos destacados: ${impostos.join(' | ')}</li>` : '') +
      (dups.length ? `<li>Duplicatas: ${dups.map((d) => `${d.dVenc.split('-').reverse().join('/')} ${reais(d.vDup)}`).join(' | ')}</li>` : '') +
      `</ul>` +
      (avisos.length ? `<p><b>Revisar:</b></p><ul>${avisos.map((a) => `<li>${escapar(a)}</li>`).join('')}</ul>` : '');
    await this.odoo.call('account.move', 'message_post', { ids: [id], body: corpo, body_is_html: true, message_type: 'comment', subtype_xmlid: 'mail.mt_note' });
    this.importadasAgora.add(chave);
    this.resumo.criadas.push(`${rotulo} → ${criada.name || `rascunho #${id}`}${vinculo ? ` (pedido ${vinculo.pedido.name})` : ''}${avisos.length ? ` — ${avisos.join(' ')}` : ''}`);
  }

  // Pedido de compra confirmado do fornecedor que esta NF-e atende:
  //   1. número do pedido citado no XML (xPed dos itens, compra/xPed ou "PEDIDO ..." nas informações complementares);
  //   2. senão, o pedido aberto com mais itens em comum (produtos já vinculados);
  //   3. senão, o único pedido aberto com o mesmo valor de produtos (tolerância de 1%).
  // Devolve { pedido, criterio, itens } com a linha do pedido correspondente a cada item da NF-e.
  async pedidoDeCompra(nfe, cnpjEmit, produtos) {
    const doc = digitos(cnpjEmit);
    const pedidos = await this.odoo.searchRead(
      'purchase.order',
      [['company_id', '=', this.empresa.id], ['state', 'in', ['purchase', 'done']], ['invoice_status', '!=', 'invoiced'], ['partner_id.vat', 'in', [doc, formatarCnpj(doc)]]],
      ['id', 'name', 'amount_untaxed', 'order_line', 'picking_ids'],
      { order: 'date_order desc', limit: 30 }
    );
    if (!pedidos.length) return null;
    const linhas = await this.odoo.call('purchase.order.line', 'read', {
      ids: pedidos.flatMap((p) => p.order_line),
      fields: ['order_id', 'product_id', 'name', 'product_qty', 'qty_invoiced', 'price_unit', 'tax_ids', 'display_type'],
    });
    const linhasDo = (pedido) => linhas.filter((l) => l.order_id[0] === pedido.id && !l.display_type);

    const citados = new Set();
    nfe.det.forEach((d) => d.prod.xPed && citados.add(Number(digitos(d.prod.xPed))));
    if (nfe.compra && nfe.compra.xPed) citados.add(Number(digitos(nfe.compra.xPed)));
    const cpl = String((nfe.infAdic && nfe.infAdic.infCpl) || '');
    for (const m of cpl.matchAll(/PEDIDO[^0-9]{0,25}(\d{1,10})|\bP0*(\d{2,6})\b/gi)) citados.add(Number(m[1] || m[2]));

    let escolhido = pedidos.find((p) => citados.has(Number(digitos(p.name))));
    let criterio = 'número do pedido citado na NF-e';
    if (!escolhido) {
      const emComum = (p) => produtos.filter((id) => id && linhasDo(p).some((l) => l.product_id && l.product_id[0] === id)).length;
      const pontos = pedidos.map((p) => ({ p, n: emComum(p) }));
      const melhor = Math.max(...pontos.map((x) => x.n));
      const empatados = pontos.filter((x) => x.n === melhor);
      // itens da NF-e com descrição parecida (≥ 50%) a alguma linha do pedido
      const parecidos = (p) => nfe.det.filter((d) => linhasDo(p).some((l) => parecido(d.prod.xProd, l.name) >= 0.5)).length;
      const porDescricao = pedidos.map((p) => ({ p, n: parecidos(p) }));
      const melhorDesc = Math.max(...porDescricao.map((x) => x.n));
      const empatadosDesc = porDescricao.filter((x) => x.n === melhorDesc);
      if (melhor > 0 && empatados.length === 1) {
        escolhido = empatados[0].p;
        criterio = `${melhor} de ${nfe.det.length} itens em comum`;
      } else if (melhorDesc > nfe.det.length / 2 && empatadosDesc.length === 1) {
        escolhido = empatadosDesc[0].p;
        criterio = `${melhorDesc} de ${nfe.det.length} itens com descrição parecida`;
      } else {
        const vProd = num(nfe.total.ICMSTot.vProd) - num(nfe.total.ICMSTot.vDesc);
        const mesmoValor = pedidos.filter((p) => vProd && Math.abs(num(p.amount_untaxed) - vProd) / vProd <= 0.01);
        if (mesmoValor.length === 1) {
          escolhido = mesmoValor[0];
          criterio = 'mesmo valor de produtos';
        }
      }
    }
    if (!escolhido) return { pedido: null, abertos: pedidos.map((p) => p.name) };

    // Cada item da NF-e → linha do pedido: mesmo produto, senão descrição parecida, senão mesma posição
    const disponiveis = linhasDo(escolhido);
    const usadas = new Set();
    const itens = nfe.det.map((det, i) => {
      const livres = disponiveis.filter((l) => !usadas.has(l.id));
      let l = produtos[i] && livres.find((x) => x.product_id && x.product_id[0] === produtos[i]);
      if (!l) {
        const candidatos = livres.map((x) => ({ x, s: parecido(det.prod.xProd, x.name) })).filter((c) => c.s >= 0.5).sort((a, b) => b.s - a.s);
        l = candidatos[0] && candidatos[0].x;
      }
      if (!l && nfe.det.length === disponiveis.length) l = disponiveis[i] && !usadas.has(disponiveis[i].id) ? disponiveis[i] : null;
      if (l) usadas.add(l.id);
      return l || null;
    });
    return { pedido: escolhido, criterio, itens };
  }

  // Grava o código do fornecedor no produto, para as próximas NF-e já virem com o produto certo
  async aprenderCodigos(parceiroId, itens) {
    for (const { produto, cProd, xProd, preco } of itens) {
      const [variante] = await this.odoo.call('product.product', 'read', { ids: [produto], fields: ['product_tmpl_id'] });
      const ja = await this.odoo.searchRead('product.supplierinfo', [['partner_id', '=', parceiroId], ['product_tmpl_id', '=', variante.product_tmpl_id[0]], ['product_code', '=', cProd]], ['id']);
      if (!ja.length) await this.odoo.create('product.supplierinfo', { partner_id: parceiroId, product_tmpl_id: variante.product_tmpl_id[0], product_code: cProd, product_name: xProd, price: preco });
    }
  }

  async fornecedor(emit) {
    const doc = digitos(emit.CNPJ || emit.CPF);
    if (this._cache[`p${doc}`]) return this._cache[`p${doc}`];
    const [existente] = await this.odoo.searchRead('res.partner', [['vat', 'in', [doc, formatarCnpj(doc)]], ['parent_id', '=', false]], ['id'], { limit: 1 });
    if (existente) return (this._cache[`p${doc}`] = { id: existente.id });

    const end = emit.enderEmit || {};
    const [estado] = await this.odoo.searchRead('res.country.state', [['country_id.code', '=', 'BR'], ['code', '=', end.UF]], ['id', 'country_id'], { limit: 1 });
    const [cidade] = estado ? await this.odoo.searchRead('res.city', [['state_id', '=', estado.id], ['name', '=ilike', end.xMun]], ['id'], { limit: 1 }).catch(() => []) : [];
    const [tipoId] = await this.odoo.searchRead('l10n_latam.identification.type', [['name', '=', emit.CNPJ ? 'CNPJ' : 'CPF'], ['country_id.code', '=', 'BR']], ['id'], { limit: 1 });
    const valores = {
      name: emit.xNome,
      is_company: Boolean(emit.CNPJ),
      vat: doc,
      l10n_br_ie_code: emit.IE && emit.IE !== 'ISENTO' ? emit.IE : false,
      street: [end.xLgr, end.nro].filter(Boolean).join(', '),
      street2: [end.xCpl, end.xBairro].filter(Boolean).join(' – '),
      zip: end.CEP,
      city: end.xMun,
      phone: end.fone || false,
      supplier_rank: 1,
    };
    if (estado) Object.assign(valores, { state_id: estado.id, country_id: estado.country_id[0] });
    if (cidade) valores.city_id = cidade.id;
    if (tipoId) valores.l10n_latam_identification_type_id = tipoId.id;
    return (this._cache[`p${doc}`] = { id: null, novo: true, valores });
  }

  // Produto do Odoo: código do fornecedor → EAN → referência interna (só se for única)
  async produto(parceiroId, p) {
    const [info] = await this.odoo.searchRead(
      'product.supplierinfo',
      [['partner_id', '=', parceiroId], ['product_code', '=', p.cProd]],
      ['product_id', 'product_tmpl_id'],
      { limit: 1 }
    );
    if (info && info.product_id) return info.product_id[0];
    if (info) {
      const [variante] = await this.odoo.searchRead('product.product', [['product_tmpl_id', '=', info.product_tmpl_id[0]]], ['id'], { limit: 1 });
      if (variante) return variante.id;
    }
    if (/^\d{8,14}$/.test(p.cEAN || '')) {
      const [porEan] = await this.odoo.searchRead('product.product', [['barcode', '=', p.cEAN]], ['id'], { limit: 1 });
      if (porEan) return porEan.id;
    }
    // Referência interna igual ao código do fornecedor: só aceita se a descrição também for parecida
    // (códigos curtos como "30" coincidem por acaso com produtos nossos)
    const porCodigo = await this.odoo.searchRead('product.product', [['default_code', '=', p.cProd]], ['id', 'name'], { limit: 2 });
    return porCodigo.length === 1 && parecido(p.xProd, porCodigo[0].name) >= 0.5 ? porCodigo[0].id : null;
  }
}

async function main() {
  const args = lerArgs(process.argv.slice(2));
  const odoo = new OdooClient();
  console.log(`Odoo: ${(() => { try { const u = new URL(odoo.url); return `${u.protocol}//${u.host.replace(/^(.{3}).*(.{4})$/, '$1…$2')}`; } catch { return `endereço inválido (${odoo.url.length} caracteres)`; } })()}`);
  await odoo.login();
  console.log(args.aplicar ? 'Modo: APLICAR (gravando)\n' : 'Modo: SIMULAÇÃO (nada será gravado nem enviado à SEFAZ; use --aplicar)\n');

  const empresas = await odoo.searchRead('res.company', args.empresaId ? [['id', '=', args.empresaId]] : [], ['id', 'name', 'vat', 'state_id']);
  const [tipoDoc] = await odoo.searchRead('l10n_latam.document.type', [['code', '=', TIPO_DOC_NFE], ['country_id.code', '=', 'BR']], ['id'], { limit: 1 });
  const [tipoDocCte] = await odoo.searchRead('l10n_latam.document.type', [['code', '=', TIPO_DOC_CTE], ['country_id.code', '=', 'BR'], ['active', 'in', [true, false]]], ['id'], { limit: 1 });
  const [produtoFrete] = await odoo.searchRead('product.product', [['name', '=ilike', 'serviço de frete']], ['id'], { limit: 1 });
  let falhou = false;

  for (const empresa of empresas) {
    const cnpj = digitos(empresa.vat);
    console.log(`${empresa.name} (${formatarCnpj(cnpj)})`);
    if (!SefazClient.temCertificado(cnpj)) {
      console.log(`  sem certificado configurado (SEFAZ_CERT_${cnpj}_PFX) — pulando\n`);
      continue;
    }
    try {
      odoo.context = { ...odoo.context, allowed_company_ids: [empresa.id, ...odoo.context.allowed_company_ids.filter((c) => c !== empresa.id)] };
      const [estado] = await odoo.searchRead('res.country.state', [['id', '=', empresa.state_id[0]]], ['code']);
      const [diario] = await odoo.searchRead('account.journal', [['company_id', '=', empresa.id], ['type', '=', 'purchase']], ['id', 'name'], { order: 'sequence, id', limit: 1 });
      const [contaFrete] = await odoo.searchRead('account.account', [['name', '=ilike', 'fretes (transportadora)'], ['company_ids', 'in', [empresa.id]]], ['id'], { limit: 1 });
      const [diarioFretes] = await odoo.searchRead('account.journal', [['company_id', '=', empresa.id], ['type', '=', 'purchase'], ['name', 'ilike', 'frete']], ['id'], { limit: 1 });
      const sefaz = new SefazClient({ cnpj, uf: estado.code });
      const validade = sefaz.certificado.validoAte;
      const dias = Math.floor((validade - Date.now()) / 86400000);
      console.log(`  Certificado: ${sefaz.certificado.titular} — válido até ${validade.toLocaleDateString('pt-BR')}${dias < 30 ? ` ⚠ vence em ${dias} dias` : ''}`);

      const imp = new Importador(odoo, { ...empresa, diarioCompras: diario.id, diarioFretes: diarioFretes && diarioFretes.id, contaFrete: contaFrete && contaFrete.id, tipoDocNfe: tipoDoc.id, tipoDocCte: tipoDocCte && tipoDocCte.id, produtoFrete: produtoFrete && produtoFrete.id }, sefaz, args);
      const r = await imp.processar();
      const bloco = (titulo, itens) => itens.length && console.log(`  ${titulo} (${itens.length}):\n${itens.map((i) => `    - ${i}`).join('\n')}`);
      bloco(args.aplicar ? 'Faturas criadas' : 'Faturas a criar', r.criadas);
      bloco(args.aplicar ? 'Ciência enviada' : 'Ciência a enviar', r.ciencia);
      bloco('Cancelamentos', r.cancelamentos);
      bloco('Ignoradas', r.ignoradas);
      bloco('Erros', r.erros);
      if (r.cteDeTerceiros) console.log(`  ${r.cteDeTerceiros} CT-e em que a empresa não paga o frete ignorados`);
      if (r.antigas) console.log(`  ${r.antigas} documentos anteriores a ${imp.args.desde} ignorados`);
      if (r.erros.length) falhou = true;
    } catch (err) {
      falhou = true;
      console.log(`  Erro: ${err.message}`);
    }
    console.log('');
  }
  if (!args.aplicar) console.log('Nada foi gravado. Rode novamente com --aplicar.');
  if (falhou) process.exit(1);
}

main().catch((err) => {
  const causa = err.cause ? ` (${err.cause.code || ''} ${err.cause.message || ''})`.replace(/\s+\)/, ')') : '';
  console.error(`\nErro: ${err.message}${causa}`);
  process.exit(1);
});
