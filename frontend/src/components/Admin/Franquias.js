import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './Dashboard.css';

function Franquias() {
  const navigate = useNavigate();
  const [agendamentosPorFranquia, setAgendamentosPorFranquia] = useState({});
  const [franquiaSelecionada, setFranquiaSelecionada] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [marcas] = useState([
    {
      id: 1,
      nome: 'Burger King',
      logo: '/logos/Burger-King.png',
      ativo: true
    },
    {
      id: 2,
      nome: "Popeye's",
      logo: '/logos/Popeyes.jpg',
      ativo: true
    },
    {
      id: 3,
      nome: 'Starbucks',
      logo: '/logos/Starbucks.jpg',
      ativo: true
    },
    {
      id: 4,
      nome: 'Subway',
      logo: '/logos/Subway.png',
      ativo: true
    },
    {
      id: 5,
      nome: 'Pizza Hut',
      logo: '/logos/Pizza-hut.png',
      ativo: true
    },
    {
      id: 6,
      nome: "Bob's",
      logo: '/logos/Bobs.png',
      ativo: true
    }
  ]);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/agendamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Agrupar agendamentos por franquia
      const grouped = {};
      data.forEach(agend => {
        if (agend.franquia_nome) {
          if (!grouped[agend.franquia_nome]) {
            grouped[agend.franquia_nome] = [];
          }
          grouped[agend.franquia_nome].push(agend);
        }
      });
      setAgendamentosPorFranquia(grouped);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    }
  };

  const abrirAgendamentos = (nomeFranquia) => {
    const agends = agendamentosPorFranquia[nomeFranquia] || [];
    setAgendamentos(agends);
    setFranquiaSelecionada(nomeFranquia);
  };

  const fecharModal = () => {
    setFranquiaSelecionada(null);
    setAgendamentos([]);
  };

  const voltar = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Gerenciamento de Franquias</h1>
        <button onClick={voltar} className="btn-voltar">← Voltar</button>
      </header>

      <div className="dashboard-content">
        <h2>Marcas que Atendemos</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
          {marcas.map(marca => {
            const totalAgendamentos = agendamentosPorFranquia[marca.nome]?.length || 0;
            return (
            <div key={marca.id} 
            onClick={() => abrirAgendamentos(marca.nome)}
            style={{
              background: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}>
              <img 
                src={marca.logo} 
                alt={marca.nome}
                style={{
                  maxWidth: '180px',
                  maxHeight: '120px',
                  objectFit: 'contain',
                  marginBottom: '15px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                width: '180px',
                height: '120px',
                background: '#f0f0f0',
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#666',
                textAlign: 'center',
                padding: '10px'
              }}>
                {marca.nome}
              </div>
              <h3 style={{ 
                margin: '10px 0', 
                fontSize: '1.2rem',
                color: '#333',
                textAlign: 'center'
              }}>{marca.nome}</h3>
              <span style={{
                padding: '5px 15px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                backgroundColor: marca.ativo ? '#d4edda' : '#f8d7da',
                color: marca.ativo ? '#155724' : '#721c24',
                marginTop: '10px'
              }}>
                {marca.ativo ? '✓ Ativa' : '✗ Inativa'}
              </span>
              {totalAgendamentos > 0 && (
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  marginTop: '8px',
                  fontWeight: 'bold'
                }}>
                  📋 {totalAgendamentos} agendamento{totalAgendamentos !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            );
          })}
        </div>

        {/* Modal de Agendamentos */}
        {franquiaSelecionada && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={fecharModal}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '30px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              width: '90%'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Agendamentos - {franquiaSelecionada}</h2>
                <button onClick={fecharModal} style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '8px 15px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>✕ Fechar</button>
              </div>

              {agendamentos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhum agendamento encontrado para esta franquia.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {agendamentos.map(agend => (
                    <div key={agend.id} style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <strong>Cliente:</strong> {agend.cliente_nome || 'N/A'}
                        </div>
                        <div>
                          <strong>Loja:</strong> {agend.loja_nome || 'N/A'}
                        </div>
                        <div>
                          <strong>Data:</strong> {new Date(agend.data_agendamento).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <strong>Status:</strong> 
                          <span style={{
                            marginLeft: '8px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            backgroundColor: agend.status === 'concluido' ? '#d4edda' : 
                                           agend.status === 'em_andamento' ? '#fff3cd' : '#f8d7da',
                            color: agend.status === 'concluido' ? '#155724' : 
                                   agend.status === 'em_andamento' ? '#856404' : '#721c24'
                          }}>
                            {agend.status}
                          </span>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <strong>Descrição:</strong> {agend.descricao || 'Sem descrição'}
                        </div>
                        {agend.tecnico_nome && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong>Técnico:</strong> {agend.tecnico_nome}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Franquias;
