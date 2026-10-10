// Gera o DANFE (Documento Auxiliar da NF-e) em PDF a partir do XML autorizado (nfeProc).
// Layout retrato no padrão do Manual de Orientação do Contribuinte: canhoto, emitente, chave com código
// de barras, destinatário, duplicatas, cálculo do imposto, transportador, produtos e dados adicionais.
//
//   const gerarDanfe = require('./danfe');
//   const pdf = await gerarDanfe(xmlString); // Buffer

const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (nome) => ['det', 'dup', 'vol'].includes(nome),
});

const M = 15; // margem
const LARG = 595.28 - 2 * M;
const FIM_PAGINA = 841.89 - M;

const num = (v) => Number(v || 0);
const dinheiro = (v) => num(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantidade = (v) => num(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const data = (dh) => (dh ? String(dh).slice(0, 10).split('-').reverse().join('/') : '');
const hora = (dh) => (dh ? String(dh).slice(11, 19) : '');
const documento = (d) => {
  const s = String(d || '').replace(/\D/g, '');
  if (s.length === 14) return s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (s.length === 11) return s.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return s;
};
const cep = (c) => String(c || '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
const fone = (f) => String(f || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
const chaveFormatada = (c) => String(c).replace(/(\d{4})(?=\d)/g, '$1 ');
const numeroNf = (n) => String(n).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
const MOD_FRETE = { 0: '0-Por conta do Remetente', 1: '1-Por conta do Destinatário', 2: '2-Por conta de Terceiros', 3: '3-Próprio por conta do Remetente', 4: '4-Próprio por conta do Destinatário', 9: '9-Sem Ocorrência de Transporte' };

// Primeiro grupo de um imposto (ex.: ICMS → ICMS00/ICMS10/ICMSSN102…)
const grupo = (imp) => (imp && typeof imp === 'object' ? Object.values(imp).find((v) => v && typeof v === 'object') || {} : {});

class Danfe {
  constructor(nfeProc) {
    this.inf = nfeProc.NFe.infNFe;
    this.prot = nfeProc.protNFe && nfeProc.protNFe.infProt;
    this.chave = String(this.inf['@_Id']).replace(/\D/g, '');
    this.doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true, info: { Title: `DANFE NF-e ${this.inf.ide.nNF}`, Producer: 'automacoes-odoo' } });
  }

  // Caixa com rótulo pequeno em cima e valor embaixo
  campo(x, y, w, h, rotulo, valor, { alinhar = 'left', tamanho = 8, negrito = false } = {}) {
    const d = this.doc;
    d.lineWidth(0.5).rect(x, y, w, h).stroke();
    d.font('Helvetica').fontSize(5.5).fillColor('black').text(rotulo.toUpperCase(), x + 2, y + 1.5, { width: w - 4, lineBreak: false, ellipsis: true });
    d.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(tamanho).text(valor === undefined || valor === null ? '' : String(valor), x + 2, y + h - tamanho - 3, {
      width: w - 4,
      align: alinhar,
      lineBreak: false,
      ellipsis: true,
    });
  }

  // Linha de campos com larguras proporcionais
  linha(y, h, campos) {
    const total = campos.reduce((s, c) => s + c[0], 0);
    let x = M;
    for (const [peso, rotulo, valor, opcoes] of campos) {
      const w = (peso / total) * LARG;
      this.campo(x, y, w, h, rotulo, valor, opcoes);
      x += w;
    }
    return y + h;
  }

  titulo(y, texto) {
    this.doc.font('Helvetica-Bold').fontSize(6.5).text(texto, M, y + 2, { lineBreak: false });
    return y + 10;
  }

  async gerar() {
    this.codigoBarras = await bwipjs.toBuffer({ bcid: 'code128', text: this.chave, scale: 2, height: 12, includetext: false });
    const pedacos = [];
    this.doc.on('data', (c) => pedacos.push(c));
    const fim = new Promise((resolve) => this.doc.on('end', () => resolve(Buffer.concat(pedacos))));

    let y = this.canhoto(M);
    y = this.cabecalho(y);
    y = this.destinatario(y);
    y = this.duplicatas(y);
    y = this.imposto(y);
    y = this.transportador(y);
    y = this.produtos(y);
    this.dadosAdicionais(y);
    this.numerarFolhas();

    this.doc.end();
    return fim;
  }

  canhoto(y) {
    const { emit, ide, dest, total } = this.inf;
    const d = this.doc;
    const h = 46;
    const wDir = 110;
    d.lineWidth(0.5).rect(M, y, LARG - wDir, 22).stroke();
    d.font('Helvetica').fontSize(6).text(
      `RECEBEMOS DE ${emit.xNome} OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA AO LADO. ` +
        `EMISSÃO: ${data(ide.dhEmi)} VALOR TOTAL: R$ ${dinheiro(total.ICMSTot.vNF)} DESTINATÁRIO: ${dest ? dest.xNome : ''}`,
      M + 2, y + 3, { width: LARG - wDir - 4, height: 18 }
    );
    this.campo(M, y + 22, 120, 24, 'Data de recebimento', '');
    this.campo(M + 120, y + 22, LARG - wDir - 120, 24, 'Identificação e assinatura do recebedor', '');
    d.rect(M + LARG - wDir, y, wDir, h).stroke();
    d.font('Helvetica-Bold').fontSize(10).text('NF-e', M + LARG - wDir, y + 6, { width: wDir, align: 'center' });
    d.fontSize(8).text(`Nº ${numeroNf(ide.nNF)}`, M + LARG - wDir, y + 20, { width: wDir, align: 'center' });
    d.text(`SÉRIE ${String(ide.serie).padStart(3, '0')}`, M + LARG - wDir, y + 31, { width: wDir, align: 'center' });
    // linha de corte
    d.dash(3, { space: 2 }).moveTo(M, y + h + 5).lineTo(M + LARG, y + h + 5).stroke().undash();
    return y + h + 10;
  }

  cabecalho(y, continuacao = false) {
    const { emit, ide } = this.inf;
    const e = emit.enderEmit || {};
    const d = this.doc;
    const h = 92;
    const wEmit = 235;
    const wDanfe = 95;
    const xChave = M + wEmit + wDanfe;
    const wChave = LARG - wEmit - wDanfe;

    // Emitente
    d.lineWidth(0.5).rect(M, y, wEmit, h).stroke();
    d.font('Helvetica-Bold').fontSize(10).text(emit.xNome, M + 4, y + 8, { width: wEmit - 8, align: 'center' });
    d.font('Helvetica').fontSize(7).text(
      [
        [e.xLgr, e.nro, e.xCpl].filter(Boolean).join(', '),
        `${e.xBairro || ''} - ${cep(e.CEP)}`,
        `${e.xMun || ''} - ${e.UF || ''}${e.fone ? `  Fone: ${fone(e.fone)}` : ''}`,
      ].join('\n'),
      M + 4, d.y + 4, { width: wEmit - 8, align: 'center' }
    );

    // Identificação do DANFE
    d.rect(M + wEmit, y, wDanfe, h).stroke();
    const xD = M + wEmit;
    d.font('Helvetica-Bold').fontSize(13).text('DANFE', xD, y + 5, { width: wDanfe, align: 'center' });
    d.font('Helvetica').fontSize(6.5).text('Documento Auxiliar da Nota Fiscal Eletrônica', xD + 4, y + 21, { width: wDanfe - 8, align: 'center' });
    d.fontSize(7).text('0 - ENTRADA\n1 - SAÍDA', xD + 8, y + 41, { width: 50 });
    d.rect(xD + 62, y + 41, 16, 16).stroke();
    d.font('Helvetica-Bold').fontSize(11).text(String(ide.tpNF), xD + 62, y + 44, { width: 16, align: 'center' });
    d.fontSize(8).text(`Nº ${numeroNf(ide.nNF)}`, xD, y + 62, { width: wDanfe, align: 'center' });
    d.text(`SÉRIE ${String(ide.serie).padStart(3, '0')}`, xD, y + 72, { width: wDanfe, align: 'center' });
    this.posFolha = this.posFolha || [];
    this.posFolha.push({ pagina: this.doc.bufferedPageRange().count - 1, x: xD, y: y + 82, w: wDanfe });

    // Código de barras e chave
    d.rect(xChave, y, wChave, 38).stroke();
    d.image(this.codigoBarras, xChave + 8, y + 5, { width: wChave - 16, height: 28 });
    this.campo(xChave, y + 38, wChave, 22, 'Chave de acesso', chaveFormatada(this.chave), { alinhar: 'center', tamanho: 7.5, negrito: true });
    d.rect(xChave, y + 60, wChave, h - 60).stroke();
    d.font('Helvetica').fontSize(7).text('Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora', xChave + 4, y + 65, {
      width: wChave - 8,
      align: 'center',
    });
    y += h;
    if (continuacao) return y + 4;

    const protocolo = this.prot ? `${this.prot.nProt} - ${data(this.prot.dhRecbto)} ${hora(this.prot.dhRecbto)}` : '';
    y = this.linha(y, 20, [[60, 'Natureza da operação', ide.natOp], [40, 'Protocolo de autorização de uso', protocolo, { alinhar: 'center' }]]);
    y = this.linha(y, 20, [
      [34, 'Inscrição estadual', emit.IE],
      [33, 'Inscrição estadual do subst. trib.', emit.IEST],
      [33, 'CNPJ / CPF', documento(emit.CNPJ || emit.CPF)],
    ]);
    return y + 2;
  }

  destinatario(y) {
    const { dest, ide } = this.inf;
    if (!dest) return y;
    const e = dest.enderDest || {};
    y = this.titulo(y, 'DESTINATÁRIO / REMETENTE');
    y = this.linha(y, 20, [[60, 'Nome / Razão social', dest.xNome], [25, 'CNPJ / CPF', documento(dest.CNPJ || dest.CPF)], [15, 'Data da emissão', data(ide.dhEmi)]]);
    y = this.linha(y, 20, [
      [50, 'Endereço', [e.xLgr, e.nro, e.xCpl].filter(Boolean).join(', ')],
      [25, 'Bairro / Distrito', e.xBairro],
      [10, 'CEP', cep(e.CEP)],
      [15, 'Data da saída/entrada', data(ide.dhSaiEnt)],
    ]);
    y = this.linha(y, 20, [
      [35, 'Município', e.xMun],
      [6, 'UF', e.UF],
      [19, 'Fone / Fax', fone(e.fone)],
      [25, 'Inscrição estadual', dest.IE],
      [15, 'Hora da saída/entrada', hora(ide.dhSaiEnt)],
    ]);
    return y + 2;
  }

  duplicatas(y) {
    const dups = (this.inf.cobr && this.inf.cobr.dup) || [];
    if (!dups.length) return y;
    y = this.titulo(y, 'FATURA / DUPLICATAS');
    const porLinha = 6;
    const w = LARG / porLinha;
    for (let i = 0; i < dups.length; i += porLinha) {
      dups.slice(i, i + porLinha).forEach((dup, j) => {
        const x = M + j * w;
        this.doc.lineWidth(0.5).rect(x, y, w, 26).stroke();
        this.doc.font('Helvetica').fontSize(6.5).text(`Número: ${dup.nDup}\nVencimento: ${data(dup.dVenc)}\nValor: R$ ${dinheiro(dup.vDup)}`, x + 3, y + 2, { width: w - 6 });
      });
      y += 26;
    }
    return y + 2;
  }

  imposto(y) {
    const t = this.inf.total.ICMSTot;
    y = this.titulo(y, 'CÁLCULO DO IMPOSTO');
    const dir = { alinhar: 'right' };
    y = this.linha(y, 20, [
      [1, 'Base de cálc. do ICMS', dinheiro(t.vBC), dir],
      [1, 'Valor do ICMS', dinheiro(t.vICMS), dir],
      [1, 'Base de cálc. ICMS S.T.', dinheiro(t.vBCST), dir],
      [1, 'Valor do ICMS subst.', dinheiro(t.vST), dir],
      [1, 'V. imp. importação', dinheiro(t.vII), dir],
      [1, 'Valor do PIS', dinheiro(t.vPIS), dir],
      [1.2, 'V. total produtos', dinheiro(t.vProd), dir],
    ]);
    y = this.linha(y, 20, [
      [1, 'Valor do frete', dinheiro(t.vFrete), dir],
      [1, 'Valor do seguro', dinheiro(t.vSeg), dir],
      [1, 'Desconto', dinheiro(t.vDesc), dir],
      [1, 'Outras despesas', dinheiro(t.vOutro), dir],
      [1, 'Valor total IPI', dinheiro(t.vIPI), dir],
      [1, 'Valor da COFINS', dinheiro(t.vCOFINS), dir],
      [1.2, 'V. total da nota', dinheiro(t.vNF), { alinhar: 'right', negrito: true }],
    ]);
    return y + 2;
  }

  transportador(y) {
    const tr = this.inf.transp || {};
    const ta = tr.transporta || {};
    const vol = (tr.vol || [])[0] || {};
    const veic = tr.veicTransp || {};
    y = this.titulo(y, 'TRANSPORTADOR / VOLUMES TRANSPORTADOS');
    y = this.linha(y, 20, [
      [30, 'Nome / Razão social', ta.xNome],
      [18, 'Frete por conta', MOD_FRETE[tr.modFrete] || tr.modFrete],
      [10, 'Código ANTT', veic.RNTC],
      [12, 'Placa do veículo', veic.placa],
      [5, 'UF', veic.UF],
      [18, 'CNPJ / CPF', documento(ta.CNPJ || ta.CPF)],
    ]);
    y = this.linha(y, 20, [[45, 'Endereço', ta.xEnder], [30, 'Município', ta.xMun], [5, 'UF', ta.UF], [20, 'Inscrição estadual', ta.IE]]);
    y = this.linha(y, 20, [
      [12, 'Quantidade', vol.qVol],
      [22, 'Espécie', vol.esp],
      [18, 'Marca', vol.marca],
      [16, 'Numeração', vol.nVol],
      [16, 'Peso bruto', vol.pesoB ? quantidade(vol.pesoB) : ''],
      [16, 'Peso líquido', vol.pesoL ? quantidade(vol.pesoL) : ''],
    ]);
    return y + 2;
  }

  colunas() {
    // [rótulo, largura, alinhamento]
    return [
      ['CÓDIGO', 48, 'left'],
      ['DESCRIÇÃO DO PRODUTO / SERVIÇO', 154, 'left'],
      ['NCM/SH', 36, 'center'],
      ['CST', 20, 'center'],
      ['CFOP', 22, 'center'],
      ['UN', 18, 'center'],
      ['QUANT', 38, 'right'],
      ['V.UNIT', 40, 'right'],
      ['V.TOTAL', 42, 'right'],
      ['BC ICMS', 40, 'right'],
      ['V.ICMS', 34, 'right'],
      ['V.IPI', 30, 'right'],
      ['%ICMS', 23, 'right'],
      ['%IPI', 20, 'right'],
    ];
  }

  cabecalhoProdutos(y) {
    const d = this.doc;
    y = this.titulo(y, 'DADOS DOS PRODUTOS / SERVIÇOS');
    let x = M;
    for (const [rotulo, w] of this.colunas()) {
      d.lineWidth(0.5).rect(x, y, w, 12).stroke();
      d.font('Helvetica-Bold').fontSize(5.5).text(rotulo, x + 1, y + 3.5, { width: w - 2, align: 'center', lineBreak: false });
      x += w;
    }
    return y + 12;
  }

  novaPagina() {
    this.doc.addPage();
    const y = this.cabecalho(M, true);
    return this.cabecalhoProdutos(y);
  }

  produtos(y) {
    const d = this.doc;
    y = this.cabecalhoProdutos(y);
    const cols = this.colunas();
    for (const det of this.inf.det) {
      const p = det.prod;
      const icms = grupo(det.imposto && det.imposto.ICMS);
      const ipi = (det.imposto && det.imposto.IPI && det.imposto.IPI.IPITrib) || {};
      const descricao = p.xProd + (det.infAdProd ? `\n${det.infAdProd}` : '');
      const valores = [
        p.cProd,
        descricao,
        p.NCM,
        `${icms.orig || ''}${icms.CST || icms.CSOSN || ''}`,
        p.CFOP,
        p.uCom,
        quantidade(p.qCom),
        quantidade(p.vUnCom),
        dinheiro(p.vProd),
        dinheiro(icms.vBC),
        dinheiro(icms.vICMS),
        dinheiro(ipi.vIPI),
        icms.pICMS ? dinheiro(icms.pICMS) : '',
        ipi.pIPI ? dinheiro(ipi.pIPI) : '',
      ];
      d.font('Helvetica').fontSize(6);
      const h = Math.max(...valores.map((v, i) => d.heightOfString(String(v || ''), { width: cols[i][1] - 3 }))) + 4;
      if (y + h > FIM_PAGINA - 10) y = this.novaPagina();
      d.font('Helvetica').fontSize(6);
      let x = M;
      valores.forEach((v, i) => {
        const [, w, alinhar] = cols[i];
        d.lineWidth(0.3).rect(x, y, w, h).stroke();
        d.text(String(v || ''), x + 1.5, y + 2, { width: w - 3, align: alinhar });
        x += w;
      });
      y += h;
    }
    return y + 2;
  }

  dadosAdicionais(y) {
    const d = this.doc;
    const adic = this.inf.infAdic || {};
    const texto = [adic.infAdFisco && `Inf. do fisco: ${adic.infAdFisco}`, adic.infCpl].filter(Boolean).join('\n');
    d.font('Helvetica').fontSize(6.5);
    const h = Math.max(50, d.heightOfString(texto, { width: LARG * 0.7 - 6 }) + 14);
    if (y + 10 + h > FIM_PAGINA) y = this.novaPagina();
    y = this.titulo(y, 'DADOS ADICIONAIS');
    d.lineWidth(0.5).rect(M, y, LARG * 0.7, h).stroke();
    d.fontSize(5.5).text('INFORMAÇÕES COMPLEMENTARES', M + 2, y + 1.5);
    d.fontSize(6.5).text(texto, M + 3, y + 9, { width: LARG * 0.7 - 6 });
    d.rect(M + LARG * 0.7, y, LARG * 0.3, h).stroke();
    d.fontSize(5.5).text('RESERVADO AO FISCO', M + LARG * 0.7 + 2, y + 1.5);
  }

  numerarFolhas() {
    const total = this.doc.bufferedPageRange().count;
    for (const { pagina, x, y, w } of this.posFolha) {
      this.doc.switchToPage(pagina);
      this.doc.font('Helvetica').fontSize(7).text(`FOLHA ${pagina + 1}/${total}`, x, y, { width: w, align: 'center', lineBreak: false });
    }
  }
}

module.exports = async function gerarDanfe(xml) {
  const dados = parser.parse(xml);
  if (!dados.nfeProc) throw new Error('XML sem nfeProc: o DANFE só é gerado de NF-e autorizada.');
  return new Danfe(dados.nfeProc).gerar();
};
