/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import './Lojas.css';

function Lojas() {
  const navigate = useNavigate();
  const [lojas, setLojas] = useState([]);
  const [franquias, setFranquias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    responsavel: '',
    cnpj: '',
    email: '',
    franquia_id: ''
  });
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);

  useEffect(() => {
    carregarLojas();
    carregarFranquias();
  }, []);

  const carregarFranquias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.FRANQUIAS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFranquias(data);
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
    }
  };

  const buscarCNPJ = async (cnpj) => {
    // Remove caracteres não numéricos
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpjLimpo.length !== 14) return;
    
    setBuscandoCNPJ(true);
    try {
      const token = localStorage.getItem('token');
      let response = await fetch(`${API_ENDPOINTS.LOJAS}/cnpj/${cnpjLimpo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fallback direto se o proxy falhar
      if (!response.ok) {
        response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      }

      if (response.ok) {
        const data = await response.json();
        const usarFantasia = cnpjLimpo.startsWith('13574594');
        const nomePreferido = usarFantasia ? data.nome_fantasia : data.razao_social;
        
        setFormData(prev => ({
          ...prev,
          nome: nomePreferido || data.razao_social || prev.nome,
          endereco: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}` || prev.endereco,
          cidade: data.municipio || prev.cidade,
          estado: data.uf || prev.estado,
          cep: data.cep || prev.cep,
          telefone: data.ddd_telefone_1 || prev.telefone,
          email: data.email || prev.email
        }));
        
        alert('Dados do CNPJ carregados com sucesso!');
      } else {
        alert('CNPJ não encontrado. Verifique o número digitado.');
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      alert('Erro ao buscar CNPJ. Tente novamente.');
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const formatarCNPJ = (valor) => {
    const cnpj = valor.replace(/\D/g, '');
    if (cnpj.length <= 14) {
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const handleCNPJChange = (e) => {
    const valor = e.target.value;
    const cnpjLimpo = valor.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    const cnpjFinal = cnpjLimpo.substring(0, 14);
    
    // Atualiza o formData com formatação
    const cnpjFormatado = formatarCNPJ(cnpjFinal);
    setFormData({...formData, cnpj: cnpjFormatado});
    
    // Se completou 14 dígitos, busca automaticamente
    if (cnpjFinal.length === 14) {
      console.log('Buscando CNPJ:', cnpjFinal);
      buscarCNPJ(cnpjFinal);
    }
  };

  const carregarLojas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.LOJAS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLojas(data);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${API_ENDPOINTS.LOJAS}/${editando}`
        : API_ENDPOINTS.LOJAS;
      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editando ? 'Loja atualizada!' : 'Loja cadastrada!');
        setShowForm(false);
        setEditando(null);
        setFormData({
          nome: '', endereco: '', cidade: '', estado: '', cep: '',
          telefone: '', responsavel: '', cnpj: '', email: '', franquia_id: ''
        });
        carregarLojas();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || data.message || 'Erro ao salvar loja');
      }
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      alert('Erro ao salvar loja');
    }
  };

  const handleEdit = (loja) => {
    setEditando(loja.id);
    setFormData({
      nome: loja.nome || '',
      endereco: loja.endereco || '',
      cidade: loja.cidade || '',
      estado: loja.estado || '',
      cep: loja.cep || '',
      telefone: loja.telefone || '',
      responsavel: loja.responsavel || '',
      cnpj: loja.cnpj || '',
      email: loja.email || '',
      franquia_id: loja.franquia_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta loja?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.LOJAS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Loja excluída!');
        carregarLojas();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || data.message || 'Erro ao excluir loja');
      }
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      alert('Erro ao excluir loja');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>🏪 Gerenciar Lojas</h1>
        <button onClick={() => { setShowForm(true); setEditando(null); }} className="btn-new">+ Nova Loja</button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editando ? 'Editar Loja' : 'Nova Loja'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Franquia *</label>
                  <select
                    value={formData.franquia_id}
                    onChange={(e) => setFormData({...formData, franquia_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione uma franquia</option>
                    {franquias.map(franquia => (
                      <option key={franquia.id} value={franquia.id}>
                        {franquia.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nome da Loja *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CNPJ {buscandoCNPJ && '🔍'}</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    maxLength="18"
                    disabled={buscandoCNPJ}
                  />
                  <small style={{color: '#666', fontSize: '0.85em'}}>
                    Digite o CNPJ completo para buscar automaticamente
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Endereço *</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    maxLength="2"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="form-group">
                  <label>CEP</label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Responsável</label>
                  <input
                    type="text"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Endereço</th>
              <th>Cidade/Estado</th>
              <th>Telefone</th>
              <th>Responsável</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lojas.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign: 'center'}}>Nenhuma loja cadastrada</td>
              </tr>
            ) : (
              lojas.map(loja => (
                <tr key={loja.id}>
                  <td>{loja.nome}</td>
                  <td>{loja.endereco}</td>
                  <td>{loja.cidade}/{loja.estado}</td>
                  <td>{loja.telefone}</td>
                  <td>{loja.responsavel}</td>
                  <td>
                    <button onClick={() => handleEdit(loja)} className="btn-edit">✏️</button>
                    <button onClick={() => handleDelete(loja.id)} className="btn-delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Lojas;
