import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../Admin/Lojas.css';

function TecnicoManuais() {
  const navigate = useNavigate();
  const [manuais, setManuais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [categorias, setCategorias] = useState([]);

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
      
      // Extrair categorias únicas
      const cats = [...new Set(data.map(m => m.categoria).filter(Boolean))];
      setCategorias(cats);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar manuais:', error);
      setLoading(false);
    }
  };

  const manuaisFiltrados = manuais.filter(manual => {
    const matchTexto = manual.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (manual.descricao && manual.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategoria = !filtroCategoria || manual.categoria === filtroCategoria;
    return matchTexto && matchCategoria;
  });

  const baixarManual = (manual) => {
    if (manual.arquivo) {
      window.open(`${API_BASE_URL}/uploads/manuals/${manual.arquivo}`, '_blank');
    }
  };

  const assistirVideo = (manual) => {
    if (manual.video) {
      window.open(`${API_BASE_URL}/uploads/videos/${manual.video}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '20px' }}>
        <h2>📚 Manuais Técnicos</h2>
        <p>Carregando manuais...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📚 Manuais Técnicos</h2>
        <button onClick={() => navigate('/tecnico/dashboard')} className="btn-cancelar">Voltar</button>
      </div>

      {/* Filtros */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Pesquisar manuais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            flex: 1,
            minWidth: '200px'
          }}
        />
        
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">Todas as categorias</option>
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Lista de Manuais */}
      {manuaisFiltrados.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          Nenhum manual encontrado
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {manuaisFiltrados.map(manual => (
            <div
              key={manual.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{manual.titulo}</h3>
              
              {manual.categoria && (
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#e9ecef',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.85em',
                  marginBottom: '10px',
                  width: 'fit-content'
                }}>
                  📂 {manual.categoria}
                </span>
              )}
              
              {manual.descricao && (
                <p style={{
                  color: '#666',
                  fontSize: '0.95em',
                  marginBottom: '15px',
                  flex: 1
                }}>
                  {manual.descricao}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                {manual.arquivo && (
                  <button
                    onClick={() => baixarManual(manual)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    📄 Manual
                  </button>
                )}
                
                {manual.video && (
                  <button
                    onClick={() => assistirVideo(manual)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    🎥 Vídeo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TecnicoManuais;
