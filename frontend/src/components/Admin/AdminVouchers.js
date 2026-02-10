import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './AdminVouchers.css';

function AdminVouchers() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [uploadando, setUploadando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Carregar vouchers, técnicos e lojas
      const [vouchersRes, tecnicosRes, lojasRes] = await Promise.allSettled([
        fetchWithTimeout(`${API_BASE_URL}/api/admin/vouchers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetchWithTimeout(`${API_BASE_URL}/api/tecnicos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetchWithTimeout(`${API_BASE_URL}/api/lojas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const errors = [];

      if (vouchersRes.status === 'fulfilled' && vouchersRes.value.ok) {
        setVouchers(await vouchersRes.value.json());
      } else {
        setVouchers([]);
        errors.push('vouchers');
      }

      if (tecnicosRes.status === 'fulfilled' && tecnicosRes.value.ok) {
        setTecnicos(await tecnicosRes.value.json());
      } else {
        setTecnicos([]);
        errors.push('técnicos');
      }

      if (lojasRes.status === 'fulfilled' && lojasRes.value.ok) {
        setLojas(await lojasRes.value.json());
      } else {
        setLojas([]);
        errors.push('lojas');
      }

      if (errors.length > 0) {
        setError(`Falha ao carregar: ${errors.join(', ')}.`);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!arquivo || !descricao || !tecnicoId) {
      alert('Preencha todos os campos');
      return;
    }

    setUploadando(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('descricao', descricao);
      formData.append('tecnico_id', parseInt(tecnicoId));

      const response = await fetch(`${API_BASE_URL}/api/admin/vouchers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Documento enviado com sucesso!');
        setArquivo(null);
        setDescricao('');
        setTecnicoId('');
        setShowForm(false);
        carregarDados();
      } else {
        alert('Erro ao enviar documento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar documento');
    } finally {
      setUploadando(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja deletar este voucher?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Voucher deletado!');
        carregarDados();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const getTecnicoNome = (id) => {
    const tecnico = tecnicos.find(t => t.id === id);
    return tecnico ? tecnico.nome : 'Desconhecido';
  };

  const getLojaName = (id) => {
    const loja = lojas.find(l => l.id === id);
    return loja ? loja.nome : '-';
  };

  const vouchersFiltered = vouchers.filter(v => {
    const matchTecnico = !filtroTecnico || v.usuario_id === parseInt(filtroTecnico);
    const matchLoja = !filtroLoja || v.loja_id === parseInt(filtroLoja);
    return matchTecnico && matchLoja;
  });

  if (loading) {
    return <div className="admin-vouchers-container">Carregando...</div>;
  }

  return (
    <div className="admin-vouchers-container">
      <div className="vouchers-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>📄 Gerenciar Vouchers</h1>
      </div>

      {error && (
        <div className="vouchers-error">
          <p>{error}</p>
          <button className="btn-retry" onClick={carregarDados}>Tentar novamente</button>
        </div>
      )}

      <div className="vouchers-actions">
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-novo-voucher"
        >
          {showForm ? '❌ Cancelar' : '➕ Enviar Documento'}
        </button>
      </div>

      {showForm && (
        <div className="voucher-form-section">
          <form onSubmit={handleUpload} className="voucher-form">
            <div className="form-group">
              <label>Técnico *</label>
              <select 
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
                required
              >
                <option value="">Selecione um técnico</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Descrição *</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Ticket Aéreo, Hospedagem..."
                required
              />
            </div>

            <div className="form-group">
              <label>Arquivo *</label>
              <input
                type="file"
                onChange={(e) => setArquivo(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
              />
              <small>PDF, JPG, PNG, DOC, DOCX (máx. 10MB)</small>
            </div>

            <button type="submit" disabled={uploadando} className="btn-submit">
              {uploadando ? 'Enviando...' : '💾 Salvar'}
            </button>
          </form>
        </div>
      )}

      <div className="vouchers-filtros">
        <select 
          value={filtroTecnico}
          onChange={(e) => setFiltroTecnico(e.target.value)}
        >
          <option value="">Todos os Técnicos</option>
          {tecnicos.map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>

        <select 
          value={filtroLoja}
          onChange={(e) => setFiltroLoja(e.target.value)}
        >
          <option value="">Todas as Lojas</option>
          {lojas.map(l => (
            <option key={l.id} value={l.id}>{l.nome}</option>
          ))}
        </select>
      </div>

      <div className="vouchers-list">
        {vouchersFiltered.length === 0 ? (
          <p className="sem-vouchers">Nenhum voucher encontrado</p>
        ) : (
          <table className="vouchers-table">
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Descrição</th>
                <th>Arquivo</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vouchersFiltered.map(v => (
                <tr key={v.id}>
                  <td>{getTecnicoNome(v.usuario_id)}</td>
                  <td>{v.descricao}</td>
                  <td>{v.arquivo_nome}</td>
                  <td>{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="td-actions">
                    <a 
                      href={`${API_BASE_URL}${v.arquivo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-view"
                    >
                      👁️
                    </a>
                    <button 
                      onClick={() => handleDelete(v.id)}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminVouchers;
