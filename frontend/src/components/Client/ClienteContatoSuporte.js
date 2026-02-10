import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './ClienteContatoSuporte.css';

function ClienteContatoSuporte() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [formData, setFormData] = useState({
    assunto: '',
    categoria: 'duvida',
    mensagem: '',
    prioridade: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [msgType, setMsgType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.assunto.trim() || !formData.mensagem.trim()) {
      setMensagem('❌ Preencha todos os campos');
      setMsgType('error');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notificacoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          titulo: formData.assunto,
          mensagem: formData.mensagem,
          tipo: 'contato_suporte',
          categoria: formData.categoria,
          prioridade: formData.prioridade,
          lida: false
        })
      });

      if (!response.ok) throw new Error('Erro ao enviar');

      setMensagem('✅ Mensagem enviada com sucesso! Nossa equipe responderá em breve.');
      setMsgType('success');
      
      setFormData({
        assunto: '',
        categoria: 'duvida',
        mensagem: '',
        prioridade: 'normal'
      });

      setTimeout(() => navigate('/cliente/dashboard'), 3000);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setMensagem('❌ Erro ao enviar mensagem. Tente novamente.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    { value: 'duvida', label: '❓ Dúvida' },
    { value: 'problema', label: '⚠️ Problema Técnico' },
    { value: 'sugestao', label: '💡 Sugestão' },
    { value: 'reclamacao', label: '😞 Reclamação' },
    { value: 'outro', label: '📝 Outro' }
  ];

  return (
    <div className="cliente-contato-container">
      <div className="contato-header">
        <div className="header-content">
          <h2>💬 Fale Conosco</h2>
          <p>Entre em contato com nossa equipe de suporte</p>
        </div>
        <button className="btn-voltar" onClick={() => navigate('/cliente/dashboard')}>
          ← Voltar
        </button>
      </div>

      <div className="contato-content">
        <div className="contato-info">
          <div className="info-card">
            <h3>📞 Contato Direto</h3>
            <ul>
              <li><strong>Telefone:</strong> (11) 3000-0000</li>
              <li><strong>Email:</strong> suporte@inovaguil.com.br</li>
              <li><strong>WhatsApp:</strong> (11) 99999-9999</li>
              <li><strong>Horário:</strong> Seg-Sex 8h às 18h</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>⏱️ Tempo de Resposta</h3>
            <ul>
              <li><strong>Urgente:</strong> até 1 hora</li>
              <li><strong>Normal:</strong> até 4 horas</li>
              <li><strong>Baixa:</strong> até 24 horas</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contato-form">
          <h3>📋 Formulário de Contato</h3>

          {mensagem && (
            <div className={`mensagem ${msgType}`}>
              {mensagem}
            </div>
          )}

          <div className="form-group">
            <label>Categoria *</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
            >
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assunto *</label>
            <input
              type="text"
              name="assunto"
              value={formData.assunto}
              onChange={handleChange}
              placeholder="Descreva brevemente o assunto"
              required
            />
          </div>

          <div className="form-group">
            <label>Prioridade</label>
            <select
              name="prioridade"
              value={formData.prioridade}
              onChange={handleChange}
            >
              <option value="baixa">🟢 Baixa</option>
              <option value="normal">🟡 Normal</option>
              <option value="alta">🔴 Urgente</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mensagem *</label>
            <textarea
              name="mensagem"
              value={formData.mensagem}
              onChange={handleChange}
              placeholder="Descreva em detalhes seu problema, dúvida ou sugestão..."
              rows="8"
              required
            />
          </div>

          <div className="form-info">
            <p>📝 <strong>Informações do Usuário:</strong></p>
            <p>Nome: {usuario.nome}</p>
            <p>Email: {usuario.email}</p>
          </div>

          <button type="submit" className="btn-enviar" disabled={loading}>
            {loading ? '📤 Enviando...' : '📤 Enviar Mensagem'}
          </button>
        </form>
      </div>

      <div className="faq-section">
        <h3>❓ Perguntas Frequentes</h3>
        <div className="faq-items">
          <div className="faq-item">
            <strong>Como acompanho meu serviço?</strong>
            <p>Acesse a seção "Minhas Solicitações" para ver o status em tempo real.</p>
          </div>
          <div className="faq-item">
            <strong>Qual é o tempo de atendimento?</strong>
            <p>Respondemos conforme a prioridade informada, entre 1 hora e 24 horas.</p>
          </div>
          <div className="faq-item">
            <strong>Posso cancelar um serviço?</strong>
            <p>Sim, entre em contato conosco antes que o serviço comece.</p>
          </div>
          <div className="faq-item">
            <strong>Como recebo a ordem de serviço?</strong>
            <p>A ordem é enviada por email e também fica disponível no seu histórico.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClienteContatoSuporte;
