import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './Dashboard.css';

function Manuais() {
  const navigate = useNavigate();
  const [manuais, setManuais] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [uploadandoVideo, setUploadandoVideo] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [novoManual, setNovoManual] = useState({
    titulo: '',
    descricao: '',
    categoria: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    carregarManuais();
  }, []);

  const carregarManuais = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/manuais`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setManuais(data);
    } catch (err) {
      console.error('Erro ao carregar manuais:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!arquivo) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('titulo', novoManual.titulo);
    formData.append('descricao', novoManual.descricao);
    formData.append('categoria', novoManual.categoria);
    formData.append('manual', arquivo);

    try {
      const token = localStorage.getItem('token');
      const url = editando ? `${API_BASE_URL}/api/manuais/${editando}` : `${API_BASE_URL}/api/manuais`;
      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Manual enviado com sucesso!');
        setMostrarFormulario(false);
        setNovoManual({ titulo: '', descricao: '', categoria: '' });
        setArquivo(null);
        carregarManuais();
      } else {
        alert('Erro ao enviar manual');
      }
    } catch (err) {
      console.error('Erro ao enviar manual:', err);
      alert('Erro ao enviar manual');
    } finally {
      setUploading(false);
    }
  };

  const deletarManual = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este manual?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/manuais/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Manual excluído com sucesso!');
        carregarManuais();
      }
    } catch (err) {
      console.error('Erro ao excluir manual:', err);
    }
  };

  const iniciarEdicao = (manual) => {
    setEditando(manual.id);
    setNovoManual({
      titulo: manual.titulo,
      descricao: manual.descricao || '',
      categoria: manual.categoria || ''
    });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setNovoManual({ titulo: '', descricao: '', categoria: '' });
  };

  const salvarEdicao = async (id) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Enviando atualização:', novoManual);
      
      const response = await fetch(`${API_BASE_URL}/api/manuais/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoManual)
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('Manual atualizado:', resultado);
        alert('Manual atualizado com sucesso!');
        setEditando(null);
        setNovoManual({ titulo: '', descricao: '', categoria: '' });
        carregarManuais();
      } else {
        const erro = await response.json();
        console.error('Erro do servidor:', erro);
        alert(`Erro ao atualizar manual: ${erro.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao atualizar manual:', err);
      alert(`Erro ao atualizar manual: ${err.message}`);
    }
  };

  const visualizarManual = (manual) => {
    window.open(`${API_BASE_URL}/uploads/manuals/${manual.arquivo}`, '_blank');
  };

  const downloadManual = (manual) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/uploads/manuals/${manual.arquivo}`;
    link.download = manual.arquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadVideo = async (manualId, videoFile) => {
    if (!videoFile) {
      alert('Por favor, selecione um vídeo');
      return;
    }

    setUploadandoVideo(manualId);
    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/manuais/${manualId}/video`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Vídeo enviado com sucesso!');
        carregarManuais();
      } else {
        const erro = await response.json();
        alert(`Erro ao enviar vídeo: ${erro.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao enviar vídeo:', err);
      alert(`Erro ao enviar vídeo: ${err.message}`);
    } finally {
      setUploadandoVideo(null);
    }
  };

  const handleVideoUpload = (manualId, event) => {
    const videoFile = event.target.files[0];
    if (videoFile) {
      uploadVideo(manualId, videoFile);
    }
  };

  const visualizarVideo = (manual) => {
    if (manual.video) {
      window.open(`${API_BASE_URL}/uploads/videos/${manual.video}`, '_blank');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Biblioteca de Manuais Técnicos</h1>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-voltar" style={{ marginRight: '10px' }}>
            ← Voltar
          </button>
          <button 
            onClick={() => setMostrarFormulario(!mostrarFormulario)} 
            className="btn-card"
            style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {mostrarFormulario ? '✕ Cancelar' : '+ Novo Manual'}
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {mostrarFormulario && (
          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3>Adicionar Novo Manual</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título:</label>
                <input
                  type="text"
                  value={novoManual.titulo}
                  onChange={(e) => setNovoManual({...novoManual, titulo: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoria:</label>
                <select
                  value={novoManual.categoria}
                  onChange={(e) => setNovoManual({...novoManual, categoria: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="">Selecione...</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Instalação">Instalação</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Procedimentos">Procedimentos</option>
                  <option value="Segurança">Segurança</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição:</label>
                <textarea
                  value={novoManual.descricao}
                  onChange={(e) => setNovoManual({...novoManual, descricao: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Arquivo (PDF):</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setArquivo(e.target.files[0])}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                style={{
                  background: '#007bff',
                  color: 'white',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {uploading ? 'Enviando...' : '📤 Enviar Manual'}
              </button>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {manuais.map(manual => (
            <div key={manual.id} style={{
              background: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {editando === manual.id ? (
                // Modo de edição
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Título:</label>
                    <input
                      type="text"
                      value={novoManual.titulo}
                      onChange={(e) => setNovoManual({...novoManual, titulo: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Categoria:</label>
                    <select
                      value={novoManual.categoria}
                      onChange={(e) => setNovoManual({...novoManual, categoria: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                      <option value="">Selecione...</option>
                      <option value="Equipamentos">Equipamentos</option>
                      <option value="Instalação">Instalação</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Procedimentos">Procedimentos</option>
                      <option value="Segurança">Segurança</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Descrição:</label>
                    <textarea
                      value={novoManual.descricao}
                      onChange={(e) => setNovoManual({...novoManual, descricao: e.target.value})}
                      rows="3"
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => salvarEdicao(manual.id)}
                      style={{
                        flex: 1,
                        background: '#28a745',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓ Salvar
                    </button>
                    <button
                      onClick={cancelarEdicao}
                      style={{
                        flex: 1,
                        background: '#6c757d',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo de visualização
                <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginRight: '15px',
                  color: '#dc3545'
                }}>📄</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{manual.titulo}</h3>
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {manual.categoria}
                  </span>
                </div>
              </div>

              {manual.descricao && (
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
                  {manual.descricao}
                </p>
              )}

              <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '15px' }}>
                Enviado em: {new Date(manual.created_at).toLocaleDateString('pt-BR')}
              </div>

              {/* Seção de Vídeo */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '15px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#495057' }}>
                    🎥 Vídeo Tutorial
                  </span>
                  {manual.video && (
                    <span style={{ 
                      background: '#28a745', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      fontSize: '0.75rem' 
                    }}>
                      ✓ Disponível
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {manual.video ? (
                    <>
                      <button
                        onClick={() => visualizarVideo(manual)}
                        style={{
                          flex: 1,
                          background: '#6f42c1',
                          color: 'white',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}
                      >
                        ▶️ Assistir Vídeo
                      </button>
                      <label style={{
                        flex: 1,
                        background: '#fd7e14',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: uploadandoVideo === manual.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        opacity: uploadandoVideo === manual.id ? 0.6 : 1
                      }}>
                        {uploadandoVideo === manual.id ? '⏳ Enviando...' : '🔄 Trocar Vídeo'}
                        <input
                          type="file"
                          accept="video/mp4,video/mov,video/avi,video/mkv,video/webm"
                          onChange={(e) => handleVideoUpload(manual.id, e)}
                          disabled={uploadandoVideo === manual.id}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </>
                  ) : (
                    <label style={{
                      flex: 1,
                      background: '#6f42c1',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: uploadandoVideo === manual.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      opacity: uploadandoVideo === manual.id ? 0.6 : 1
                    }}>
                      {uploadandoVideo === manual.id ? '⏳ Enviando Vídeo...' : '📤 Adicionar Vídeo'}
                      <input
                        type="file"
                        accept="video/mp4,video/mov,video/avi,video/mkv,video/webm"
                        onChange={(e) => handleVideoUpload(manual.id, e)}
                        disabled={uploadandoVideo === manual.id}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => visualizarManual(manual)}
                  style={{
                    flex: 1,
                    background: '#17a2b8',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  👁️ Visualizar
                </button>
                <button
                  onClick={() => downloadManual(manual)}
                  style={{
                    flex: 1,
                    background: '#28a745',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() => iniciarEdicao(manual)}
                  style={{
                    background: '#ffc107',
                    color: '#000',
                    padding: '10px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => deletarManual(manual.id)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    padding: '10px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🗑️
                </button>
              </div>
              </>
              )}
            </div>
          ))}
        </div>

        {manuais.length === 0 && !mostrarFormulario && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📚</div>
            <h3>Nenhum manual cadastrado</h3>
            <p>Clique em "Novo Manual" para adicionar o primeiro manual técnico.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Manuais;
