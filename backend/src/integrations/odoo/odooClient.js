// Cliente mínimo para a API externa JSON-2 do Odoo 19+ (POST /json/2/<modelo>/<método>).
// Autenticação por chave de API no cabeçalho "Authorization: bearer <chave>".
// Configuração por variáveis de ambiente:
//   ODOO_URL      ex.: https://suaempresa.odoo.com
//   ODOO_DB       nome do banco de dados
//   ODOO_API_KEY  chave de API (Odoo → Meu perfil → Segurança da conta → Nova chave de API).
//                 Opcional quando o ambiente injeta o cabeçalho Authorization (secret de rede).

class OdooClient {
  constructor({ url, db, apiKey } = {}) {
    this.url = (url || process.env.ODOO_URL || '').replace(/\/+$/, '');
    this.db = db || process.env.ODOO_DB;
    this.apiKey = apiKey || process.env.ODOO_API_KEY;
    this.uid = null;
    this.context = null;
    this._fieldsCache = {};

    if (!this.url || !this.db) {
      throw new Error('Configuração do Odoo incompleta. Defina ODOO_URL e ODOO_DB (e ODOO_API_KEY).');
    }
  }

  async call(model, method, params = {}) {
    const headers = { 'Content-Type': 'application/json', 'X-Odoo-Database': this.db };
    if (this.apiKey) headers.Authorization = `bearer ${this.apiKey}`;
    const resp = await fetch(`${this.url}/json/2/${model}/${method}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(this.context ? { context: this.context, ...params } : params),
    });
    const texto = await resp.text();
    let data;
    try {
      data = JSON.parse(texto);
    } catch {
      throw new Error(`Odoo respondeu HTTP ${resp.status} sem JSON em ${model}.${method}`);
    }
    if (!resp.ok) {
      throw new Error(`Erro do Odoo em ${model}.${method} (HTTP ${resp.status}): ${data.message || texto}`);
    }
    return data;
  }

  async login() {
    const ctx = await this.call('res.users', 'context_get');
    this.uid = ctx.uid;
    // Libera todas as empresas do usuário (bancos multiempresa)
    const [usuario] = await this.call('res.users', 'read', { ids: [this.uid], fields: ['company_ids'] });
    this.context = { ...ctx, allowed_company_ids: usuario.company_ids };
    return this.uid;
  }

  async version() {
    const resp = await fetch(`${this.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service: 'common', method: 'version', args: [] } }),
    });
    return (await resp.json()).result;
  }

  searchRead(model, domain, fields, extra = {}) {
    return this.call(model, 'search_read', { domain, fields, ...extra });
  }

  async create(model, vals) {
    const res = await this.call(model, 'create', { vals_list: [vals] });
    return Array.isArray(res) ? res[0] : res;
  }

  write(model, ids, vals) {
    return this.call(model, 'write', { ids, vals });
  }

  async fields(model) {
    if (!this._fieldsCache[model]) {
      this._fieldsCache[model] = await this.call(model, 'fields_get', {
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
