// Gera o DANFE (Documento Auxiliar da NF-e) em PDF a partir do XML autorizado (nfeProc).
// Layout retrato no padrão do Manual de Orientação do Contribuinte: canhoto, emitente, chave com código
// de barras, destinatário, duplicatas, cálculo do imposto, transportador, produtos e dados adicionais.
//
//   const gerarDanfe = require('./danfe');
//   const pdf = await gerarDanfe(xmlString); // Buffer

const { XMLParser } = require('fast-xml-parser');
const { DocumentoPdf, M, LARG, FIM_PAGINA, dinheiro, quantidade, data, hora, documento, cep, fone, numeroDoc: numeroNf, grupo } = require('./pdfFiscal');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (nome) => ['det', 'dup', 'vol'].includes(nome),
});

const MOD_FRETE = { 0: '0-Por conta do Remetente', 1: '1-Por conta do Destinatário', 2: '2-Por conta de Terceiros', 3: '3-Próprio por conta do Remetente', 4: '4-Próprio por conta do Destinatário', 9: '9-Sem Ocorrência de Transporte' };

class Danfe extends DocumentoPdf {
  constructor(nfeProc) {
    super(`DANFE NF-e ${nfeProc.NFe.infNFe.ide.nNF}`, nfeProc.NFe.infNFe['@_Id']);
    this.inf = nfeProc.NFe.infNFe;
    this.prot = nfeProc.protNFe && nfeProc.protNFe.infProt;
  }

  async gerar() {
    const fim = this.iniciar();
    await this.codigoPronto;

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
    const d = this.doc;
    const h = 92;
    const wEmit = 235;
    const wDanfe = 95;
    const xChave = M + wEmit + wDanfe;
    const wChave = LARG - wEmit - wDanfe;

    this.blocoEmitente(M, y, wEmit, h, emit, emit.enderEmit);

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
    this.marcarFolha(xD, y + 82, wDanfe);

    this.blocoChave(xChave, y, wChave, h, 'Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora');
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


}

module.exports = async function gerarDanfe(xml) {
  const dados = parser.parse(xml);
  if (!dados.nfeProc) throw new Error('XML sem nfeProc: o DANFE só é gerado de NF-e autorizada.');
  return new Danfe(dados.nfeProc).gerar();
};
