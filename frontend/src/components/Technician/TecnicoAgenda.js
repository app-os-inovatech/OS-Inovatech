import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import ChecklistModal from './ChecklistModal';
import './Dashboard.css';

// Agenda do Técnico - Calendário Visual
function TecnicoAgenda() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklistModal, setChecklistModal] = useState({ isOpen: false, agendamento: null });
  const [checklistClienteModal, setChecklistClienteModal] = useState({ isOpen: false, agendamento: null });
  const [iniciarExecucaoModal, setIniciarExecucaoModal] = useState({ isOpen: false, agendamento: null });
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.AGENDAMENTOS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgendamentos(data);
      } else {
        console.error('Erro ao carregar agendamentos');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pendente: '#ff9800',
      atribuido: '#2196f3',
      em_andamento: '#9c27b0',
      concluido: '#4caf50',
      cancelado: '#f44336'
    };
    const labels = {
      pendente: 'Pendente',
      atribuido: 'Atribuído',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído',
      cancelado: 'Cancelado'
    };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        background: colors[status] || '#666',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {labels[status] || status}
      </span>
    );
  };

  const iniciarAgendamento = async (id) => {
    // Abrir modal para mostrar checklist do cliente antes de iniciar
    const agendamento = agendamentos.find(ag => ag.id === id);
    setIniciarExecucaoModal({ isOpen: true, agendamento });
  };

  const confirmarInicioExecucao = async (id) => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_ENDPOINTS.AGENDAMENTOS}/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'em_andamento',
            checkin_latitude: position.coords.latitude,
            checkin_longitude: position.coords.longitude,
            checkin_endereco: 'Localização capturada'
          })
        });

        if (response.ok) {
          alert('Execução iniciada com sucesso!');
          setIniciarExecucaoModal({ isOpen: false, agendamento: null });
          carregarAgendamentos();
        } else {
          alert('Erro ao iniciar execução');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao iniciar execução');
      }
    }, (error) => {
      alert('Erro ao obter localização: ' + error.message);
    });
  };

  const concluirAgendamento = async (id) => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_ENDPOINTS.AGENDAMENTOS}/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'concluido',
            checkout_latitude: position.coords.latitude,
            checkout_longitude: position.coords.longitude,
            checkout_endereco: 'Localização capturada'
          })
        });

        if (response.ok) {
          alert('Agendamento concluído com sucesso!');
          carregarAgendamentos();
        } else {
          alert('Erro ao concluir agendamento');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao concluir agendamento');
      }
    }, (error) => {
      alert('Erro ao obter localização: ' + error.message);
    });
  };

  // Funções do calendário
  const getDiasNoMes = (data) => {
    const ano = data.getFullYear();
    const mes = data.getMonth();
    return new Date(ano, mes + 1, 0).getDate();
  };

  const getPrimeiroDiaSemana = (data) => {
    const ano = data.getFullYear();
    const mes = data.getMonth();
    return new Date(ano, mes, 1).getDay();
  };

  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  };

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  };

  const getAgendamentosNoDia = (dia) => {
    return agendamentos.filter(ag => {
      const dataAg = new Date(ag.data_hora);
      return dataAg.getDate() === dia &&
             dataAg.getMonth() === mesAtual.getMonth() &&
             dataAg.getFullYear() === mesAtual.getFullYear();
    });
  };

  const renderCalendario = () => {
    const diasNoMes = getDiasNoMes(mesAtual);
    const primeiroDia = getPrimeiroDiaSemana(mesAtual);
    const dias = [];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Células vazias antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
      dias.push(<div key={`vazio-${i}`} className="dia-vazio"></div>);
    }

    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const agendamentosDia = getAgendamentosNoDia(dia);
      const temAgendamento = agendamentosDia.length > 0;
      const isHoje = new Date().getDate() === dia &&
                     new Date().getMonth() === mesAtual.getMonth() &&
                     new Date().getFullYear() === mesAtual.getFullYear();

      dias.push(
        <div
          key={dia}
          className={`dia-calendario ${temAgendamento ? 'dia-ocupado' : ''} ${isHoje ? 'dia-hoje' : ''}`}
          onClick={() => temAgendamento && setDiaSelecionado(dia)}
          style={{cursor: temAgendamento ? 'pointer' : 'default'}}
        >
          <div className="numero-dia">{dia}</div>
          {temAgendamento && (
            <div className="indicador-agendamento">
              {agendamentosDia.length}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendario">
        <div className="calendario-header">
          <button onClick={mesAnterior} className="btn-nav-mes">‹</button>
          <h2 className="mes-ano">
            {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={proximoMes} className="btn-nav-mes">›</button>
        </div>
        
        <div className="dias-semana">
          {diasSemana.map(dia => (
            <div key={dia} className="dia-semana-label">{dia}</div>
          ))}
        </div>
        
        <div className="grid-calendario">
          {dias}
        </div>
      </div>
    );
  };

  const agendamentosDoDia = diaSelecionado ? getAgendamentosNoDia(diaSelecionado) : [];

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/tecnico/dashboard')} className="btn-back">← Voltar</button>
        <h1>📅 Minha Agenda</h1>
      </header>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
          {/* Calendário */}
          <div style={{flex: '1', minWidth: '300px'}}>
            {renderCalendario()}
          </div>

          {/* Lista de agendamentos do dia selecionado */}
          {diaSelecionado && (
            <div style={{flex: '1', minWidth: '300px'}}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{marginTop: 0, color: '#2196f3'}}>
                  Agendamentos - {diaSelecionado} de {mesAtual.toLocaleDateString('pt-BR', { month: 'long' })}
                </h3>
                
                {agendamentosDoDia.length === 0 ? (
                  <p>Nenhum agendamento neste dia.</p>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {agendamentosDoDia.map(agendamento => (
                      <div key={agendamento.id} style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '15px',
                        background: '#f9f9f9'
                      }}>
                        <div style={{marginBottom: '10px'}}>
                          <strong style={{fontSize: '1.1em', color: '#333'}}>
                            {new Date(agendamento.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                        </div>
                        <div style={{marginBottom: '8px'}}>
                          <strong>Loja:</strong> {agendamento.loja_nome}
                        </div>
                        <div style={{marginBottom: '8px'}}>
                          <strong>Tipo:</strong> {agendamento.tipo_servico}
                        </div>
                        <div style={{marginBottom: '12px'}}>
                          <strong>Status:</strong> {getStatusBadge(agendamento.status)}
                        </div>
                        
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                          {agendamento.tipo_servico === 'Instalação' && (
                            <button 
                              onClick={() => setChecklistModal({ isOpen: true, agendamento })} 
                              className="btn-edit"
                              style={{background: '#ff9800', fontSize: '0.9em', padding: '6px 12px'}}
                              title="Preencher Checklist de Entrada de Obra"
                            >
                              📋 Checklist
                            </button>
                          )}
                          {agendamento.checklist && (
                            <button 
                              onClick={() => setChecklistClienteModal({ isOpen: true, agendamento })} 
                              className="btn-edit"
                              style={{background: '#9c27b0', fontSize: '0.9em', padding: '6px 12px'}}
                              title="Ver Checklist do Cliente"
                            >
                              👁️ Ver Checklist
                            </button>
                          )}
                          {agendamento.status === 'atribuido' && (
                            <button 
                              onClick={() => iniciarAgendamento(agendamento.id)} 
                              className="btn-edit"
                              style={{background: '#4caf50', fontSize: '0.9em', padding: '6px 12px'}}
                            >
                              ▶️ Iniciar
                            </button>
                          )}
                          {agendamento.status === 'em_andamento' && (
                            <button 
                              onClick={() => concluirAgendamento(agendamento.id)} 
                              className="btn-edit"
                              style={{background: '#2196f3', fontSize: '0.9em', padding: '6px 12px'}}
                            >
                              ✅ Concluir
                            </button>
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
      )}
      
      <ChecklistModal 
        isOpen={checklistModal.isOpen}
        onClose={() => setChecklistModal({ isOpen: false, agendamento: null })}
        agendamento={checklistModal.agendamento}
      />

      {/* Modal de Visualização do Checklist do Cliente */}
      {checklistClienteModal.isOpen && checklistClienteModal.agendamento && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <h2 style={{marginBottom: '20px', color: '#333'}}>📋 Checklist Preenchido pelo Cliente</h2>
            
            <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #007bff'}}>
              <p style={{margin: 0, fontSize: '0.95em', color: '#004085'}}>
                <strong>Loja:</strong> {checklistClienteModal.agendamento.loja_nome}<br/>
                <strong>Cliente:</strong> {checklistClienteModal.agendamento.cliente_nome}
              </p>
            </div>

            {renderChecklistCliente(checklistClienteModal.agendamento.checklist)}

            <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setChecklistClienteModal({ isOpen: false, agendamento: null })}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Iniciar Execução */}
      {iniciarExecucaoModal.isOpen && iniciarExecucaoModal.agendamento && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <h2 style={{marginBottom: '20px', color: '#007bff'}}>🚀 Iniciar Execução do Serviço</h2>
            
            <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107'}}>
              <p style={{margin: 0, fontSize: '0.95em', color: '#856404'}}>
                <strong>Loja:</strong> {iniciarExecucaoModal.agendamento.loja_nome}<br/>
                <strong>Tipo de Serviço:</strong> {iniciarExecucaoModal.agendamento.tipo_servico}
              </p>
            </div>

            <h3 style={{marginBottom: '15px', color: '#333', fontSize: '1.1em'}}>📋 Checklist Informado pelo Cliente:</h3>
            
            {iniciarExecucaoModal.agendamento.checklist ? (
              renderChecklistCliente(iniciarExecucaoModal.agendamento.checklist)
            ) : (
              <p style={{padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px', color: '#666'}}>
                Nenhum checklist foi preenchido pelo cliente.
              </p>
            )}

            <div style={{
              marginTop: '25px',
              padding: '15px',
              backgroundColor: '#d1ecf1',
              borderRadius: '8px',
              border: '1px solid #bee5eb'
            }}>
              <p style={{margin: 0, fontSize: '0.9em', color: '#0c5460'}}>
                ℹ️ Ao confirmar, a execução será iniciada e sua localização será registrada.
              </p>
            </div>

            <div style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setIniciarExecucaoModal({ isOpen: false, agendamento: null })}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => confirmarInicioExecucao(iniciarExecucaoModal.agendamento.id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ▶️ Confirmar e Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const renderChecklistCliente = (checklist) => {
  if (!checklist) return null;
  
  let checklistObj;
  try {
    checklistObj = typeof checklist === 'string' ? JSON.parse(checklist) : checklist;
  } catch (e) {
    return <p style={{color: '#dc3545'}}>Erro ao carregar checklist</p>;
  }

  const itens = [
    { key: 'civil_1_equipamentos', label: '1. Equipamentos e acessórios disponíveis', secao: 'Parte Civil' },
    { key: 'civil_2_piso_forro', label: '2. Piso e forro em condições', secao: 'Parte Civil' },
    { key: 'civil_3_agua', label: '3. Pontos de água quente/fria', secao: 'Parte Civil' },
    { key: 'civil_4_eletrica', label: '4. Pontos de elétrica disponíveis', secao: 'Parte Civil' },
    { key: 'civil_5_gas', label: '5. Pontos de gás disponíveis', secao: 'Parte Civil' },
    { key: 'exaustao_6_sistema', label: '6. Sistema de exaustão disponível', secao: 'Exaustão' },
    { key: 'exaustao_7_coifa', label: '7. Coifa Melting instalada', secao: 'Exaustão' },
    { key: 'exaustao_8_intertravamento', label: '8. Sistema de Intertravamento', secao: 'Exaustão' },
    { key: 'drive_9_base_sensores', label: '9. Base para sensores', secao: 'Drive' },
    { key: 'drive_10_fiacao', label: '10. Pontos de fiação interligados', secao: 'Drive' },
    { key: 'drive_11_totem', label: '11. Totem posicionado', secao: 'Drive' },
    { key: 'drive_12_tomadas', label: '12. Tomadas estabilizadas', secao: 'Drive' }
  ];

  const secoes = ['Parte Civil', 'Exaustão', 'Drive'];

  return (
    <div>
      {secoes.map(secao => (
        <div key={secao} style={{marginBottom: '20px'}}>
          <h4 style={{color: '#007bff', marginBottom: '10px', fontSize: '1em'}}>{secao}</h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {itens.filter(item => item.secao === secao).map(item => {
              const valor = checklistObj[item.key];
              const isSim = valor === 'sim' || valor === true;
              return (
                <div key={item.key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: isSim ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${isSim ? '#c3e6cb' : '#f5c6cb'}`,
                  borderRadius: '4px'
                }}>
                  <span style={{fontSize: '0.9em', color: '#333'}}>{item.label}</span>
                  <span style={{
                    fontWeight: 'bold',
                    color: isSim ? '#28a745' : '#dc3545',
                    fontSize: '0.95em'
                  }}>
                    {isSim ? '✓ SIM' : '✗ NÃO'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TecnicoAgenda;
