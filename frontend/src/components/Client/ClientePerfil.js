import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './ClientePerfil.css';

function ClientePerfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  const [loading, setLoading] = useState(true);
  const [salving, setSalving] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [msgType, setMsgType] = useState('');

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    const token = localStorage.getItem('token');
    const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/usuarios/${usuarioLocal.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar perfil');
      
      const data = await response.json();
      setUsuario(data);
      setFormData({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        endereco: data.endereco || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        cep: data.cep || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setMensagem('Erro ao carregar perfil');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');

    try {
      setSalving(true);
      const response = await fetch(`${API_BASE_URL}/api/usuarios/${usuarioLocal.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erro ao atualizar perfil');
      
      setMensagem('✅ Perfil atualizado com sucesso!');
      setMsgType('success');
      
      // Atualizar localStorage
      const usuarioAtualizado = { ...usuarioLocal, ...formData };
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMensagem('❌ Erro ao salvar perfil');
      setMsgType('error');
    } finally {
      setSalving(false);
    }
  };

  if (loading) {
    return <div className="cliente-perfil-container"><p>Carregando...</p></div>;
  }

  return (
    <div className="cliente-perfil-container">
      <div className="perfil-header">
        <h2>👤 Meu Perfil</h2>
        <button className="btn-voltar" onClick={() => navigate('/cliente/dashboard')}>← Voltar</button>
      </div>

      {mensagem && (
        <div className={`mensagem ${msgType}`}>
          {mensagem}
        </div>
      )}

      <div className="perfil-content">
        <form onSubmit={handleSalvar} className="perfil-form">
          <div className="form-section">
            <h3>📋 Dados Pessoais</h3>
            
            <div className="form-group">
              <label>Nome Completo *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled
              />
              <small>Email não pode ser alterado</small>
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                name="telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>📍 Endereço</h3>
            
            <div className="form-group">
              <label>Endereço</label>
              <input
                type="text"
                name="endereco"
                placeholder="Rua, número"
                value={formData.endereco}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="BA">Bahia</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="PR">Paraná</option>
                  <option value="DF">Distrito Federal</option>
                  {/* Adicione outros estados conforme necessário */}
                </select>
              </div>

              <div className="form-group">
                <label>CEP</label>
                <input
                  type="text"
                  name="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-salvar" disabled={salving}>
              {salving ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientePerfil;
