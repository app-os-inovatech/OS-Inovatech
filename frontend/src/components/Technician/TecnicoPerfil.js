import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../Client/ClientePerfil.css';

function TecnicoPerfil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salving, setSalving] = useState(false);
  const [salvingSenha, setSalvingSenha] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [msgType, setMsgType] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    especialidade: '',
    certificados: '',
    anos_experiencia: '',
    status: 'ativo',
    disponivel: true
  });
  const [senhaData, setSenhaData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  });

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao carregar perfil');

      const data = await response.json();
      setFormData({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cpf: data.tecnico?.cpf || '',
        especialidade: data.tecnico?.especialidade || '',
        certificados: data.tecnico?.certificados || '',
        anos_experiencia: data.tecnico?.anos_experiencia ?? '',
        status: data.tecnico?.status || 'ativo',
        disponivel: data.tecnico?.disponivel !== undefined ? Boolean(data.tecnico.disponivel) : true
      });

      if (data.tecnico?.foto) {
        setFotoPreview(`${API_BASE_URL}${data.tecnico.foto}`);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setMensagem('Erro ao carregar perfil');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      setSalving(true);
      const form = new FormData();
      form.append('nome', formData.nome);
      form.append('telefone', formData.telefone);
      form.append('cpf', formData.cpf);
      form.append('especialidade', formData.especialidade);
      form.append('certificados', formData.certificados);
      form.append('anos_experiencia', formData.anos_experiencia);
      form.append('status', formData.status);
      form.append('disponivel', formData.disponivel ? '1' : '0');
      if (fotoFile) {
        form.append('foto', fotoFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/tecnico/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!response.ok) throw new Error('Erro ao atualizar perfil');

      setMensagem('✅ Perfil atualizado com sucesso!');
      setMsgType('success');

      const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
      const usuarioAtualizado = { ...usuarioLocal, nome: formData.nome, telefone: formData.telefone };
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));

      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setMensagem('❌ Erro ao salvar perfil');
      setMsgType('error');
    } finally {
      setSalving(false);
    }
  };

  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setSenhaData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSalvarSenha = async (e) => {
    e.preventDefault();
    if (senhaData.novaSenha.length < 6) {
      setMensagem('❌ A senha deve ter pelo menos 6 caracteres');
      setMsgType('error');
      return;
    }
    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      setMensagem('❌ As senhas não conferem');
      setMsgType('error');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      setSalvingSenha(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/first-access-password`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ novaSenha: senhaData.novaSenha })
      });

      if (!response.ok) throw new Error('Erro ao redefinir senha');

      setMensagem('✅ Senha redefinida com sucesso!');
      setMsgType('success');
      setSenhaData({ novaSenha: '', confirmarSenha: '' });
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setMensagem('❌ Erro ao redefinir senha');
      setMsgType('error');
    } finally {
      setSalvingSenha(false);
    }
  };

  if (loading) {
    return <div className="cliente-perfil-container"><p>Carregando...</p></div>;
  }

  return (
    <div className="cliente-perfil-container">
      <div className="perfil-header">
        <h2>👤 Meu Perfil (Técnico)</h2>
        <button className="btn-voltar" onClick={() => navigate('/tecnico/dashboard')}>← Voltar</button>
      </div>

      {mensagem && (
        <div className={`mensagem ${msgType}`}>
          {mensagem}
        </div>
      )}

      <div className="perfil-content">
        <form onSubmit={handleSalvar} className="perfil-form">
          <div className="form-section">
            <h3>📷 Foto do Técnico</h3>
            <div className="form-group">
              <label>Foto</label>
              <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleFotoChange} />
              {fotoPreview && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={fotoPreview}
                    alt="Pré-visualização"
                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>📋 Dados Pessoais</h3>
            <div className="form-group">
              <label>Nome Completo *</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} disabled />
              <small>Email não pode ser alterado</small>
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <h3>🔧 Dados Profissionais</h3>
            <div className="form-group">
              <label>CPF</label>
              <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Especialidade</label>
              <input type="text" name="especialidade" value={formData.especialidade} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Certificados</label>
              <input type="text" name="certificados" value={formData.certificados} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Anos de Experiência</label>
              <input
                type="number"
                name="anos_experiencia"
                min="0"
                value={formData.anos_experiencia}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="ferias">Férias</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="disponivel"
                  checked={formData.disponivel}
                  onChange={handleChange}
                />
                Disponível para atendimento
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-salvar" disabled={salving}>
              {salving ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </form>

        <form onSubmit={handleSalvarSenha} className="perfil-form" style={{ marginTop: '30px' }}>
          <div className="form-section">
            <h3>🔒 Redefinir Senha</h3>
            <div className="form-group">
              <label>Nova Senha</label>
              <input type="password" name="novaSenha" value={senhaData.novaSenha} onChange={handleSenhaChange} />
            </div>
            <div className="form-group">
              <label>Confirmar Senha</label>
              <input type="password" name="confirmarSenha" value={senhaData.confirmarSenha} onChange={handleSenhaChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-salvar" disabled={salvingSenha}>
              {salvingSenha ? 'Salvando...' : '🔁 Redefinir Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TecnicoPerfil;
