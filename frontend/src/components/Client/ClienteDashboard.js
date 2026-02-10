import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './Dashboard.css';

function ClienteDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    concluidos: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/agendamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const dados = await response.json();
        setAgendamentos(dados);
        
        // Calcular estatísticas
        const statsCalc = {
          total: dados.length,
          pendentes: dados.filter(a => a.status === 'pendente').length,
          emAndamento: dados.filter(a => a.status === 'em_andamento').length,
          concluidos: dados.filter(a => a.status === 'concluido').length
        };
        setStats(statsCalc);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const proximosAgendamentos = agendamentos
    .filter(a => a.status !== 'concluido' && a.status !== 'cancelado')
    .slice(0, 3);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏠 Portal do Cliente</h1>
          <p>Gerenciamento de Ordens de Serviço</p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>👤 {usuario.nome}</span>
            <button 
              className="btn-perfil" 
              onClick={() => navigate('/cliente/perfil')}
              title="Editar Perfil"
            >
              ⚙️ Perfil
            </button>
            <button onClick={handleLogout} className="btn-logout">🚪 Sair</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Bem-vindo, {usuario.nome}! 👋</h2>
          <p>Acompanhe suas solicitações de serviço em tempo real</p>
        </div>

        {/* Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-label">Total de Solicitações</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-label">Pendentes</div>
              <div className="stat-value">{stats.pendentes}</div>
            </div>
          </div>

          <div className="stat-card inprogress">
            <div className="stat-icon">🔧</div>
            <div className="stat-info">
              <div className="stat-label">Em Andamento</div>
              <div className="stat-value">{stats.emAndamento}</div>
            </div>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-label">Concluídos</div>
              <div className="stat-value">{stats.concluidos}</div>
            </div>
          </div>
        </div>

        {/* Menu Principal */}
        <div className="dashboard-grid">
          <div className="dashboard-card primary">
            <h3>📋 Minhas Solicitações</h3>
            <p>Visualizar e acompanhar todas as suas ordens de serviço</p>
            <button className="btn-card" onClick={() => navigate('/cliente/solicitacoes')}>
              Acessar Solicitações →
            </button>
          </div>

          <div className="dashboard-card primary">
            <h3>➕ Nova Solicitação</h3>
            <p>Solicitar um novo serviço de montagem ou manutenção</p>
            <button className="btn-card" onClick={() => navigate('/cliente/nova-solicitacao')}>
              Criar Solicitação →
            </button>
          </div>

          <div className="dashboard-card primary">
            <h3>📊 Relatórios</h3>
            <p>Ver status de todas as suas lojas em execução</p>
            <button className="btn-card" onClick={() => navigate('/cliente/relatorios')}>
              Ver Relatórios →
            </button>
          </div>

          <div className="dashboard-card">
            <h3>🕐 Histórico</h3>
            <p>Consultar serviços já realizados</p>
            <button className="btn-card secondary" onClick={() => navigate('/cliente/historico')}>
              Ver Histórico →
            </button>
          </div>

          <div className="dashboard-card">
            <h3>💬 Contato</h3>
            <p>Entre em contato com nosso suporte técnico</p>
            <button className="btn-card secondary" onClick={() => navigate('/cliente/contato')}>
              Falar com Suporte →
            </button>
          </div>

          <div className="dashboard-card">
            <h3>📖 FAQ</h3>
            <p>Dúvidas frequentes e respostas úteis</p>
            <button className="btn-card secondary" onClick={() => navigate('/cliente/faq')}>
              Ver FAQ →
            </button>
          </div>
        </div>

        {/* Próximos Agendamentos */}
        {proximosAgendamentos.length > 0 && (
          <div className="upcoming-section">
            <h3>📅 Próximas Solicitações</h3>
            <div className="upcoming-list">
              {proximosAgendamentos.map(agendamento => (
                <div key={agendamento.id} className="upcoming-item">
                  <div className="upcoming-info">
                    <div className="upcoming-title">{agendamento.descricao || 'Serviço'}</div>
                    <div className="upcoming-meta">
                      <span className="upcoming-date">📅 {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')}</span>
                      <span className={`upcoming-status status-${agendamento.status}`}>
                        {agendamento.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn-details"
                    onClick={() => navigate('/cliente/solicitacoes')}
                  >
                    Ver Detalhes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClienteDashboard;
