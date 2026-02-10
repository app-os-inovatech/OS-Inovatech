import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api';
import RelatorioModal from './RelatorioModal';
import ChecklistModal from './ChecklistModal';
import './Dashboard.css';

function TecnicoOS() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkinAtivo, setCheckinAtivo] = useState(null);
  const [fotosExecucao, setFotosExecucao] = useState([]);
  const [relatorioModal, setRelatorioModal] = useState({ isOpen: false, dados: null, fotosIniciais: [] });
  const [checklistModal, setChecklistModal] = useState({ isOpen: false, agendamento: null });

  useEffect(() => {
    carregarAgendamentos();
    carregarCheckin();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.AGENDAMENTOS, {
        headers: { Authorization: `Bearer ${token}` }
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

  const carregarCheckin = () => {
    // Limpar check-in antigo ao carregar a página
    localStorage.removeItem('checkin_ativo');
    setCheckinAtivo(null);
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
      atribuido: 'Atribuido',
      em_andamento: 'Em Andamento',
      concluido: 'Concluido',
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

  const iniciarMontagem = (agendamento) => {
    // Abrir modal de checklist antes de iniciar
    setChecklistModal({ isOpen: true, agendamento });
  };

  const iniciarAposChecklist = async (agendamento, checklistData) => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }
        
        // Salvar checklist no backend
        const checklistPayload = {
          ...checklistData,
          agendamento_id: agendamento.id,
          loja_id: agendamento.loja_id,
          latitude_checkin: position.coords.latitude,
          longitude_checkin: position.coords.longitude
        };

        console.log('📤 Enviando checklist:', checklistPayload);
        console.log('🔗 URL:', API_ENDPOINTS.CHECKLIST_ENTRADA_OBRA);

        const checklistRes = await fetch(API_ENDPOINTS.CHECKLIST_ENTRADA_OBRA, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(checklistPayload)
        });

        if (!checklistRes.ok) {
          const errorData = await checklistRes.json().catch(() => ({ message: 'Erro desconhecido' }));
          console.error('❌ Erro ao salvar checklist:', errorData);
          throw new Error(`Erro ao salvar checklist: ${errorData.message || checklistRes.statusText}`);
        }

        console.log('✅ Checklist salvo com sucesso');

        // Iniciar execução do agendamento
        const agendRes = await fetch(`${API_ENDPOINTS.AGENDAMENTOS}/${agendamento.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'em_andamento',
            data_inicio_execucao: new Date().toISOString(),
            checkin_latitude: position.coords.latitude,
            checkin_longitude: position.coords.longitude,
            checkin_data: new Date().toISOString()
          })
        });

        if (!agendRes.ok) {
          const errorData = await agendRes.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.error('❌ Erro ao iniciar execução:', errorData);
          throw new Error(`Erro ao iniciar execução: ${errorData.error || agendRes.statusText}`);
        }

        console.log('✅ Montagem iniciada com sucesso');

        alert('✅ Checklist preenchido e montagem iniciada com sucesso!');
        setChecklistModal({ isOpen: false, agendamento: null });
        carregarAgendamentos();
      } catch (error) {
        console.error('❌ Erro completo:', error);
        alert('Erro ao iniciar montagem:\n\n' + error.message);
      }
    }, (error) => {
      alert('Erro ao obter localização: ' + error.message);
    });
  };

  const abrirRelatorio = (agendamentoAlvo) => {
    if (!checkinAtivo) {
      alert('Nenhum check-in ativo. Inicie o dia antes de gerar o relatorio.');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocalizacao nao suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const horaFim = new Date().toISOString();
      const agendamento = agendamentoAlvo || agendamentos.find(a => a.id === checkinAtivo.agendamentoId);

      setRelatorioModal({
        isOpen: true,
        dados: {
          agendamentoId: agendamento?.id || checkinAtivo.agendamentoId,
          lojaId: agendamento?.loja_id,
          lojaNome: agendamento?.loja_nome || agendamento?.loja?.nome || checkinAtivo.lojaNome,
          tipoServico: agendamento?.tipo_servico,
          checkIn: checkinAtivo.horaInicio,
          checkOut: horaFim,
          checkInLatitude: checkinAtivo.latitude,
          checkInLongitude: checkinAtivo.longitude,
          checkOutLatitude: position.coords.latitude,
          checkOutLongitude: position.coords.longitude
        },
        fotosIniciais: fotosExecucao
      });
    }, (error) => {
      alert('Erro ao obter localizacao: ' + error.message);
    });
  };

  const finalizarRelatorio = () => {
    localStorage.removeItem('checkin_ativo');
    setCheckinAtivo(null);
    setFotosExecucao([]);
    setRelatorioModal({ isOpen: false, dados: null, fotosIniciais: [] });
    carregarAgendamentos();
  };

  const concluirAgendamento = async (id) => {
    if (!navigator.geolocation) {
      alert('Geolocalizacao nao suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/agendamentos/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'concluido',
            checkout_latitude: position.coords.latitude,
            checkout_longitude: position.coords.longitude,
            checkout_endereco: 'Localizacao capturada'
          })
        });

        if (response.ok) {
          alert('Agendamento concluido com sucesso!');
          carregarAgendamentos();
        } else {
          alert('Erro ao concluir agendamento');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao concluir agendamento');
      }
    }, (error) => {
      alert('Erro ao obter localizacao: ' + error.message);
    });
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/tecnico/dashboard')} className="btn-back">Voltar</button>
        <h1>Minhas Ordens de Servico</h1>
      </header>

      {loading ? (
        <p style={{padding: '20px'}}>Carregando...</p>
      ) : (
        <div className="table-container" style={{margin: '20px'}}>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Loja</th>
                <th>Tipo de Servico</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center'}}>Nenhum agendamento encontrado</td>
                </tr>
              ) : (
                agendamentos.map(agendamento => (
                  <tr key={agendamento.id}>
                    <td>{new Date(agendamento.data_hora).toLocaleString('pt-BR')}</td>
                    <td>{agendamento.loja_nome || agendamento.loja?.nome}</td>
                    <td>{agendamento.tipo_servico}</td>
                    <td>{getStatusBadge(agendamento.status)}</td>
                    <td>
                      {(agendamento.status === 'pendente' || agendamento.status === 'atribuido') && (
                        <button 
                          onClick={() => iniciarMontagem(agendamento)} 
                          className="btn-edit"
                          style={{background: '#4caf50', marginRight: '5px'}}
                          title="Preencher checklist e iniciar montagem"
                        >
                          Iniciar Montagem
                        </button>
                      )}

                      {agendamento.status === 'em_andamento' && (
                        <>
                          <button 
                            onClick={() => concluirAgendamento(agendamento.id)} 
                            className="btn-edit"
                            style={{background: '#673ab7', marginRight: '5px'}}
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => abrirRelatorio(agendamento)}
                            className="btn-edit"
                            style={{background: '#ff9800'}}
                            title="Abrir relatório de montagem"
                          >
                            Relatorio
                          </button>
                        </>
                      )}

                      {agendamento.status === 'concluido' && (
                        <span style={{color: '#4caf50', fontWeight: 'bold'}}>Finalizado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <RelatorioModal 
        isOpen={relatorioModal.isOpen}
        onClose={() => setRelatorioModal({ isOpen: false, dados: null, fotosIniciais: [] })}
        dados={relatorioModal.dados}
        fotosIniciais={relatorioModal.fotosIniciais || fotosExecucao}
        onSuccess={finalizarRelatorio}
      />

      <ChecklistModal
        isOpen={checklistModal.isOpen}
        onClose={() => setChecklistModal({ isOpen: false, agendamento: null })}
        agendamento={checklistModal.agendamento}
        onSubmit={(checklistData) => iniciarAposChecklist(checklistModal.agendamento, checklistData)}
      />
    </div>
  );
}

export default TecnicoOS;
