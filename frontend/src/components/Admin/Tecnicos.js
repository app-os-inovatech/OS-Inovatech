import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../Admin/Lojas.css';

function Tecnicos() {
  const navigate = useNavigate();
  const [tecnicos, setTecnicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    especialidade: '',
    anos_experiencia: ''
  });

  useEffect(() => {
    carregarTecnicos();
  }, []);

  const carregarTecnicos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tecnicos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTecnicos(data);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${API_BASE_URL}/api/tecnicos/${editando}`
        : `${API_BASE_URL}/api/tecnicos`;
      
      // Usar FormData para enviar arquivo
      const formDataToSend = new FormData();
      formDataToSend.append('nome', formData.nome);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefone', formData.telefone);
      formDataToSend.append('cpf', formData.cpf);
      formDataToSend.append('especialidade', formData.especialidade);
      formDataToSend.append('anos_experiencia', formData.anos_experiencia);
      
      if (fotoFile) {
        formDataToSend.append('foto', fotoFile);
      }
      
      if (!editando) {
        formDataToSend.append('senha', 'tecnico123');
      }

      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      let data = null;
      try {
        data = await response.json();
      } catch (err) {
        // Ignorar erro de parse
      }

      if (response.ok) {
        alert(editando ? 'Técnico atualizado!' : 'Técnico cadastrado!');
        setShowForm(false);
        setEditando(null);
        setFormData({ nome: '', email: '', telefone: '', cpf: '', especialidade: '', anos_experiencia: '' });
        setFotoFile(null);
        setFotoPreview(null);

        if (data?.tecnico) {
          setTecnicos((prev) => {
            if (editando) {
              return prev.map((t) => (t.id === data.tecnico.id ? data.tecnico : t));
            }
            return [...prev, data.tecnico];
          });
        } else {
          carregarTecnicos();
        }
      } else {
        let errorMessage = 'Erro ao salvar técnico';
        if (data?.error) {
          errorMessage = data.error;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar técnico:', error);
      alert('Erro ao salvar técnico');
    }
  };

  const handleEdit = (tecnico) => {
    setEditando(tecnico.id);
    setFormData({
      nome: tecnico.nome || '',
      email: tecnico.email || '',
      telefone: tecnico.telefone || '',
      cpf: tecnico.cpf || '',
      especialidade: tecnico.especialidade || '',
      anos_experiencia: tecnico.anos_experiencia || ''
    });
    setFotoFile(null);
    setFotoPreview(tecnico.foto ? `${API_BASE_URL}${tecnico.foto}` : null);
    setShowForm(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este técnico?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/tecnicos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Técnico excluído!');
      carregarTecnicos();
    } catch (error) {
      console.error('Erro ao excluir técnico:', error);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>🔧 Gerenciar Técnicos</h1>
        <button onClick={() => { 
          setShowForm(true); 
          setEditando(null); 
          setFotoFile(null); 
          setFotoPreview(null);
        }} className="btn-new">+ Novo Técnico</button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editando ? 'Editar Técnico' : 'Novo Técnico'}</h2>
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
                  <label>CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
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

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Foto do Colaborador</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFotoChange}
                    style={{ padding: '10px' }}
                  />
                  {fotoPreview && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img 
                        src={fotoPreview} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '150px', 
                          maxHeight: '150px', 
                          borderRadius: '10px',
                          border: '2px solid #ddd',
                          objectFit: 'cover'
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Especialidade</label>
                  <input
                    type="text"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({...formData, especialidade: e.target.value})}
                    placeholder="Ex: Manutenção Elétrica"
                  />
                </div>
                <div className="form-group">
                  <label>Anos de Experiência</label>
                  <input
                    type="number"
                    value={formData.anos_experiencia}
                    onChange={(e) => setFormData({...formData, anos_experiencia: e.target.value})}
                    min="0"
                  />
                </div>
              </div>

              {!editando && (
                <p style={{fontSize: '12px', color: '#666'}}>
                  * Senha padrão: tecnico123 (o técnico pode alterar após o primeiro acesso)
                </p>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => { 
                  setShowForm(false); 
                  setEditando(null); 
                  setFotoFile(null); 
                  setFotoPreview(null);
                }} className="btn-cancel">
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
              <th>Foto</th>
              <th>Nome</th>
              <th>Email</th>
              <th>CPF</th>
              <th>Especialidade</th>
              <th>Experiência</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tecnicos.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center'}}>Nenhum técnico cadastrado</td>
              </tr>
            ) : (
              tecnicos.map(tecnico => (
                <tr key={tecnico.id}>
                  <td>
                    {tecnico.foto ? (
                      <img 
                        src={`${API_BASE_URL}${tecnico.foto}`} 
                        alt={tecnico.nome}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #ddd'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        👤
                      </div>
                    )}
                  </td>
                  <td>{tecnico.nome}</td>
                  <td>{tecnico.email}</td>
                  <td>{tecnico.cpf || '-'}</td>
                  <td>{tecnico.especialidade || '-'}</td>
                  <td>{tecnico.anos_experiencia ? `${tecnico.anos_experiencia} anos` : '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: tecnico.status === 'ativo' ? '#4caf50' : '#f44336',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {tecnico.status || 'ativo'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(tecnico)} className="btn-edit">✏️</button>
                    <button onClick={() => handleDelete(tecnico.id)} className="btn-delete">🗑️</button>
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

export default Tecnicos;
