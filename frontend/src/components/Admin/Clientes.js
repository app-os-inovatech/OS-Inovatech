import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import '../Admin/Lojas.css';

function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    razao_social: '',
    cnpj: '',
    endereco: ''
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.CLIENTES, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const formatarCNPJ = (valor) => {
    const cnpj = valor.replace(/\D/g, '');
    if (cnpj.length <= 14) {
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const buscarCNPJ = async (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;

    setBuscandoCNPJ(true);
    try {
      const token = localStorage.getItem('token');
      let response = await fetch(`${API_ENDPOINTS.LOJAS}/cnpj/${cnpjLimpo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      }

      if (response.ok) {
        const data = await response.json();
        const usarFantasia = cnpjLimpo.startsWith('13574594');
        const nomePreferido = usarFantasia ? data.nome_fantasia : data.razao_social;

        setFormData(prev => ({
          ...prev,
          nome: prev.nome || nomePreferido || prev.nome,
          razao_social: data.razao_social || prev.razao_social,
          endereco: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}` || prev.endereco,
          telefone: data.ddd_telefone_1 || prev.telefone,
          email: data.email || prev.email,
          cnpj: formatarCNPJ(cnpjLimpo)
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const handleCNPJChange = (e) => {
    const valor = e.target.value;
    const cnpjLimpo = valor.replace(/\D/g, '');
    const cnpjFinal = cnpjLimpo.substring(0, 14);
    const cnpjFormatado = formatarCNPJ(cnpjFinal);
    setFormData({ ...formData, cnpj: cnpjFormatado });

    if (cnpjFinal.length === 14) {
      buscarCNPJ(cnpjFinal);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${API_ENDPOINTS.CLIENTES}/${editando}`
        : API_ENDPOINTS.CLIENTES;
      
      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          senha: editando ? undefined : 'cliente123' // Senha padrão para novos clientes
        })
      });

      if (response.ok) {
        alert(editando ? 'Contato atualizado!' : 'Contato cadastrado!');
        setShowForm(false);
        setEditando(null);
        setFormData({ nome: '', email: '', telefone: '', razao_social: '', cnpj: '', endereco: '' });
        carregarClientes();
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleEdit = (cliente) => {
    setEditando(cliente.id);
    setFormData({
      nome: cliente.nome || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      razao_social: cliente.razao_social || '',
      cnpj: cliente.cnpj || '',
      endereco: cliente.endereco || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este contato?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.CLIENTES}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Contato excluído!');
      carregarClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>👥 Gerenciar Contatos</h1>
        <button onClick={() => { setShowForm(true); setEditando(null); }} className="btn-new">+ Novo Contato</button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editando ? 'Editar Contato' : 'Novo Contato'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Razão Social</label>
                  <input
                    type="text"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>CNPJ</label>
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

              <div className="form-row">
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
                <label>Endereço</label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  rows="3"
                />
              </div>

              {!editando && (
                <p style={{fontSize: '12px', color: '#666'}}>
                  * Senha padrão: cliente123 (o cliente pode alterar após o primeiro acesso)
                </p>
              )}

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
              <th>Email</th>
              <th>Razão Social</th>
              <th>CNPJ</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign: 'center'}}>Nenhum contato cadastrado</td>
              </tr>
            ) : (
              clientes.map(cliente => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.razao_social || '-'}</td>
                  <td>{cliente.cnpj || '-'}</td>
                  <td>{cliente.telefone || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(cliente)} className="btn-edit">✏️</button>
                    <button onClick={() => handleDelete(cliente.id)} className="btn-delete">🗑️</button>
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

export default Clientes;
