import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function AdminDashboard() {
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
          <h1>Sistema de Ordem de Serviço - Admin</h1>
        </div>
        <div className="user-info">
          <span>👤 {usuario.nome}</span>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </header>

      <div className="dashboard-content">
        <h2>Bem-vindo, {usuario.nome}!</h2>
        <p>Você está logado como <strong>Administrador</strong></p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📋 Agendamentos</h3>
            <p>Gerenciar ordens de serviço e agendamentos</p>
            <button className="btn-card" onClick={() => navigate('/admin/agendamentos')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>👥 Contatos/Gerenciador</h3>
            <p>Gerenciar contatos cadastrados</p>
            <button className="btn-card" onClick={() => navigate('/admin/clientes')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>🔧 Técnicos</h3>
            <p>Gerenciar técnicos e especialidades</p>
            <button className="btn-card" onClick={() => navigate('/admin/tecnicos')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>🏪 Lojas</h3>
            <p>Cadastrar e gerenciar lojas</p>
            <button className="btn-card" onClick={() => navigate('/admin/lojas')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>🏢 Franquias</h3>
            <p>Gerenciar franquias</p>
            <button className="btn-card" onClick={() => navigate('/admin/franquias')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>📊 Relatórios Diários</h3>
            <p>Visualizar relatórios dos técnicos</p>
            <button className="btn-card" onClick={() => navigate('/admin/relatorios')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>💰 Despesas</h3>
            <p>Controle de despesas</p>
            <button className="btn-card" onClick={() => navigate('/admin/despesas')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>📂 Categorias de Despesa</h3>
            <p>Gerenciar categorias</p>
            <button className="btn-card" onClick={() => navigate('/admin/categorias-despesa')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>📋 Documentos de Viagem</h3>
            <p>Gerenciar vouchers dos técnicos</p>
            <button className="btn-card" onClick={() => navigate('/admin/vouchers')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>📚 Manuais</h3>
            <p>Biblioteca de manuais técnicos</p>
            <button className="btn-card" onClick={() => navigate('/admin/manuais')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>✅ Checklists de Obra</h3>
            <p>Visualizar checklists de entrada de obra</p>
            <button className="btn-card" onClick={() => navigate('/admin/checklists-obra')}>Acessar</button>
          </div>

          <div className="dashboard-card">
            <h3>👤 Usuários</h3>
            <p>Gerenciar usuários do sistema</p>
            <button className="btn-card" onClick={() => navigate('/admin/usuarios')}>Acessar</button>
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
            <p>Ver todas as notificações do sistema</p>
            <button className="btn-card" onClick={() => navigate('/admin/notificacoes')}>Acessar</button>
          </div>        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
