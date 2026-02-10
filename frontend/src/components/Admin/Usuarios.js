import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './Lojas.css';

function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'cliente',
    ativo: true
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.USUARIOS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${API_ENDPOINTS.USUARIOS}/${editando}`
        : API_ENDPOINTS.REGISTER;
      
      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editando ? 'Usuário atualizado!' : 'Usuário cadastrado!');
        setShowForm(false);
        setEditando(null);
        setFormData({
          nome: '', email: '', senha: '', tipo: 'cliente', ativo: true
        });
        carregarUsuarios();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario) => {
    setEditando(usuario.id);
    setFormData({
      nome: usuario.nome || '',
      email: usuario.email || '',
      senha: '',
      tipo: usuario.tipo || 'cliente',
      ativo: usuario.ativo !== undefined ? usuario.ativo : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este usuário?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.USUARIOS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Usuário excluído!');
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const getTipoBadge = (tipo) => {
    const colors = {
      admin: '#f44336',
      tecnico: '#2196f3',
      cliente: '#4caf50'
    };
    const labels = {
      admin: 'Administrador',
      tecnico: 'Técnico',
      cliente: 'Contato'
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '4px',
        background: colors[tipo] || '#666',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {labels[tipo] || tipo}
      </span>
    );
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>👥 Gerenciar Usuários</h1>
        <button onClick={() => { setShowForm(true); setEditando(null); }} className="btn-new">+ Novo Usuário</button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Completo *</label>
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
                  <label>Tipo de Usuário *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    required
                  >
                    <option value="cliente">Contato</option>
                    <option value="tecnico">Técnico</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <small style={{color: '#666', fontSize: '0.85em'}}>
                    Define as permissões do usuário no sistema
                  </small>
                </div>
                <div className="form-group">
                  <label>Senha {editando && '(deixe em branco para manter)'}</label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    required={!editando}
                    placeholder={editando ? 'Nova senha (opcional)' : 'Digite a senha'}
                    minLength="6"
                  />
                </div>
              </div>

              {editando && (
                <div className="form-group">
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                    />
                    <span>Usuário ativo</span>
                  </label>
                </div>
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
              <th>Tipo</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="6" style={{textAlign: 'center'}}>Nenhum usuário cadastrado</td>
              </tr>
            ) : (
              usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.nome}</td>
                  <td>{usuario.email}</td>
                  <td>{getTipoBadge(usuario.tipo)}</td>
                  <td>
                    <span style={{
                      color: usuario.ativo ? '#4caf50' : '#f44336',
                      fontWeight: 'bold'
                    }}>
                      {usuario.ativo ? '✓ Ativo' : '✗ Inativo'}
                    </span>
                  </td>
                  <td>{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button onClick={() => handleEdit(usuario)} className="btn-edit">✏️</button>
                    <button onClick={() => handleDelete(usuario.id)} className="btn-delete">🗑️</button>
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

export default Usuarios;
