// Cliente mínimo para a API externa do Odoo (JSON-RPC, endpoint /jsonrpc).
// Usa login + chave de API (Odoo → Meu perfil → Segurança da conta → Nova chave de API).
// Configuração por variáveis de ambiente:
//   ODOO_URL      ex.: https://suaempresa.odoo.com
//   ODOO_DB       nome do banco de dados
//   ODOO_USER     login do usuário de integração
//   ODOO_API_KEY  chave de API desse usuário

class OdooClient {
  constructor({ url, db, user, apiKey } = {}) {
    this.url = (url || process.env.ODOO_URL || '').replace(/\/+$/, '');
    this.db = db || process.env.ODOO_DB;
    this.user = user || process.env.ODOO_USER;
    this.apiKey = apiKey || process.env.ODOO_API_KEY;
    this.uid = null;
    this._fieldsCache = {};

    const faltando = ['url', 'db', 'user', 'apiKey'].filter((k) => !this[k]);
    if (faltando.length) {
      throw new Error(
        'Configuração do Odoo incompleta. Defina ODOO_URL, ODOO_DB, ODOO_USER e ODOO_API_KEY.'
      );
    }
  }

  async _rpc(service, method, args) {
    const resp = await fetch(`${this.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args },
        id: Date.now(),
      }),
    });
    if (!resp.ok) {
      throw new Error(`Odoo respondeu HTTP ${resp.status} em ${this.url}/jsonrpc`);
    }
    const data = await resp.json();
    if (data.error) {
      const msg = data.error.data?.message || data.error.message;
      throw new Error(`Erro do Odoo: ${msg}`);
    }
    return data.result;
  }

  async login() {
    this.uid = await this._rpc('common', 'authenticate', [this.db, this.user, this.apiKey, {}]);
    if (!this.uid) {
      throw new Error('Falha na autenticação no Odoo: verifique ODOO_DB, ODOO_USER e ODOO_API_KEY.');
    }
    return this.uid;
  }

  async version() {
    return this._rpc('common', 'version', []);
  }

  async call(model, method, args = [], kwargs = {}) {
    if (!this.uid) await this.login();
    return this._rpc('object', 'execute_kw', [this.db, this.uid, this.apiKey, model, method, args, kwargs]);
  }

  searchRead(model, domain, fields, extra = {}) {
    return this.call(model, 'search_read', [domain], { fields, ...extra });
  }

  async create(model, vals) {
    const res = await this.call(model, 'create', [vals]);
    return Array.isArray(res) ? res[0] : res;
  }

  write(model, ids, vals) {
    return this.call(model, 'write', [ids, vals]);
  }

  async fields(model) {
    if (!this._fieldsCache[model]) {
      this._fieldsCache[model] = await this.call(model, 'fields_get', [], {
        attributes: ['type', 'selection', 'relation'],
      });
    }
    return this._fieldsCache[model];
  }

  async hasField(model, field) {
    return Boolean((await this.fields(model))[field]);
  }
}

module.exports = OdooClient;
