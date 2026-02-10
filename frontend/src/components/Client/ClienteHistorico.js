import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './ClienteHistorico.css';

function ClienteHistorico() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('concluido');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/agendamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const dados = await response.json();
        setAgendamentos(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const agendamentosFiltered = agendamentos.filter(a => a.status === filtroStatus);

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pendente: '#ff9800',
      atribuido: '#2196f3',
      em_andamento: '#9c27b0',
      concluido: '#4caf50',
      cancelado: '#f44336'
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendente: 'Pendente',
      atribuido: 'Atribuído',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído',
      cancelado: 'Cancelado'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="cliente-historico-container">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="cliente-historico-container">
      <div className="historico-header">
        <div className="header-title">
          <h2>📊 Histórico de Serviços</h2>
          <p>Consulte seus serviços anteriores</p>
        </div>
        <button className="btn-voltar" onClick={() => navigate('/cliente/dashboard')}>
          ← Voltar
        </button>
      </div>

      <div className="historico-content">
        <div className="filtro-section">
          <label>Filtrar por Status:</label>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="concluido">✅ Concluídos</option>
            <option value="em_andamento">🔧 Em Andamento</option>
            <option value="atribuido">📌 Atribuídos</option>
            <option value="pendente">⏳ Pendentes</option>
            <option value="cancelado">❌ Cancelados</option>
          </select>
        </div>

        {agendamentosFiltered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Nenhum serviço encontrado com este filtro</p>
          </div>
        ) : (
          <div className="historico-table-wrapper">
            <table className="historico-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Local/Loja</th>
                  <th>Status</th>
                  <th>Técnico</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendamentosFiltered.map(agendamento => (
                  <tr key={agendamento.id}>
                    <td className="cell-data">
                      {formatarData(agendamento.data_agendamento)}
                    </td>
                    <td className="cell-descricao">
                      {agendamento.descricao || '-'}
                    </td>
                    <td className="cell-local">
                      {agendamento.local || agendamento.loja || '-'}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(agendamento.status) }}
                      >
                        {getStatusLabel(agendamento.status)}
                      </span>
                    </td>
                    <td className="cell-tecnico">
                      {agendamento.tecnico_nome || '-'}
                    </td>
                    <td className="cell-acoes">
                      <button 
                        className="btn-detalhes"
                        onClick={() => navigate('/cliente/solicitacoes')}
                        title="Ver detalhes"
                      >
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="historico-info">
          <div className="info-card">
            <h4>💡 Dica</h4>
            <p>Use os filtros acima para encontrar serviços específicos. Clique em "Ver" para mais detalhes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClienteHistorico;
