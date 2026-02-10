import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../Admin/Lojas.css';

function ClienteSolicitacoes() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/agendamentos`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setAgendamentos(await response.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
        fontSize: '12px'
      }}>
        {labels[status] || status}
      </span>
    );
  };

  const iniciarEdicao = (agendamento) => {
    setEditandoId(agendamento.id);
    setFormEdicao({
      tipo_servico: agendamento.tipo_servico,
      data_hora: new Date(agendamento.data_hora).toISOString().slice(0, 16),
      descricao_servico: agendamento.descricao_servico || '',
      observacoes: agendamento.observacoes || ''
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setFormEdicao({});
  };

  const salvarEdicao = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formEdicao)
      });

      if (response.ok) {
        alert('Solicitação atualizada com sucesso!');
        setEditandoId(null);
        setFormEdicao({});
        carregarDados();
      } else {
        alert('Erro ao atualizar solicitação');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar solicitação');
    }
  };

  const excluirSolicitacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta solicitação? O administrador e o técnico atribuído serão notificados.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/agendamentos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Solicitação cancelada com sucesso! Notificações enviadas ao administrador e técnico.');
        carregarDados();
      } else {
        const error = await response.json();
        alert('Erro ao cancelar solicitação: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cancelar solicitação. Verifique sua conexão.');
    }
  };

  const podeEditar = (status) => {
    return status === 'pendente' || status === 'atribuido';
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/cliente/dashboard')} className="btn-back">← Voltar</button>
        <h1>📋 Minhas Solicitações</h1>
        <button onClick={() => navigate('/cliente/nova-solicitacao')} className="btn-new">+ Nova Solicitação</button>
      </header>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Loja</th>
              <th>Tipo de Serviço</th>
              <th>Status</th>
              <th>Técnico</th>
              <th>Observações</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center'}}>Nenhuma solicitação encontrada</td>
              </tr>
            ) : (
              agendamentos.map(agendamento => (
                editandoId === agendamento.id ? (
                  // Modo de edição
                  <tr key={agendamento.id} style={{backgroundColor: '#f9f9f9'}}>
                    <td>
                      <input
                        type="datetime-local"
                        value={formEdicao.data_hora}
                        onChange={(e) => setFormEdicao({...formEdicao, data_hora: e.target.value})}
                        style={{width: '100%', padding: '5px'}}
                      />
                    </td>
                    <td>{agendamento.loja_nome}</td>
                    <td>
                      <select
                        value={formEdicao.tipo_servico}
                        onChange={(e) => setFormEdicao({...formEdicao, tipo_servico: e.target.value})}
                        style={{width: '100%', padding: '5px'}}
                      >
                        <option value="Instalação">Instalação</option>
                        <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                        <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                        <option value="Substituição de Equipamento">Substituição de Equipamento</option>
                        <option value="Consultoria Técnica">Consultoria Técnica</option>
                        <option value="Treinamento">Treinamento</option>
                        <option value="BK é Fogo">BK é Fogo</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </td>
                    <td>{getStatusBadge(agendamento.status)}</td>
                    <td>{agendamento.tecnico_nome || 'Aguardando atribuição'}</td>
                    <td>
                      <textarea
                        value={formEdicao.observacoes}
                        onChange={(e) => setFormEdicao({...formEdicao, observacoes: e.target.value})}
                        style={{width: '100%', padding: '5px', minHeight: '60px'}}
                        placeholder="Observações..."
                      />
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '5px', flexDirection: 'column'}}>
                        <button 
                          onClick={() => salvarEdicao(agendamento.id)}
                          className="btn-edit"
                          style={{background: '#4caf50', fontSize: '12px', padding: '5px 10px'}}
                        >
                          ✓ Salvar
                        </button>
                        <button 
                          onClick={cancelarEdicao}
                          className="btn-delete"
                          style={{fontSize: '12px', padding: '5px 10px'}}
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Modo de visualização
                  <tr key={agendamento.id}>
                    <td>{new Date(agendamento.data_hora).toLocaleString('pt-BR')}</td>
                    <td>{agendamento.loja_nome}</td>
                    <td>{agendamento.tipo_servico}</td>
                    <td>{getStatusBadge(agendamento.status)}</td>
                    <td>{agendamento.tecnico_nome || 'Aguardando atribuição'}</td>
                    <td>{agendamento.observacoes || '-'}</td>
                    <td>
                      <div style={{display: 'flex', gap: '5px', flexDirection: 'column'}}>
                        {podeEditar(agendamento.status) && (
                          <>
                            <button 
                              onClick={() => iniciarEdicao(agendamento)}
                              className="btn-edit"
                              style={{fontSize: '12px', padding: '5px 10px'}}
                              title="Editar solicitação"
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => excluirSolicitacao(agendamento.id)}
                              className="btn-delete"
                              style={{fontSize: '12px', padding: '5px 10px'}}
                              title="Cancelar solicitação"
                            >
                              🚫 Cancelar
                            </button>
                          </>
                        )}
                        {!podeEditar(agendamento.status) && (
                          <span style={{fontSize: '11px', color: '#999'}}>
                            Não editável
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClienteSolicitacoes;
