// Completa o cadastro de um contato do Odoo a partir do CNPJ.
//
// Fontes (gratuitas, sem chave):
//   1. CNPJ.ws pública  – dados da Receita + Inscrições Estaduais (limite de 3 consultas/min)
//   2. BrasilAPI        – reserva quando a CNPJ.ws falha (não traz a IE)
//
// Só preenche campos vazios, para não apagar o que alguém digitou. O nome só é
// trocado pela razão social quando está vazio ou é o próprio CNPJ digitado.

const OdooClient = require('../integrations/odoo/odooClient');

const TIMEOUT_MS = 15000;

const soDigitos = (v) => String(v || '').replace(/\D/g, '');
const formatarCnpj = (c) => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
const formatarCep = (c) => c.replace(/^(\d{5})(\d{3})$/, '$1-$2');
const tituloCase = (s) =>
  String(s || '').toLowerCase().replace(/(^|[\s/-])(\p{L})/gu, (m, sep, l) => sep + l.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase());
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function cnpjValido(c) {
  if (!/^\d{14}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  const dv = (base) => {
    let soma = 0;
    let peso = base.length - 7;
    for (const n of base) {
      soma += Number(n) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(c.slice(0, 12)) === Number(c[12]) && dv(c.slice(0, 13)) === Number(c[13]);
}

async function buscarJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${new URL(url).host}`);
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

// Formato comum às duas fontes
async function consultarCnpj(cnpj) {
  try {
    const d = await buscarJson(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    const e = d.estabelecimento || {};
    const uf = e.estado && e.estado.sigla;
    const ies = (e.inscricoes_estaduais || []).filter((i) => i.ativo !== false);
    const ie = ies.find((i) => i.estado && i.estado.sigla === uf) || ies[0];
    return {
      fonte: 'CNPJ.ws',
      razaoSocial: d.razao_social,
      fantasia: e.nome_fantasia,
      situacao: e.situacao_cadastral,
      logradouro: [e.tipo_logradouro, e.logradouro].filter(Boolean).join(' '),
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cep: e.cep,
      cidade: e.cidade && e.cidade.nome,
      uf,
      telefone: e.ddd1 && e.telefone1 ? `(${e.ddd1}) ${e.telefone1}` : null,
      email: e.email,
      cnae: e.atividade_principal && `${e.atividade_principal.subclasse || e.atividade_principal.id} – ${e.atividade_principal.descricao}`,
      ie: ie ? ie.inscricao_estadual : null,
      ieConsultada: true,
      simples: d.simples ? d.simples.simples === 'Sim' : null,
      mei: d.simples ? d.simples.mei === 'Sim' : null,
    };
  } catch (erroWs) {
    const d = await buscarJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`).catch((e) => {
      throw new Error(`CNPJ.ws: ${erroWs.message}; BrasilAPI: ${e.message}`);
    });
    const tel = soDigitos(d.ddd_telefone_1);
    return {
      fonte: `BrasilAPI (CNPJ.ws indisponível: ${erroWs.message})`,
      razaoSocial: d.razao_social,
      fantasia: d.nome_fantasia,
      situacao: d.descricao_situacao_cadastral,
      logradouro: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' '),
      numero: d.numero,
      complemento: d.complemento,
      bairro: d.bairro,
      cep: d.cep,
      cidade: d.municipio,
      uf: d.uf,
      telefone: tel.length >= 10 ? `(${tel.slice(0, 2)}) ${tel.slice(2)}` : null,
      email: d.email,
      cnae: d.cnae_fiscal && `${d.cnae_fiscal} – ${d.cnae_fiscal_descricao}`,
      ie: null,
      ieConsultada: false,
      simples: d.opcao_pelo_simples,
      mei: d.opcao_pelo_mei,
    };
  }
}

class CnpjCadastro {
  constructor(odoo = new OdooClient()) {
    this.odoo = odoo;
    this.logado = false;
  }

  async _login() {
    if (!this.logado) {
      await this.odoo.login();
      this.logado = true;
    }
  }

  async _ids(model, domain) {
    const r = await this.odoo.searchRead(model, domain, ['id'], { limit: 1 });
    return r.length ? r[0].id : false;
  }

  // Monta os valores a gravar, só nos campos vazios
  async _valores(parceiro, d) {
    const vals = {};
    const vazio = (campo) => !parceiro[campo];
    const definir = (campo, valor) => {
      if (valor && vazio(campo)) vals[campo] = valor;
    };

    const cnpj = soDigitos(parceiro.vat);
    const nome = String(parceiro.name || '').trim();
    if (d.razaoSocial && (!nome || soDigitos(nome) === cnpj || /^[\d\s./-]*$/.test(nome))) {
      vals.name = d.razaoSocial;
    }
    if (!parceiro.is_company) vals.is_company = true;

    const brasil = await this._ids('res.country', [['code', '=', 'BR']]);
    definir('country_id', brasil);
    const estado = d.uf && (await this._ids('res.country.state', [['code', '=', d.uf], ['country_id', '=', brasil]]));
    definir('state_id', estado);
    if (d.cidade && estado && vazio('city_id')) {
      const cidades = await this.odoo.searchRead('res.city', [['state_id', '=', estado], ['name', '=ilike', d.cidade]], ['id', 'name'], {});
      const alvo = semAcento(d.cidade);
      const cidade = cidades[0] || (await this.odoo.searchRead('res.city', [['state_id', '=', estado]], ['id', 'name'], {}))
        .find((c) => semAcento(c.name) === alvo);
      if (cidade) vals.city_id = cidade.id;
    }
    definir('city', d.cidade && tituloCase(d.cidade));

    if (vazio('street') && vazio('street_name')) {
      definir('street_name', d.logradouro && tituloCase(d.logradouro));
      definir('street_number', d.numero);
      definir('street_number2', d.complemento && tituloCase(d.complemento));
    }
    definir('street2', d.bairro && tituloCase(d.bairro));
    definir('zip', d.cep && formatarCep(soDigitos(d.cep)));
    definir('phone', d.telefone);
    definir('email', d.email && d.email.toLowerCase());

    if (d.ie) {
      definir('l10n_br_ie_code', d.ie);
      definir('l10n_br_taxpayer', 'icms');
    } else if (d.ieConsultada) {
      definir('l10n_br_taxpayer', 'non');
    }
    if (d.mei) definir('l10n_br_tax_regime', 'simplifiedEntrepreneur');
    else if (d.simples) definir('l10n_br_tax_regime', 'simplified');
    return vals;
  }

  // Ponto de entrada: completa o contato <id>. Retorna um resumo do que fez.
  async completar(id) {
    await this._login();
    const campos = ['name', 'vat', 'is_company', 'country_id', 'state_id', 'city_id', 'city', 'street', 'street_name',
      'street_number', 'street_number2', 'street2', 'zip', 'phone', 'email', 'l10n_br_ie_code', 'l10n_br_taxpayer', 'l10n_br_tax_regime'];
    const [parceiro] = await this.odoo.call('res.partner', 'read', { ids: [Number(id)], fields: campos });
    if (!parceiro) return { id, ignorado: 'contato não encontrado' };
    const cnpj = soDigitos(parceiro.vat);
    if (cnpj.length !== 14) return { id, ignorado: 'sem CNPJ (CPF ou vazio)' };
    if (!cnpjValido(cnpj)) {
      await this._nota(id, `<p>⚠️ Busca de CNPJ: <b>${parceiro.vat}</b> não é um CNPJ válido (dígito verificador). Confira o número.</p>`);
      return { id, ignorado: 'CNPJ inválido' };
    }

    let d;
    try {
      d = await consultarCnpj(cnpj);
    } catch (e) {
      await this._nota(id, `<p>⚠️ Não consegui buscar o CNPJ ${formatarCnpj(cnpj)} agora (${e.message}). Salve o CNPJ de novo daqui a 1 minuto para tentar outra vez.</p>`);
      throw e;
    }

    const vals = await this._valores(parceiro, d);
    if (Object.keys(vals).length) await this.odoo.write('res.partner', [parceiro.id], vals);

    const situacao = String(d.situacao || '').toUpperCase();
    const linhas = [
      `<p><b>Cadastro completado pelo CNPJ ${formatarCnpj(cnpj)}</b> (fonte: ${d.fonte})</p><ul>`,
      `<li>Razão social: ${d.razaoSocial || '—'}${d.fantasia ? ` · Fantasia: ${d.fantasia}` : ''}</li>`,
      `<li>Situação na Receita: ${situacao && situacao !== 'ATIVA' ? `<b>⚠️ ${situacao}</b>` : situacao || '—'}</li>`,
      `<li>CNAE principal: ${d.cnae || '—'}</li>`,
      `<li>Inscrição Estadual: ${d.ie || (d.ieConsultada ? 'nenhuma IE ativa encontrada (não contribuinte)' : 'não consultada – a fonte reserva não traz a IE; confira')}</li>`,
      `<li>Simples Nacional: ${d.mei ? 'MEI' : d.simples === true ? 'optante' : d.simples === false ? 'não optante (confirme se é Lucro Real ou Presumido)' : '—'}</li>`,
      `<li>Campos preenchidos: ${Object.keys(vals).length ? Object.keys(vals).join(', ') : 'nenhum (já estavam preenchidos)'}</li></ul>`,
    ];
    await this._nota(id, linhas.join(''));
    return { id, cnpj, fonte: d.fonte, campos: Object.keys(vals) };
  }

  _nota(id, corpo) {
    return this.odoo.call('res.partner', 'message_post', {
      ids: [Number(id)], body: corpo, body_is_html: true, message_type: 'comment', subtype_xmlid: 'mail.mt_note',
    });
  }
}

module.exports = { CnpjCadastro, consultarCnpj, cnpjValido };
