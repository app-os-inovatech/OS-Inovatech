import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import '../Admin/Lojas.css';

function ClienteRelatorios() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAgendamentos();
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarAgendamentos, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/agendamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas agendamentos em execução
        const emExecucao = data.filter(ag => ag.status === 'em_andamento');
        setAgendamentos(emExecucao);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTempoExecucao = (dataInicio) => {
    if (!dataInicio) return '-';
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diffMs = agora - inicio;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHoras}h ${diffMinutos}min`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'em_andamento': { texto: '🔄 Em Execução', cor: '#007bff' }
    };
    const badge = badges[status] || { texto: status, cor: '#6c757d' };
    return (
      <span style={{
        backgroundColor: badge.cor,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: 'bold'
      }}>
        {badge.texto}
      </span>
    );
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/cliente/dashboard')} className="btn-back">← Voltar</button>
        <h1>📊 Relatórios - Lojas em Execução</h1>
      </header>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Carregando...</p>
          </div>
        ) : agendamentos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <h3 style={{ color: '#6c757d', marginBottom: '10px' }}>📋 Nenhum serviço em execução</h3>
            <p style={{ color: '#6c757d' }}>No momento não há lojas com serviços em andamento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {agendamentos.map((agendamento) => (
              <div key={agendamento.id} style={{
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1.3em' }}>
                      🏪 {agendamento.loja_nome || 'Loja não informada'}
                    </h3>
                    <p style={{ margin: '0', color: '#666', fontSize: '0.95em' }}>
                      {agendamento.franquia_nome || 'Franquia não informada'}
                    </p>
                  </div>
                  {getStatusBadge(agendamento.status)}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px',
                  marginBottom: '15px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Tipo de Serviço</p>
                    <p style={{ margin: '0', fontSize: '0.95em', color: '#333' }}>{agendamento.tipo_servico || '-'}</p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Início da Execução</p>
                    <p style={{ margin: '0', fontSize: '0.95em', color: '#333' }}>{formatarData(agendamento.data_inicio_execucao)}</p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Tempo Decorrido</p>
                    <p style={{ margin: '0', fontSize: '0.95em', color: '#007bff', fontWeight: 'bold' }}>
                      {calcularTempoExecucao(agendamento.data_inicio_execucao)}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: '#666', fontWeight: '600' }}>Previsão de Conclusão</p>
                    <p style={{ margin: '0', fontSize: '0.95em', color: '#333' }}>
                      {agendamento.data_final_montagem ? formatarData(agendamento.data_final_montagem) : 'Não definida'}
                    </p>
                  </div>
                </div>

                {agendamento.descricao_servico && (
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: '#856404', fontWeight: '600' }}>📝 Descrição do Serviço</p>
                    <p style={{ margin: '0', fontSize: '0.9em', color: '#856404' }}>{agendamento.descricao_servico}</p>
                  </div>
                )}

                {agendamento.observacoes && (
                  <div style={{ 
                    padding: '12px',
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '4px'
                  }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: '#0c5460', fontWeight: '600' }}>💬 Observações</p>
                    <p style={{ margin: '0', fontSize: '0.9em', color: '#0c5460' }}>{agendamento.observacoes}</p>
                  </div>
                )}

                <div style={{ 
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ margin: 0, fontSize: '0.85em', color: '#999' }}>
                    ID do Agendamento: #{agendamento.id}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      fontWeight: 'bold'
                    }}>
                      ✓ Serviço Ativo
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          border: '1px solid #007bff'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>ℹ️ Informações</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085' }}>
            <li>Esta página mostra apenas as lojas com serviços atualmente em execução</li>
            <li>Os dados são atualizados automaticamente a cada 30 segundos</li>
            <li>O tempo decorrido é calculado desde o início da execução do serviço</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ClienteRelatorios;
