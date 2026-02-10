import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function ClienteDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <img src="/logos/Inovaguil-logo.png" alt="INOVAGUIL" style={{height: '50px', filter: 'brightness(0) invert(1)'}} />
          <h1>Sistema de Ordem de Serviço - Cliente</h1>
        </div>
        <div className="user-info">
          <span>👤 {usuario.nome}</span>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </header>

      <div className="dashboard-content">
        <h2>Bem-vindo, {usuario.nome}!</h2>
        <p>Você está logado como <strong>Cliente</strong></p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📋 Minhas Solicitações</h3>
            <p>Ver minhas ordens de serviço</p>
            <button className="btn-card" onClick={() => navigate('/cliente/solicitacoes')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>➕ Nova Solicitação</h3>
            <p>Solicitar novo atendimento</p>
            <button className="btn-card" onClick={() => navigate('/cliente/nova-solicitacao')}>Acessar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClienteDashboard;
