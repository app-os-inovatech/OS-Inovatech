// Gera o DACTE (Documento Auxiliar do Conhecimento de Transporte Eletrônico) em PDF a partir do XML
// autorizado (cteProc). Layout retrato: emitente, identificação do CT-e, chave com código de barras,
// protocolo, prestação (origem/destino), partes (remetente, destinatário, expedidor, recebedor, tomador),
// carga, componentes do valor, ICMS, documentos originários e observações.
//
//   const gerarDacte = require('./dacte');
//   const pdf = await gerarDacte(xmlString); // Buffer

const { XMLParser } = require('fast-xml-parser');
const { DocumentoPdf, M, LARG, FIM_PAGINA, dinheiro, quantidade, data, hora, documento, cep, fone, numeroDoc, lista, grupo } = require('./pdfFiscal');

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true, parseTagValue: false });

const MODAL = { '01': 'RODOVIÁRIO', '02': 'AÉREO', '03': 'AQUAVIÁRIO', '04': 'FERROVIÁRIO', '05': 'DUTOVIÁRIO', '06': 'MULTIMODAL' };
const TIPO_CTE = { 0: 'NORMAL', 1: 'COMPLEMENTAR', 2: 'ANULAÇÃO', 3: 'SUBSTITUTO' };
const TIPO_SERV = { 0: 'NORMAL', 1: 'SUBCONTRATAÇÃO', 2: 'REDESPACHO', 3: 'REDESPACHO INTERMEDIÁRIO', 4: 'SERVIÇO VINCULADO A MULTIMODAL' };
const TOMADOR = { 0: 'REMETENTE', 1: 'EXPEDIDOR', 2: 'RECEBEDOR', 3: 'DESTINATÁRIO', 4: 'OUTROS' };
const UNIDADE = { '00': 'M3', '01': 'KG', '02': 'TON', '03': 'UNIDADE', '04': 'LITROS', '05': 'MMBTU' };

class Dacte extends DocumentoPdf {
  constructor(cteProc) {
    super(`DACTE CT-e ${cteProc.CTe.infCte.ide.nCT}`, cteProc.CTe.infCte['@_Id']);
    this.inf = cteProc.CTe.infCte;
    this.prot = cteProc.protCTe && cteProc.protCTe.infProt;
  }

  async gerar() {
    const fim = this.iniciar();
    await this.codigoPronto;
    let y = this.cabecalho(M);
    y = this.prestacao(y);
    y = this.partes(y);
    y = this.carga(y);
    y = this.valores(y);
    y = this.imposto(y);
    y = this.documentos(y);
    this.observacoes(y);
    this.numerarFolhas();
    this.doc.end();
    return fim;
  }

  cabecalho(y) {
    const { emit, ide } = this.inf;
    const d = this.doc;
    const h = 92;
    const wEmit = 235;
    const wId = 95;
    this.blocoEmitente(M, y, wEmit, h, emit, emit.enderEmit);

    const xI = M + wEmit;
    d.lineWidth(0.5).rect(xI, y, wId, h).stroke();
    d.font('Helvetica-Bold').fontSize(13).text('DACTE', xI, y + 5, { width: wId, align: 'center' });
    d.font('Helvetica').fontSize(6.5).text('Documento Auxiliar do Conhecimento de Transporte Eletrônico', xI + 4, y + 21, { width: wId - 8, align: 'center' });
    d.font('Helvetica-Bold').fontSize(7.5).text(`MODAL ${MODAL[ide.modal] || ide.modal}`, xI, y + 46, { width: wId, align: 'center' });
    d.fontSize(8).text(`Nº ${numeroDoc(ide.nCT)}`, xI, y + 57, { width: wId, align: 'center' });
    d.text(`SÉRIE ${String(ide.serie).padStart(3, '0')}  MOD. ${ide.mod}`, xI, y + 68, { width: wId, align: 'center' });
    this.marcarFolha(xI, y + 81, wId);

    this.blocoChave(xI + wId, y, LARG - wEmit - wId, h, 'Consulta de autenticidade no portal nacional do CT-e www.cte.fazenda.gov.br/portal ou no site da Sefaz Autorizadora');
    y += h;

    const protocolo = this.prot ? `${this.prot.nProt} - ${data(this.prot.dhRecbto)} ${hora(this.prot.dhRecbto)}` : '';
    y = this.linha(y, 20, [
      [18, 'Tipo do CT-e', TIPO_CTE[ide.tpCTe] || ide.tpCTe],
      [24, 'Tipo do serviço', TIPO_SERV[ide.tpServ] || ide.tpServ],
      [18, 'Data e hora de emissão', `${data(ide.dhEmi)} ${hora(ide.dhEmi)}`],
      [40, 'Protocolo de autorização de uso', protocolo, { alinhar: 'center' }],
    ]);
    y = this.linha(y, 20, [[55, 'CFOP - Natureza da prestação', `${ide.CFOP} - ${ide.natOp}`, { tamanho: 7 }], [45, 'Tomador do serviço', this.nomeTomador(), { tamanho: 7 }]]);
    return y + 2;
  }

  // Quem paga o frete
  tomador() {
    const { ide } = this.inf;
    if (this.inf.toma) return { tipo: 4, parte: this.inf.toma };
    if (ide.toma4) return { tipo: 4, parte: ide.toma4 };
    const t = (ide.toma3 || ide.toma03 || {}).toma;
    return { tipo: t, parte: { 0: this.inf.rem, 1: this.inf.exped, 2: this.inf.receb, 3: this.inf.dest }[t] || {} };
  }

  nomeTomador() {
    const { tipo, parte } = this.tomador();
    return `${TOMADOR[tipo] || ''}${parte && parte.xNome ? ` - ${parte.xNome}` : ''}`;
  }

  prestacao(y) {
    const { ide } = this.inf;
    return (
      this.linha(y, 20, [
        [50, 'Início da prestação', `${ide.xMunIni} - ${ide.UFIni}`],
        [50, 'Término da prestação', `${ide.xMunFim} - ${ide.UFFim}`],
      ]) + 2
    );
  }

  // Bloco de uma parte (remetente, destinatário…) ocupando metade da largura
  parte(x, y, w, titulo, p, enderecoTag) {
    const d = this.doc;
    const h = 52;
    d.lineWidth(0.5).rect(x, y, w, h).stroke();
    d.font('Helvetica').fontSize(5.5).text(titulo, x + 2, y + 1.5);
    if (!p) return h;
    const e = p[enderecoTag] || p.enderToma || {};
    const linhas = [
      p.xNome,
      [e.xLgr, e.nro, e.xCpl].filter(Boolean).join(', ') + (e.xBairro ? ` - ${e.xBairro}` : ''),
      `${e.xMun || ''} - ${e.UF || ''}   CEP: ${cep(e.CEP)}`,
      `CNPJ/CPF: ${documento(p.CNPJ || p.CPF)}   IE: ${p.IE || ''}`,
      p.fone ? `Fone: ${fone(p.fone)}` : '',
    ].filter(Boolean);
    d.font('Helvetica-Bold').fontSize(7).text(linhas[0] || '', x + 3, y + 9, { width: w - 6, lineBreak: false, ellipsis: true });
    d.font('Helvetica').fontSize(6.5).text(linhas.slice(1).join('\n'), x + 3, y + 18, { width: w - 6, height: h - 19, ellipsis: true });
    return h;
  }

  partes(y) {
    const w = LARG / 2;
    const { rem, dest, exped, receb } = this.inf;
    let h = this.parte(M, y, w, 'REMETENTE', rem, 'enderReme');
    this.parte(M + w, y, w, 'DESTINATÁRIO', dest, 'enderDest');
    y += h;
    h = this.parte(M, y, w, 'EXPEDIDOR', exped, 'enderExped');
    this.parte(M + w, y, w, 'RECEBEDOR', receb, 'enderReceb');
    y += h;
    const { tipo, parte } = this.tomador();
    if (String(tipo) === '4') y += this.parte(M, y, LARG, 'TOMADOR DO SERVIÇO', parte, 'enderToma');
    return y + 2;
  }

  carga(y) {
    const norm = this.inf.infCTeNorm || {};
    const c = norm.infCarga || {};
    const qtds = lista(c.infQ).map((q) => `${q.tpMed || UNIDADE[q.cUnid] || ''}: ${quantidade(q.qCarga)} ${UNIDADE[q.cUnid] || ''}`.trim());
    y = this.linha(y, 20, [
      [40, 'Produto predominante', c.proPred],
      [30, 'Outras características da carga', c.xOutCat],
      [30, 'Valor total da carga', dinheiro(c.vCarga), { alinhar: 'right' }],
    ]);
    if (qtds.length) y = this.linha(y, 20, qtds.slice(0, 4).map((q) => [1, 'Quantidade da carga', q]));
    return y + 2;
  }

  valores(y) {
    const d = this.doc;
    const p = this.inf.vPrest;
    y = this.titulo(y, 'COMPONENTES DO VALOR DA PRESTAÇÃO DO SERVIÇO');
    const comps = lista(p.Comp);
    const porLinha = 4;
    const wComp = (LARG * 0.7) / porLinha;
    const linhas = Math.max(1, Math.ceil(comps.length / porLinha));
    const h = Math.max(40, linhas * 14 + 4);
    d.lineWidth(0.5).rect(M, y, LARG * 0.7, h).stroke();
    comps.forEach((c, i) => {
      const x = M + (i % porLinha) * wComp;
      const yy = y + 3 + Math.floor(i / porLinha) * 14;
      d.font('Helvetica').fontSize(6.5).text(c.xNome, x + 3, yy, { width: wComp * 0.6, lineBreak: false, ellipsis: true });
      d.text(dinheiro(c.vComp), x + wComp * 0.6, yy, { width: wComp * 0.4 - 4, align: 'right', lineBreak: false });
    });
    const xT = M + LARG * 0.7;
    const wT = LARG * 0.3;
    this.campo(xT, y, wT, h / 2, 'Valor total do serviço', dinheiro(p.vTPrest), { alinhar: 'right', negrito: true });
    this.campo(xT, y + h / 2, wT, h / 2, 'Valor a receber', dinheiro(p.vRec), { alinhar: 'right', negrito: true });
    return y + h + 2;
  }

  imposto(y) {
    const imp = this.inf.imp || {};
    const icms = grupo(imp.ICMS);
    const cst = icms.CST || (icms.indSN ? 'SIMPLES NACIONAL' : '');
    y = this.titulo(y, 'INFORMAÇÕES RELATIVAS AO IMPOSTO');
    const dir = { alinhar: 'right' };
    return (
      this.linha(y, 20, [
        [28, 'Situação tributária', cst],
        [18, 'Base de cálculo', dinheiro(icms.vBC || icms.vBCOutraUF), dir],
        [12, 'Alíq. ICMS', icms.pICMS || icms.pICMSOutraUF ? dinheiro(icms.pICMS || icms.pICMSOutraUF) : '', dir],
        [18, 'Valor do ICMS', dinheiro(icms.vICMS || icms.vICMSOutraUF), dir],
        [12, '% Red. BC', icms.pRedBC ? dinheiro(icms.pRedBC) : '', dir],
        [12, 'ICMS ST', dinheiro(icms.vICMSSTRet), dir],
      ]) + 2
    );
  }

  documentos(y) {
    const d = this.doc;
    const doc = (this.inf.infCTeNorm && this.inf.infCTeNorm.infDoc) || {};
    const itens = [
      ...lista(doc.infNFe).map((n) => ['NF-E', n.chave]),
      ...lista(doc.infNF).map((n) => ['NF', `${documento(n.mod)} Série ${n.serie} Nº ${n.nDoc}`]),
      ...lista(doc.infOutros).map((o) => ['OUTROS', `${o.descOutros || o.tpDoc} ${o.nDoc || ''}`]),
    ];
    if (!itens.length) return y;
    y = this.titulo(y, 'DOCUMENTOS ORIGINÁRIOS');
    const w = LARG / 2;
    for (let i = 0; i < itens.length; i += 2) {
      if (y + 12 > FIM_PAGINA - 40) {
        d.addPage();
        y = M;
      }
      itens.slice(i, i + 2).forEach(([tipo, texto], j) => {
        const x = M + j * w;
        d.lineWidth(0.3).rect(x, y, w, 12).stroke();
        d.font('Helvetica-Bold').fontSize(6.5).text(tipo, x + 3, y + 3, { width: 40, lineBreak: false });
        d.font('Helvetica').text(String(texto), x + 40, y + 3, { width: w - 44, lineBreak: false, ellipsis: true });
      });
      y += 12;
    }
    return y + 2;
  }

  observacoes(y) {
    const d = this.doc;
    const compl = this.inf.compl || {};
    const fisco = this.inf.imp && this.inf.imp.infAdFisco;
    const rntrc = this.inf.infCTeNorm && this.inf.infCTeNorm.infModal && this.inf.infCTeNorm.infModal.rodo && this.inf.infCTeNorm.infModal.rodo.RNTRC;
    const texto = [compl.xObs, fisco && `Inf. do fisco: ${fisco}`, rntrc && `RNTRC da empresa: ${rntrc}`].filter(Boolean).join('\n');
    d.font('Helvetica').fontSize(6.5);
    const h = Math.max(40, d.heightOfString(texto, { width: LARG - 6 }) + 14);
    if (y + 10 + h > FIM_PAGINA) {
      d.addPage();
      y = M;
    }
    y = this.titulo(y, 'OBSERVAÇÕES');
    d.lineWidth(0.5).rect(M, y, LARG, h).stroke();
    d.fontSize(6.5).text(texto, M + 3, y + 4, { width: LARG - 6 });
  }
}

module.exports = async function gerarDacte(xml) {
  const dados = parser.parse(xml);
  if (!dados.cteProc) throw new Error('XML sem cteProc: o DACTE só é gerado de CT-e autorizado.');
  return new Dacte(dados.cteProc).gerar();
};
