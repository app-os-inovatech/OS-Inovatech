// Cliente da API do C6 Bank (C6 Developers): OAuth2 client_credentials + TLS mútuo (mTLS).
// Documentação: https://developers.c6bank.com.br/apis (auth, statement, schedule-payments)
//
// Configuração por variáveis de ambiente:
//   C6_AMBIENTE       sandbox (padrão) ou producao
//   C6_CLIENT_ID      client id das credenciais
//   C6_CLIENT_SECRET  client secret das credenciais
//   C6_CERT_PEM       conteúdo do certificado (.crt) em PEM  — ou C6_CERT_PATH com o caminho do arquivo
//   C6_KEY_PEM        conteúdo da chave privada (.key) em PEM — ou C6_KEY_PATH com o caminho do arquivo
//   C6_BASE_URL       opcional: sobrescreve o host (usado em testes)
//
// Se HTTPS_PROXY estiver definido, a conexão passa por um túnel CONNECT no proxy.

const fs = require('fs');
const http = require('http');
const https = require('https');
const tls = require('tls');

const HOSTS = {
  sandbox: 'https://baas-api-sandbox.c6bank.info',
  producao: 'https://baas-api.c6bank.info',
};

const pem = (valor, caminho) => (valor ? valor.replace(/\\n/g, '\n') : caminho ? fs.readFileSync(caminho, 'utf8') : null);

class C6Client {
  constructor(opts = {}) {
    const ambiente = opts.ambiente || process.env.C6_AMBIENTE || 'sandbox';
    this.baseUrl = (opts.baseUrl || process.env.C6_BASE_URL || HOSTS[ambiente] || '').replace(/\/+$/, '');
    if (!this.baseUrl) throw new Error(`C6_AMBIENTE inválido: ${ambiente} (use sandbox ou producao).`);
    this.clientId = opts.clientId || process.env.C6_CLIENT_ID;
    this.clientSecret = opts.clientSecret || process.env.C6_CLIENT_SECRET;
    this.cert = opts.cert || pem(process.env.C6_CERT_PEM, process.env.C6_CERT_PATH);
    this.key = opts.key || pem(process.env.C6_KEY_PEM, process.env.C6_KEY_PATH);
    this.proxy = opts.proxy !== undefined ? opts.proxy : process.env.HTTPS_PROXY || process.env.https_proxy;
    this._token = null;
    this._tokenExpira = 0;

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Credenciais do C6 ausentes: defina C6_CLIENT_ID e C6_CLIENT_SECRET.');
    }
    if (this.baseUrl.startsWith('https:') && (!this.cert || !this.key)) {
      throw new Error('Certificado do C6 ausente: defina C6_CERT_PEM e C6_KEY_PEM (ou C6_CERT_PATH e C6_KEY_PATH).');
    }
  }

  // Abre o socket TLS com o certificado do cliente, passando pelo proxy se houver
  _conectar(url) {
    return new Promise((resolve, reject) => {
      const porta = Number(url.port) || 443;
      const tlsOpts = { servername: url.hostname, cert: this.cert, key: this.key };
      if (!this.proxy) {
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
  }

  async _requisicao(metodo, caminho, { query, form, json, headers = {}, binario = false } = {}) {
    const url = new URL(this.baseUrl + caminho);
    if (query) Object.entries(query).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
    let corpo;
    if (form) {
      corpo = new URLSearchParams(form).toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (json) {
      corpo = JSON.stringify(json);
      headers['Content-Type'] = 'application/json';
    }
    const opcoes = { method: metodo, headers: { Accept: 'application/json', ...headers } };
    if (corpo) opcoes.headers['Content-Length'] = Buffer.byteLength(corpo);

    const resposta = await new Promise((resolve, reject) => {
      const tratar = (res) => {
        const partes = [];
        res.on('data', (c) => partes.push(c));
        res.on('end', () => {
          const corpoResp = Buffer.concat(partes);
          resolve({ status: res.statusCode, tipo: res.headers['content-type'] || '', bruto: corpoResp, texto: corpoResp.toString('utf8') });
        });
      };
      let req;
      if (url.protocol === 'http:') {
        req = http.request(url, opcoes, tratar);
      } else {
        req = https.request(url, { ...opcoes, createConnection: (_o, cb) => { this._conectar(url).then((s) => cb(null, s), cb); } }, tratar);
      }
      req.once('error', reject);
      req.setTimeout(30000, () => req.destroy(new Error(`Tempo esgotado em ${metodo} ${caminho}`)));
      if (corpo) req.write(corpo);
      req.end();
    });

    if (binario && resposta.status < 400 && !resposta.tipo.includes('json')) return resposta.bruto;
    let dados = null;
    try {
      dados = resposta.texto ? JSON.parse(resposta.texto) : null;
    } catch {
      dados = resposta.texto;
    }
    if (resposta.status >= 400) {
      const detalhe = typeof dados === 'object' && dados ? dados.detail || dados.message || dados.title || JSON.stringify(dados) : dados;
      throw new Error(`C6 respondeu HTTP ${resposta.status} em ${metodo} ${caminho}: ${String(detalhe).slice(0, 300)}`);
    }
    return dados;
  }

  // Token OAuth2: reaproveitado até 30 s antes de expirar
  async token() {
    if (this._token && Date.now() < this._tokenExpira) return this._token;
    const r = await this._requisicao('POST', '/v1/auth/', {
      form: { client_id: this.clientId, client_secret: this.clientSecret, grant_type: 'client_credentials' },
    });
    this._token = r.access_token;
    this._tokenExpira = Date.now() + Math.max((r.expires_in || 300) - 30, 30) * 1000;
    this.escopos = r.scope;
    return this._token;
  }

  async _autenticado(metodo, caminho, opts = {}) {
    const token = await this.token();
    return this._requisicao(metodo, caminho, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
  }

  saldo() {
    return this._autenticado('GET', '/v1/statement/balance');
  }

  // Extrato em janelas de até 30 dias (limite da API)
  async extrato(inicio, fim) {
    const lancamentos = [];
    const dia = 24 * 3600 * 1000;
    let de = new Date(`${inicio}T00:00:00Z`);
    const ate = new Date(`${fim}T00:00:00Z`);
    while (de <= ate) {
      const fimJanela = new Date(Math.min(de.getTime() + 29 * dia, ate.getTime()));
      const r = await this._autenticado('GET', '/v1/statement/', {
        query: { start_date: de.toISOString().slice(0, 10), end_date: fimJanela.toISOString().slice(0, 10) },
      });
      lancamentos.push(...((r && r.entries) || []));
      de = new Date(fimJanela.getTime() + dia);
    }
    return lancamentos;
  }

  // --- Cobranças (API Bolepix: boleto + Pix QR Code opcional) ---------------

  // Identificador da cobrança definido pelo integrador: 26 caracteres [A-Z0-9], único
  static novoIdCobranca() {
    const alfabeto = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let t = Date.now();
    let tempo = '';
    for (let i = 0; i < 10; i++) {
      tempo = alfabeto[t % 32] + tempo;
      t = Math.floor(t / 32);
    }
    const aleatorio = Array.from(require('crypto').randomBytes(16), (b) => alfabeto[b % 32]).join('');
    return tempo + aleatorio;
  }

  _cabecalhosParceiro() {
    return { 'partner-software-name': 'Inovatech Odoo', 'partner-software-version': '1.0.0' };
  }

  emitirCobranca(dados) {
    return this._autenticado('POST', '/v2/bank_slips', { json: dados, headers: this._cabecalhosParceiro() });
  }

  consultarCobranca(idCobranca) {
    return this._autenticado('GET', `/v2/bank_slips/${idCobranca}`, { headers: this._cabecalhosParceiro() });
  }

  listarCobrancas(filtros) {
    return this._autenticado('GET', '/v2/bank_slips/list', { query: filtros, headers: this._cabecalhosParceiro() });
  }

  cancelarCobranca(idCobranca) {
    return this._autenticado('PUT', `/v2/bank_slips/${idCobranca}/cancel`, { headers: this._cabecalhosParceiro() });
  }

  // Devolve o PDF como Buffer (a API pode responder o arquivo ou um JSON com o PDF em base64)
  async pdfCobranca(idCobranca) {
    const r = await this._autenticado('GET', `/v2/bank_slips/${idCobranca}/pdf`, { headers: this._cabecalhosParceiro(), binario: true });
    if (Buffer.isBuffer(r)) return r;
    const base64 = r && (r.base64_pdf_file || r.pdf || r.content || r.file);
    if (!base64) throw new Error('Resposta do PDF do C6 em formato inesperado.');
    return Buffer.from(base64, 'base64');
  }

  get carteira() {
    return this.baseUrl.includes('sandbox') ? '21' : '15';
  }
}

module.exports = C6Client;
