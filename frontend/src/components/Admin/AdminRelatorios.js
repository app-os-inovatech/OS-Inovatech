import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../Technician/Dashboard.css';

function AdminRelatorios() {
  const navigate = useNavigate();
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/relatorios-diarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRelatorios(data);
      } else {
        console.error('Erro ao carregar relatórios');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const calcularDuracao = (checkIn, checkOut) => {
    const inicio = new Date(checkIn);
    const fim = new Date(checkOut);
    const duracao = Math.floor((fim - inicio) / 1000 / 60); // em minutos
    return `${Math.floor(duracao / 60)}h ${duracao % 60}min`;
  };

  const relatoriosFiltrados = relatorios.filter(rel => {
    const matchTecnico = !filtroTecnico || rel.tecnico_nome.toLowerCase().includes(filtroTecnico.toLowerCase());
    const matchLoja = !filtroLoja || rel.loja_nome.toLowerCase().includes(filtroLoja.toLowerCase());
    return matchTecnico && matchLoja;
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>📄 Relatórios Diários - Todos os Técnicos</h1>
      </header>

      {/* Filtros */}
      <div style={{padding: '20px', background: 'white', margin: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              Filtrar por Técnico
            </label>
            <input
              type="text"
              placeholder="Digite o nome do técnico..."
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em'
              }}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              Filtrar por Loja
            </label>
            <input
              type="text"
              placeholder="Digite o nome da loja..."
              value={filtroLoja}
              onChange={(e) => setFiltroLoja(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em'
              }}
            />
          </div>
        </div>
        <p style={{marginTop: '15px', color: '#666', fontSize: '0.9em'}}>
          <strong>Total de relatórios:</strong> {relatoriosFiltrados.length}
        </p>
      </div>

      {loading ? (
        <p style={{padding: '20px'}}>Carregando...</p>
      ) : relatoriosFiltrados.length === 0 ? (
        <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
          <p style={{fontSize: '3em'}}>📝</p>
          <p>Nenhum relatório encontrado</p>
        </div>
      ) : (
        <div style={{padding: '20px'}}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {relatoriosFiltrados.map(relatorio => (
              <div
                key={relatorio.id}
                style={{
                  background: 'white',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={() => setRelatorioSelecionado(relatorio)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}>
                  👤 {relatorio.tecnico_nome}
                </div>

                <h3 style={{
                  margin: '0 0 15px 0',
                  color: '#333',
                  fontSize: '1.1em',
                  borderBottom: '2px solid #f0f0f0',
                  paddingBottom: '10px'
                }}>
                  {relatorio.loja_nome}
                </h3>
                
                <div style={{fontSize: '0.9em', color: '#666', marginBottom: '15px'}}>
                  <p style={{margin: '5px 0'}}>
                    <strong>Data:</strong> {formatarData(relatorio.check_in).split(',')[0]}
                  </p>
                  <p style={{margin: '5px 0'}}>
                    <strong>Duração:</strong> {calcularDuracao(relatorio.check_in, relatorio.check_out)}
                  </p>
                  <p style={{margin: '5px 0'}}>
                    <strong>Tipo:</strong> {relatorio.tipo_servico}
                  </p>
                  <p style={{margin: '5px 0'}}>
                    <strong>Local:</strong> {relatorio.loja_cidade} - {relatorio.loja_estado}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '5px',
                  flexWrap: 'wrap',
                  marginTop: '10px'
                }}>
                  {relatorio.fotos && relatorio.fotos.slice(0, 4).map((foto, idx) => (
                    <img
                      key={idx}
                      src={foto}
                      alt={`Preview ${idx + 1}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '2px solid #ddd'
                      }}
                    />
                  ))}
                  {relatorio.fotos && relatorio.fotos.length > 4 && (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f0f0f0',
                      borderRadius: '6px',
                      border: '2px solid #ddd',
                      fontSize: '0.9em',
                      fontWeight: 'bold',
                      color: '#666'
                    }}>
                      +{relatorio.fotos.length - 4}
                    </div>
                  )}
                </div>

                <button
                  style={{
                    marginTop: '15px',
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Ver Detalhes →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Relatório */}
      {relatorioSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, color: '#333'}}>📄 Relatório Detalhado</h2>
              <button
                onClick={() => setRelatorioSelecionado(null)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  cursor: 'pointer',
                  fontSize: '1.5em'
                }}
              >
                ×
              </button>
            </div>

            {/* Cabeçalho com Informações */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '25px'
            }}>
              <h3 style={{margin: '0 0 15px 0'}}>👤 {relatorioSelecionado.tecnico_nome}</h3>
              <h4 style={{margin: '0 0 15px 0', fontSize: '1.1em'}}>{relatorioSelecionado.loja_nome}</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95em'}}>
                <div>
                  <strong>Endereço:</strong><br/>
                  {relatorioSelecionado.loja_endereco}<br/>
                  {relatorioSelecionado.loja_cidade} - {relatorioSelecionado.loja_estado}
                </div>
                <div>
                  <strong>Tipo de Serviço:</strong><br/>
                  {relatorioSelecionado.tipo_servico}
                </div>
                <div>
                  <strong>Check-in:</strong><br/>
                  {formatarData(relatorioSelecionado.check_in)}
                </div>
                <div>
                  <strong>Check-out:</strong><br/>
                  {formatarData(relatorioSelecionado.check_out)}
                </div>
              </div>
              <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)'}}>
                <strong>Duração Total:</strong> {calcularDuracao(relatorioSelecionado.check_in, relatorioSelecionado.check_out)}
              </div>
            </div>

            {/* Relato de Execução */}
            <div style={{marginBottom: '25px'}}>
              <h4 style={{color: '#333', marginBottom: '10px'}}>📝 Relato de Execução</h4>
              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {relatorioSelecionado.relato_execucao}
              </div>
            </div>

            {/* Fotos */}
            <div>
              <h4 style={{color: '#333', marginBottom: '15px'}}>
                📷 Fotos do Local ({relatorioSelecionado.fotos?.length || 0})
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {relatorioSelecionado.fotos?.map((foto, idx) => (
                  <img
                    key={idx}
                    src={foto}
                    alt={`Foto ${idx + 1}`}
                    onClick={() => setFotoAmpliada(foto)}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Foto Ampliada */}
      {fotoAmpliada && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setFotoAmpliada(null)}
        >
          <img
            src={fotoAmpliada}
            alt="Foto ampliada"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <button
            onClick={() => setFotoAmpliada(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              color: '#333',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              fontSize: '2em',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminRelatorios;
