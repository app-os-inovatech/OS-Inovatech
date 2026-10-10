// Cliente dos web services nacionais da NF-e (Ambiente Nacional) usados pelo destinatário:
//   - NFeDistribuicaoDFe: baixa as NF-e e eventos emitidos contra o CNPJ (por NSU ou por chave)
//   - NFeRecepcaoEvento4: manifestação do destinatário (ex.: Ciência da Operação), que libera o XML completo
// Autenticação por TLS mútuo com o certificado A1 (e-CNPJ) da empresa.
//
// Configuração por variáveis de ambiente (uma por CNPJ, somente dígitos):
//   SEFAZ_AMBIENTE                producao (padrão) ou homologacao
//   SEFAZ_CERT_<CNPJ>_PFX         conteúdo do arquivo .pfx em base64 — ou SEFAZ_CERT_<CNPJ>_PATH com o caminho
//   SEFAZ_CERT_<CNPJ>_SENHA       senha do .pfx — ou SEFAZ_CERT_SENHA, quando é a mesma para todos
//   SEFAZ_URL_DISTRIBUICAO / SEFAZ_URL_EVENTO  opcionais: sobrescrevem os endereços (usado em testes)
//
// Se HTTPS_PROXY estiver definido, a conexão passa por um túnel CONNECT no proxy.

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const tls = require('tls');
const zlib = require('zlib');
const forge = require('node-forge');
const { XMLParser } = require('fast-xml-parser');

const SERVICOS = {
  producao: {
    tpAmb: '1',
    distribuicao: 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
    evento: 'https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  },
  homologacao: {
    tpAmb: '2',
    distribuicao: 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
    evento: 'https://hom1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  },
};

// Códigos de UF do IBGE (cUFAutor)
const UF_IBGE = {
  RO: '11', AC: '12', AM: '13', RR: '14', PA: '15', AP: '16', TO: '17', MA: '21', PI: '22', CE: '23', RN: '24', PB: '25', PE: '26',
  AL: '27', SE: '28', BA: '29', MG: '31', ES: '32', RJ: '33', SP: '35', PR: '41', SC: '42', RS: '43', MS: '50', MT: '51', GO: '52', DF: '53',
};

const EVENTOS_DESTINATARIO = {
  210200: 'Confirmacao da Operacao',
  210210: 'Ciencia da Operacao',
  210220: 'Desconhecimento da Operacao',
  210240: 'Operacao nao Realizada',
};

const NS_NFE = 'http://www.portalfiscal.inf.br/nfe';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false, // mantém CNPJ, chaves e NSU como texto (zeros à esquerda)
  isArray: (nome) => ['docZip', 'det', 'dup', 'retEvento'].includes(nome),
});

const semProxy = (host) =>
  (process.env.NO_PROXY || process.env.no_proxy || '')
    .split(',')
    .map((h) => h.trim().replace(/^\*/, ''))
    .some((h) => h && (host === h || (h.startsWith('.') && host.endsWith(h))));

const lerXml = (xml) => parser.parse(xml);
const escaparXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Lê o .pfx (base64 ou arquivo) e devolve certificado e chave em PEM.
// Usa node-forge porque muitos .pfx do ICP-Brasil usam criptografia legada que o OpenSSL 3 recusa.
function carregarCertificado(cnpj) {
  const base64 = process.env[`SEFAZ_CERT_${cnpj}_PFX`];
  const caminho = process.env[`SEFAZ_CERT_${cnpj}_PATH`];
  const senha = process.env[`SEFAZ_CERT_${cnpj}_SENHA`] || process.env.SEFAZ_CERT_SENHA;
  if (!base64 && !caminho) return null;
  if (senha === undefined) throw new Error(`Senha do certificado ausente: defina SEFAZ_CERT_${cnpj}_SENHA (ou SEFAZ_CERT_SENHA).`);
  const der = base64 ? Buffer.from(base64.replace(/\s+/g, ''), 'base64') : fs.readFileSync(caminho);
  const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(forge.util.createBuffer(der.toString('binary'))), senha);
  const chaves = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
  const certs = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];
  const chave = chaves[0] && chaves[0].key;
  if (!chave) throw new Error(`Chave privada não encontrada no certificado do CNPJ ${cnpj}.`);
  // Certificado da própria empresa: o que corresponde à chave privada
  const doTitular = certs.find((c) => c.cert && c.cert.publicKey.n.equals(chave.n)) || certs[0];
  const cert = doTitular.cert;
  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(chave),
    cadeiaPem: certs.filter((c) => c !== doTitular).map((c) => forge.pki.certificateToPem(c.cert)).join(''),
    titular: (cert.subject.getField('CN') || {}).value,
    validoAte: cert.validity.notAfter,
  };
}

class SefazClient {
  constructor({ cnpj, uf, ambiente, certificado, proxy } = {}) {
    this.cnpj = String(cnpj || '').replace(/\D/g, '');
    this.ambiente = ambiente || process.env.SEFAZ_AMBIENTE || 'producao';
    if (!SERVICOS[this.ambiente]) throw new Error(`SEFAZ_AMBIENTE inválido: ${this.ambiente} (use producao ou homologacao).`);
    this.servicos = {
      ...SERVICOS[this.ambiente],
      ...(process.env.SEFAZ_URL_DISTRIBUICAO && { distribuicao: process.env.SEFAZ_URL_DISTRIBUICAO }),
      ...(process.env.SEFAZ_URL_EVENTO && { evento: process.env.SEFAZ_URL_EVENTO }),
    };
    this.cUF = UF_IBGE[uf];
    if (!this.cUF) throw new Error(`UF inválida para o CNPJ ${this.cnpj}: ${uf}`);
    this.certificado = certificado || carregarCertificado(this.cnpj);
    if (!this.certificado) throw new Error(`Certificado do CNPJ ${this.cnpj} ausente: defina SEFAZ_CERT_${this.cnpj}_PFX e SEFAZ_CERT_${this.cnpj}_SENHA.`);
    this.proxy = proxy !== undefined ? proxy : process.env.HTTPS_PROXY || process.env.https_proxy;
  }

  static temCertificado(cnpj) {
    const d = String(cnpj || '').replace(/\D/g, '');
    return Boolean(process.env[`SEFAZ_CERT_${d}_PFX`] || process.env[`SEFAZ_CERT_${d}_PATH`]);
  }

  // Abre o socket TLS com o certificado do cliente, passando pelo proxy se houver
  _conectar(url) {
    const conexao = new Promise((resolve, reject) => {
      const porta = Number(url.port) || 443;
      const tlsOpts = { servername: url.hostname, cert: this.certificado.certPem + this.certificado.cadeiaPem, key: this.certificado.keyPem };
      if (!this.proxy || semProxy(url.hostname)) {
        const s = tls.connect({ host: url.hostname, port: porta, ...tlsOpts }, () => resolve(s));
        s.once('error', reject);
        return;
      }
      const p = new URL(this.proxy);
      const req = http.request({
        host: p.hostname,
        port: p.port || 80,
        method: 'CONNECT',
        path: `${url.hostname}:${porta}`,
        headers: p.username ? { 'Proxy-Authorization': `Basic ${Buffer.from(`${decodeURIComponent(p.username)}:${decodeURIComponent(p.password)}`).toString('base64')}` } : {},
      });
      req.once('connect', (res, socket) => {
        if (res.statusCode !== 200) return reject(new Error(`Proxy recusou a conexão com ${url.hostname} (HTTP ${res.statusCode}).`));
        const s = tls.connect({ socket, ...tlsOpts }, () => resolve(s));
        s.once('error', reject);
      });
      req.once('error', reject);
      req.end();
    });
    // Sem resposta da SEFAZ (ex.: bloqueio de rede) a conexão TCP ficaria pendurada por minutos
    let timer;
    const limite = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Sem resposta de ${url.hostname} em 30 s (bloqueio de rede ou SEFAZ fora do ar)`)), 30000);
    });
    return Promise.race([conexao, limite]).finally(() => clearTimeout(timer));
  }

  async _soap(endereco, acao, corpo) {
    const url = new URL(endereco);
    const envelope =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
      `<soap12:Body>${corpo}</soap12:Body></soap12:Envelope>`;
    const resposta = await new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': `application/soap+xml; charset=utf-8; action="${acao}"`, 'Content-Length': Buffer.byteLength(envelope) },
          createConnection: (_o, cb) => {
            this._conectar(url).then((s) => cb(null, s), cb);
          },
        },
        (res) => {
          const partes = [];
          res.on('data', (c) => partes.push(c));
          res.on('end', () => resolve({ status: res.statusCode, texto: Buffer.concat(partes).toString('utf8') }));
        }
      );
      req.once('error', reject);
      req.setTimeout(60000, () => req.destroy(new Error(`Tempo esgotado na SEFAZ (${url.hostname})`)));
      req.write(envelope);
      req.end();
    });
    const xml = lerXml(resposta.texto);
    const corpoResp = xml && xml.Envelope && xml.Envelope.Body;
    if (resposta.status >= 400 || !corpoResp) {
      const falha = corpoResp && corpoResp.Fault ? JSON.stringify(corpoResp.Fault).slice(0, 300) : resposta.texto.slice(0, 300);
      throw new Error(`SEFAZ respondeu HTTP ${resposta.status} em ${url.pathname}: ${falha}`);
    }
    return corpoResp;
  }

  async _distribuicao(filtro) {
    const corpo =
      '<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe"><nfeDadosMsg>' +
      `<distDFeInt xmlns="${NS_NFE}" versao="1.01"><tpAmb>${this.servicos.tpAmb}</tpAmb><cUFAutor>${this.cUF}</cUFAutor><CNPJ>${this.cnpj}</CNPJ>${filtro}</distDFeInt>` +
      '</nfeDadosMsg></nfeDistDFeInteresse>';
    const r = await this._soap(this.servicos.distribuicao, 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse', corpo);
    const ret = r.nfeDistDFeInteresseResponse.nfeDistDFeInteresseResult.retDistDFeInt;
    const documentos = ((ret.loteDistDFeInt && ret.loteDistDFeInt.docZip) || []).map((d) => {
      const xml = zlib.gunzipSync(Buffer.from(d['#text'], 'base64')).toString('utf8');
      return { nsu: d['@_NSU'], schema: d['@_schema'], tipo: d['@_schema'].split('_')[0], xml, dados: lerXml(xml) };
    });
    return { cStat: ret.cStat, xMotivo: ret.xMotivo, ultNSU: ret.ultNSU, maxNSU: ret.maxNSU, documentos };
  }

  // Documentos a partir do último NSU recebido (até 50 por chamada).
  // cStat 137 = nenhum documento novo: a SEFAZ exige 1 hora de espera antes de consultar de novo.
  distribuicao(ultNSU = '0') {
    return this._distribuicao(`<distNSU><ultNSU>${String(ultNSU).padStart(15, '0')}</ultNSU></distNSU>`);
  }

  consultarChave(chave) {
    return this._distribuicao(`<consChNFe><chNFe>${chave}</chNFe></consChNFe>`);
  }

  // Manifestação do destinatário (210210 = Ciência da Operação). Devolve o cStat do evento:
  // 135 = registrado, 573 = já registrado antes (duplicidade), demais = rejeição.
  async manifestar(chave, tpEvento = 210210, justificativa) {
    const desc = EVENTOS_DESTINATARIO[tpEvento];
    if (!desc) throw new Error(`Evento de manifestação inválido: ${tpEvento}`);
    const id = `ID${tpEvento}${chave}01`;
    const dhEvento = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 19) + '-03:00';
    const xJust = tpEvento === 210240 ? `<xJust>${escaparXml(justificativa)}</xJust>` : '';
    // Montado já na forma canônica (C14N): sem espaços e com o namespace herdado declarado
    const infEvento =
      `<infEvento xmlns="${NS_NFE}" Id="${id}"><cOrgao>91</cOrgao><tpAmb>${this.servicos.tpAmb}</tpAmb><CNPJ>${this.cnpj}</CNPJ>` +
      `<chNFe>${chave}</chNFe><dhEvento>${dhEvento}</dhEvento><tpEvento>${tpEvento}</tpEvento><nSeqEvento>1</nSeqEvento><verEvento>1.00</verEvento>` +
      `<detEvento versao="1.00"><descEvento>${desc}</descEvento>${xJust}</detEvento></infEvento>`;
    const assinatura = this._assinar(infEvento, id);
    const evento = `<evento xmlns="${NS_NFE}" versao="1.00">${infEvento.replace(` xmlns="${NS_NFE}"`, '')}${assinatura}</evento>`;
    const corpo =
      '<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">' +
      `<envEvento xmlns="${NS_NFE}" versao="1.00"><idLote>${Date.now()}</idLote>${evento}</envEvento></nfeDadosMsg>`;
    const r = await this._soap(this.servicos.evento, 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento', corpo);
    const ret = r.nfeResultMsg.retEnvEvento;
    const retEvento = ret.retEvento && ret.retEvento[0] && ret.retEvento[0].infEvento;
    if (!retEvento) return { cStat: ret.cStat, xMotivo: ret.xMotivo };
    return { cStat: retEvento.cStat, xMotivo: retEvento.xMotivo, protocolo: retEvento.nProt };
  }

  // Assinatura XMLDSig (RSA-SHA1, C14N) exigida nos eventos da NF-e
  _assinar(elementoCanonico, id) {
    const digest = crypto.createHash('sha1').update(elementoCanonico, 'utf8').digest('base64');
    const signedInfo =
      '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      '<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>' +
      '<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>' +
      `<Reference URI="#${id}"><Transforms>` +
      '<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>' +
      '<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform>' +
      '</Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>' +
      `<DigestValue>${digest}</DigestValue></Reference></SignedInfo>`;
    const valor = crypto.createSign('RSA-SHA1').update(signedInfo, 'utf8').sign(this.certificado.keyPem, 'base64');
    const certBase64 = this.certificado.certPem.replace(/-----[^-]+-----|\s+/g, '');
    return (
      '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">' +
      signedInfo.replace(' xmlns="http://www.w3.org/2000/09/xmldsig#"', '') +
      `<SignatureValue>${valor}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`
    );
  }
}

SefazClient.lerXml = lerXml;
SefazClient.carregarCertificado = carregarCertificado;
module.exports = SefazClient;
