import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import './Notificacoes.css';

function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarNotificacoes();
    // Atualizar notificações a cada 30 segundos
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
        setNotificacoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.NOTIFICACOES}/${id}/ler`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        carregarNotificacoes();
      }
    } catch (error) {
      console.error('Erro ao marcar notificação:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.NOTIFICACOES}/ler-todas`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        carregarNotificacoes();
      }
    } catch (error) {
      console.error('Erro ao marcar todas notificações:', error);
    }
  };

  const naoLidas = notificacoes.filter(n => !n.lida);
  const exibir = mostrarTodas ? notificacoes : naoLidas;

  const getIconeTipo = (tipo) => {
    switch(tipo) {
      case 'novo_agendamento': return '📅';
      case 'atribuicao_tecnico': return '👷';
      case 'cancelamento': return '🚫';
      case 'atribuicao': return '👤';
      case 'conclusao': return '✅';
      case 'urgente': return '⚠️';
      default: return '📢';
    }
  };

  if (loading) {
    return <div className="notificacoes-loading">Carregando notificações...</div>;
  }

  return (
    <div className="notificacoes-container">
      <div className="notificacoes-header">
        <h3>
          🔔 Notificações 
          {naoLidas.length > 0 && (
            <span className="badge-count">{naoLidas.length}</span>
          )}
        </h3>
        <div className="notificacoes-actions">
          <button 
            onClick={() => setMostrarTodas(!mostrarTodas)}
            className="btn-toggle"
          >
            {mostrarTodas ? 'Mostrar não lidas' : 'Mostrar todas'}
          </button>
          {naoLidas.length > 0 && (
            <button 
              onClick={marcarTodasComoLidas}
              className="btn-marcar-todas"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      <div className="notificacoes-lista">
        {exibir.length === 0 ? (
          <div className="sem-notificacoes">
            {mostrarTodas ? 'Nenhuma notificação' : 'Nenhuma notificação não lida'}
          </div>
        ) : (
          exibir.map((notificacao) => (
            <div 
              key={notificacao.id} 
              className={`notificacao-item ${!notificacao.lida ? 'nao-lida' : ''}`}
            >
              <div className="notificacao-icon">
                {getIconeTipo(notificacao.tipo)}
              </div>
              <div className="notificacao-conteudo">
                <p className="notificacao-mensagem">{notificacao.mensagem}</p>
                <span className="notificacao-data">
                  {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              {!notificacao.lida && (
                <button 
                  onClick={() => marcarComoLida(notificacao.id)}
                  className="btn-marcar-lida"
                  title="Marcar como lida"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notificacoes;
