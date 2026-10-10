// Importa para o Odoo, como fatura de fornecedor em rascunho, toda NF-e emitida contra o CNPJ das empresas.
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

const TIPO_DOC_NFE = '55';
const MAX_LOTES = 20; // 50 documentos por lote

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
const reais = (v) => num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarCnpj = (c) => (c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'));
const chaveDoc = (doc) => (doc.tipo === 'resNFe' ? doc.dados.resNFe.chNFe : doc.tipo === 'procNFe' ? digitos(doc.dados.nfeProc.NFe.infNFe['@_Id']) : null);
const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class Importador {
  constructor(odoo, empresa, sefaz, args) {
    this.odoo = odoo;
    this.empresa = empresa;
    this.sefaz = sefaz;
    this.args = args;
    this.cnpj = digitos(empresa.vat);
    this.resumo = { criadas: [], ciencia: [], ignoradas: [], cancelamentos: [], erros: [] };
    this.canceladas = new Set();
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
    const agora = Date.now();
    const proxima = Number((await this.param('proxima')) || 0);
    if (proxima > agora) {
      console.log(`  Aguardando a janela da SEFAZ: próxima consulta permitida às ${new Date(proxima).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      return this.resumo;
    }
    this.pendentes = new Set(JSON.parse((await this.param('pendentes')) || '[]'));
    if (this.args.aplicar) await this.reprocessarPendentes();
    let ultNSU = (await this.param('ult_nsu')) || '0';
    for (let lote = 0; lote < MAX_LOTES; lote++) {
      const r = await this.sefaz.distribuicao(ultNSU);
      if (r.cStat === '137') {
        console.log(`  SEFAZ: ${r.xMotivo} (NSU ${Number(r.ultNSU)})`);
        await this.param('proxima', Date.now() + 61 * 60 * 1000);
        break;
      }
      if (r.cStat === '656') {
        // Consumo indevido: a SEFAZ bloqueia o CNPJ por 1 hora
        console.log(`  SEFAZ pediu para aguardar 1 hora: ${r.xMotivo}`);
        await this.param('proxima', Date.now() + 61 * 60 * 1000);
        break;
      }
      if (r.cStat !== '138') throw new Error(`SEFAZ recusou a consulta: ${r.cStat} – ${r.xMotivo}`);
      console.log(`  Lote: ${r.documentos.length} documentos (NSU ${Number(ultNSU)} → ${Number(r.ultNSU)} de ${Number(r.maxNSU)})`);
      // Notas canceladas no mesmo lote não viram fatura
      for (const doc of r.documentos) {
        const ev = doc.tipo === 'resEvento' ? doc.dados.resEvento : doc.tipo === 'procEventoNFe' ? doc.dados.procEventoNFe.evento.infEvento : null;
        if (ev && String(ev.tpEvento) === '110111') this.canceladas.add(ev.chNFe);
        if (doc.tipo === 'resNFe' && doc.dados.resNFe.cSitNFe === '3') this.canceladas.add(doc.dados.resNFe.chNFe);
      }
      for (const doc of r.documentos) {
        try {
          await this.documento(doc);
        } catch (err) {
          this.resumo.erros.push(`NSU ${Number(doc.nsu)} (${doc.tipo}): ${err.message}`);
          const chave = chaveDoc(doc);
          if (chave) this.pendentes.add(chave);
        }
      }
      ultNSU = r.ultNSU;
      await this.param('ult_nsu', ultNSU);
      if (r.ultNSU === r.maxNSU) {
        // Já está em dia: a SEFAZ pede 1 hora antes da próxima consulta
        await this.param('proxima', Date.now() + 61 * 60 * 1000);
        break;
      }
    }
    await this.param('pendentes', JSON.stringify([...this.pendentes]));
    return this.resumo;
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
    if (doc.tipo === 'procEventoNFe') return this.evento(doc.dados.procEventoNFe.evento.infEvento);
    this.resumo.ignoradas.push(`NSU ${Number(doc.nsu)}: documento ${doc.schema} não tratado`);
  }

  antesDoInicio(dhEmi) {
    return this.args.desde && String(dhEmi).slice(0, 10) < this.args.desde;
  }

  async resumoNfe(res) {
    const rotulo = `${res.xNome} – ${reais(res.vNF)} (chave ${res.chNFe})`;
    if (this.antesDoInicio(res.dhEmi)) return this.resumo.ignoradas.push(`${rotulo}: emitida antes de ${this.args.desde}`);
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
      this.resumo.ciencia.push(`${rotulo}: XML completo chega na próxima consulta`);
      this.pendentes.delete(chave);
    } else {
      this.resumo.erros.push(`Ciência de ${rotulo}: ${r.cStat} – ${r.xMotivo}`);
      this.pendentes.add(chave);
    }
  }

  async evento(ev) {
    if (String(ev.tpEvento) !== '110111') return; // só cancelamento interessa
    const chave = ev.chNFe;
    const fatura = await this.faturaExistente(chave, chave.substr(6, 14), chave.substr(25, 9));
    const texto = `NF-e ${chave} cancelada pelo emitente`;
    if (!fatura) return;
    this.resumo.cancelamentos.push(`${texto}: fatura ${fatura.name} (${fatura.state}) precisa ser revista`);
    if (this.args.aplicar) {
      await this.odoo.call('account.move', 'message_post', {
        ids: [fatura.id],
        body: `<p><b>Atenção:</b> a SEFAZ informou que a NF-e ${chave} foi <b>cancelada pelo emitente</b>. Revise ou cancele esta fatura.</p>`,
        body_is_html: true,
        message_type: 'comment',
        subtype_xmlid: 'mail.mt_note',
      });
      await this.odoo.call('account.move', 'activity_schedule', {
        ids: [fatura.id],
        act_type_xmlid: 'mail.mail_activity_data_todo',
        summary: 'NF-e cancelada pelo fornecedor',
      });
    }
  }

  async nfeCompleta(doc) {
    const nfe = doc.dados.nfeProc.NFe.infNFe;
    const chave = digitos(nfe['@_Id']);
    const { ide, emit, dest, total, cobr } = nfe;
    const tot = total.ICMSTot;
    const cnpjEmit = emit.CNPJ || emit.CPF;
    const rotulo = `NF-e ${ide.nNF} – ${emit.xNome} – ${reais(tot.vNF)}`;

    if (this.antesDoInicio(ide.dhEmi)) return this.resumo.ignoradas.push(`${rotulo}: emitida antes de ${this.args.desde}`);
    if (this.canceladas.has(chave)) return this.resumo.ignoradas.push(`${rotulo}: cancelada pelo emitente`);
    if (digitos(dest && (dest.CNPJ || dest.CPF)) !== this.cnpj) return this.resumo.ignoradas.push(`${rotulo}: a empresa não é a destinatária (transporte ou autorização de XML)`);
    if (ide.tpNF !== '1') return this.resumo.ignoradas.push(`${rotulo}: nota de entrada emitida pelo próprio fornecedor`);
    if (ide.finNFe === '4') return this.resumo.ignoradas.push(`${rotulo}: devolução de cliente — lançar como nota de crédito de venda`);
    const existente = await this.faturaExistente(chave, cnpjEmit, ide.nNF);
    if (existente) return this.resumo.ignoradas.push(`${rotulo}: já lançada (${existente.name})`);

    const parceiro = await this.fornecedor(emit);
    const linhas = [];
    let semProduto = 0;
    for (const det of nfe.det) {
      const p = det.prod;
      const produto = parceiro.id ? await this.produto(parceiro.id, p) : null;
      if (!produto) semProduto++;
      const bruto = num(p.vProd);
      linhas.push({
        product_id: produto || false,
        name: `[${p.cProd}] ${p.xProd}`,
        quantity: num(p.qCom),
        price_unit: num(p.vUnCom),
        discount: bruto && num(p.vDesc) ? Math.round((num(p.vDesc) / bruto) * 1e6) / 1e4 : 0,
      });
    }
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
    if (dups.length) fatura.invoice_date_due = dups[0].dVenc;

    const avisos = [];
    if (parceiro.novo) avisos.push('Fornecedor cadastrado automaticamente a partir do XML: confira regime tributário e setor de atividade.');
    if (semProduto) avisos.push(`${semProduto} de ${nfe.det.length} itens sem produto vinculado no Odoo.`);

    if (!this.args.aplicar) {
      this.resumo.criadas.push(`${rotulo} (simulação)${avisos.length ? ` — ${avisos.join(' ')}` : ''}`);
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
    const [criada] = await this.odoo.call('account.move', 'read', { ids: [id], fields: ['name', 'amount_total'] });

    const impostos = [['vICMS', 'ICMS'], ['vST', 'ICMS-ST'], ['vFCPST', 'FCP-ST'], ['vIPI', 'IPI'], ['vPIS', 'PIS'], ['vCOFINS', 'COFINS']]
      .filter(([c]) => num(tot[c]))
      .map(([c, n]) => `${n} ${reais(tot[c])}`);
    const diferenca = Math.round((num(tot.vNF) - criada.amount_total) * 100) / 100;
    if (diferenca) avisos.push(`Total do rascunho (${reais(criada.amount_total)}) difere do total da NF-e em ${reais(diferenca)}: confira impostos (ex.: ICMS-ST, IPI) antes de confirmar.`);
    const corpo =
      `<p>Importada automaticamente da SEFAZ (Distribuição DF-e).</p>` +
      `<ul><li>Chave: ${chave}</li><li>Emitida em ${String(ide.dhEmi).slice(0, 10).split('-').reverse().join('/')} – natureza: ${escapar(ide.natOp)}</li>` +
      `<li>Produtos ${reais(tot.vProd)} | Desconto ${reais(tot.vDesc)} | <b>Total da NF-e ${reais(tot.vNF)}</b></li>` +
      (impostos.length ? `<li>Impostos destacados: ${impostos.join(' | ')}</li>` : '') +
      (dups.length ? `<li>Duplicatas: ${dups.map((d) => `${d.dVenc.split('-').reverse().join('/')} ${reais(d.vDup)}`).join(' | ')}</li>` : '') +
      `</ul>` +
      (avisos.length ? `<p><b>Revisar:</b></p><ul>${avisos.map((a) => `<li>${escapar(a)}</li>`).join('')}</ul>` : '');
    await this.odoo.call('account.move', 'message_post', { ids: [id], body: corpo, body_is_html: true, message_type: 'comment', subtype_xmlid: 'mail.mt_note' });
    this.resumo.criadas.push(`${rotulo} → ${criada.name || `rascunho #${id}`}${avisos.length ? ` — ${avisos.join(' ')}` : ''}`);
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
    const porCodigo = await this.odoo.searchRead('product.product', [['default_code', '=', p.cProd]], ['id'], { limit: 2 });
    return porCodigo.length === 1 ? porCodigo[0].id : null;
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
      const sefaz = new SefazClient({ cnpj, uf: estado.code });
      const validade = sefaz.certificado.validoAte;
      const dias = Math.floor((validade - Date.now()) / 86400000);
      console.log(`  Certificado: ${sefaz.certificado.titular} — válido até ${validade.toLocaleDateString('pt-BR')}${dias < 30 ? ` ⚠ vence em ${dias} dias` : ''}`);

      const imp = new Importador(odoo, { ...empresa, diarioCompras: diario.id, tipoDocNfe: tipoDoc.id }, sefaz, args);
      const r = await imp.processar();
      const bloco = (titulo, itens) => itens.length && console.log(`  ${titulo} (${itens.length}):\n${itens.map((i) => `    - ${i}`).join('\n')}`);
      bloco(args.aplicar ? 'Faturas criadas' : 'Faturas a criar', r.criadas);
      bloco(args.aplicar ? 'Ciência enviada' : 'Ciência a enviar', r.ciencia);
      bloco('Cancelamentos', r.cancelamentos);
      bloco('Ignoradas', r.ignoradas);
      bloco('Erros', r.erros);
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
