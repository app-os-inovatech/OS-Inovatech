// Base comum dos documentos auxiliares em PDF (DANFE e DACTE): caixas com rótulo, linhas de campos,
// formatação brasileira e o código de barras Code 128 da chave de acesso.

const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');

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
const numeroDoc = (n) => String(n).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
const lista = (v) => (v === undefined || v === null ? [] : [].concat(v));
// Primeiro grupo de um imposto (ex.: ICMS → ICMS00/ICMS10/ICMSSN102…)
const grupo = (imp) => (imp && typeof imp === 'object' ? Object.values(imp).find((v) => v && typeof v === 'object') || {} : {});

class DocumentoPdf {
  constructor(titulo, chave) {
    this.chave = String(chave).replace(/\D/g, '');
    this.doc = new PDFDocument({ size: 'A4', margin: M, bufferPages: true, info: { Title: titulo, Producer: 'automacoes-odoo' } });
  }

  // Começa a capturar o PDF e a gerar o código de barras (aguarde this.codigoPronto antes de desenhar).
  // Devolve a promessa do PDF pronto, resolvida depois de doc.end().
  iniciar() {
    this.codigoPronto = bwipjs.toBuffer({ bcid: 'code128', text: this.chave, scale: 2, height: 12, includetext: false }).then((b) => (this.codigoBarras = b));
    const pedacos = [];
    this.doc.on('data', (c) => pedacos.push(c));
    return new Promise((resolve) => this.doc.on('end', () => resolve(Buffer.concat(pedacos))));
  }

  // Caixa com rótulo pequeno em cima e valor embaixo
  campo(x, y, w, h, rotulo, valor, { alinhar = 'left', tamanho = 8, negrito = false } = {}) {
    const d = this.doc;
    d.lineWidth(0.5).rect(x, y, w, h).stroke();
    d.font('Helvetica').fontSize(5.5).fillColor('black').text(rotulo.toUpperCase(), x + 2, y + 1.5, { width: w - 4, lineBreak: false, ellipsis: true });
    d.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(tamanho);
    let texto = valor === undefined || valor === null ? '' : String(valor);
    while (texto.length > 1 && d.widthOfString(texto) > w - 4) texto = `${texto.slice(0, -2)}…`;
    d.text(texto, x + 2, y + h - tamanho - 3, {
      width: w - 4,
      align: alinhar,
      lineBreak: false,
      ellipsis: true,
    });
  }

  // Linha de campos com larguras proporcionais
  linha(y, h, campos, x0 = M, largura = LARG) {
    const total = campos.reduce((s, c) => s + c[0], 0);
    let x = x0;
    for (const [peso, rotulo, valor, opcoes] of campos) {
      const w = (peso / total) * largura;
      this.campo(x, y, w, h, rotulo, valor, opcoes);
      x += w;
    }
    return y + h;
  }

  titulo(y, texto) {
    this.doc.font('Helvetica-Bold').fontSize(6.5).text(texto, M, y + 2, { lineBreak: false });
    return y + 10;
  }

  // Código de barras + chave + texto de consulta, no canto direito do cabeçalho
  blocoChave(x, y, w, h, consulta) {
    const d = this.doc;
    d.lineWidth(0.5).rect(x, y, w, 38).stroke();
    d.image(this.codigoBarras, x + 8, y + 5, { width: w - 16, height: 28 });
    this.campo(x, y + 38, w, 22, 'Chave de acesso', chaveFormatada(this.chave), { alinhar: 'center', tamanho: 7.5, negrito: true });
    d.rect(x, y + 60, w, h - 60).stroke();
    d.font('Helvetica').fontSize(7).text(consulta, x + 4, y + 65, { width: w - 8, align: 'center' });
  }

  // Emitente centralizado numa caixa (nome + endereço)
  blocoEmitente(x, y, w, h, emit, ender) {
    const d = this.doc;
    const e = ender || {};
    d.lineWidth(0.5).rect(x, y, w, h).stroke();
    d.font('Helvetica-Bold').fontSize(10).text(emit.xNome, x + 4, y + 8, { width: w - 8, align: 'center' });
    d.font('Helvetica').fontSize(7).text(
      [
        [e.xLgr, e.nro, e.xCpl].filter(Boolean).join(', '),
        `${e.xBairro || ''} - ${cep(e.CEP)}`,
        `${e.xMun || ''} - ${e.UF || ''}${e.fone ? `  Fone: ${fone(e.fone)}` : ''}`,
        `CNPJ: ${documento(emit.CNPJ || emit.CPF)}  IE: ${emit.IE || ''}`,
      ].join('\n'),
      x + 4, d.y + 4, { width: w - 8, align: 'center' }
    );
  }

  // "FOLHA n/total" nas posições registradas em this.posFolha
  numerarFolhas() {
    const total = this.doc.bufferedPageRange().count;
    for (const { pagina, x, y, w } of this.posFolha || []) {
      this.doc.switchToPage(pagina);
      this.doc.font('Helvetica').fontSize(7).text(`FOLHA ${pagina + 1}/${total}`, x, y, { width: w, align: 'center', lineBreak: false });
    }
  }

  marcarFolha(x, y, w) {
    this.posFolha = this.posFolha || [];
    this.posFolha.push({ pagina: this.doc.bufferedPageRange().count - 1, x, y, w });
  }
}

module.exports = { DocumentoPdf, M, LARG, FIM_PAGINA, num, dinheiro, quantidade, data, hora, documento, cep, fone, chaveFormatada, numeroDoc, lista, grupo };
