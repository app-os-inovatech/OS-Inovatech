import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function TecnicoDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  useEffect(() => {
    carregarNotificacoes();
    const interval = setInterval(carregarNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarNotificacoes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.NOTIFICACOES, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const naoLidas = data.filter(n => !n.lida).length;
        setNotificacoesNaoLidas(naoLidas);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

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
          <h1>Sistema de Ordem de Serviço - Técnico</h1>
        </div>
        <div className="user-info">
          <span>👤 {usuario.nome}</span>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </header>

      <div className="dashboard-content">
        <h2>Bem-vindo, {usuario.nome}!</h2>
        <p>Você está logado como <strong>Técnico</strong></p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📋 Minhas OS</h3>
            <p>Ver ordens de serviço atribuídas</p>
            <button onClick={() => navigate('/tecnico/os')} className="btn-card">Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>📝 Relatórios Diários</h3>
            <p>Registrar relatórios diários</p>
            <button onClick={() => navigate('/tecnico/relatorios')} className="btn-card">Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>💰 Minhas Despesas</h3>
            <p>Lançar e visualizar despesas</p>
            <button onClick={() => navigate('/tecnico/despesas')} className="btn-card">Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>📅 Agenda</h3>
            <p>Ver calendário de agendamentos</p>
            <button onClick={() => navigate('/tecnico/agenda')} className="btn-card">Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>� Manuais Técnicos</h3>
            <p>Consultar manuais e vídeos</p>
            <button onClick={() => navigate('/tecnico/manuais')} className="btn-card">Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>👤 Meu Perfil</h3>
            <p>Atualizar dados pessoais</p>
            <button onClick={() => navigate('/tecnico/perfil')} className="btn-card">Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>✈️ Vouchers</h3>
            <p>Meus documentos de viagem</p>
            <button onClick={() => navigate('/tecnico/vouchers')} className="btn-card">Visualizar</button>
          </div>

          <div className="dashboard-card">
            <h3>🔔 Notificações {notificacoesNaoLidas > 0 && <span style={{
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 8px',
              fontSize: '0.8em',
              marginLeft: '8px'
            }}>{notificacoesNaoLidas}</span>}</h3>
            <p>Ver minhas notificações</p>
            <button onClick={() => navigate('/tecnico/notificacoes')} className="btn-card">Acessar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TecnicoDashboard;
