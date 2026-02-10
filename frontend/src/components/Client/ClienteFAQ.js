import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClienteFAQ.css';

function ClienteFAQ() {
  const navigate = useNavigate();
  const [abaAbierta, setAbaAbierta] = useState(null);

  const faqs = [
    {
      id: 1,
      categoria: 'Solicitações',
      pergunta: 'Como faço uma nova solicitação de serviço?',
      resposta: 'Acesse "Nova Solicitação" no menu principal. Preencha os dados solicitados: tipo de serviço, local, data desejada e descrição. Após enviar, você receberá uma confirmação por email.'
    },
    {
      id: 2,
      categoria: 'Solicitações',
      pergunta: 'Posso modificar uma solicitação já enviada?',
      resposta: 'Você pode modificar solicitações que ainda estão com status "Pendente". Após atribuição do técnico, entre em contato conosco para solicitar alterações.'
    },
    {
      id: 3,
      categoria: 'Acompanhamento',
      pergunta: 'Como acompanho meu serviço em tempo real?',
      resposta: 'Na seção "Minhas Solicitações", você verá o status de cada serviço: Pendente, Atribuído, Em Andamento ou Concluído. Clique em uma solicitação para ver mais detalhes.'
    },
    {
      id: 4,
      categoria: 'Acompanhamento',
      pergunta: 'Quanto tempo leva para confirmar minha solicitação?',
      resposta: 'A confirmação é automática assim que você envia. O técnico será atribuído dentro de 24 horas úteis, conforme disponibilidade.'
    },
    {
      id: 5,
      categoria: 'Conta',
      pergunta: 'Como edito meu perfil?',
      resposta: 'Clique em "⚙️ Perfil" no canto superior direito do dashboard. Ali você pode atualizar seus dados pessoais, telefone e endereço.'
    },
    {
      id: 6,
      categoria: 'Conta',
      pergunta: 'Como recupero minha senha?',
      resposta: 'Na página de login, clique em "Esqueci minha senha". Você receberá um email com instruções para redefinir a senha.'
    },
    {
      id: 7,
      categoria: 'Técnicos',
      pergunta: 'Posso escolher um técnico específico?',
      resposta: 'A atribuição de técnicos é feita automaticamente conforme sua localização e disponibilidade. Se tiver preferência, mencione nos comentários da solicitação.'
    },
    {
      id: 8,
      categoria: 'Técnicos',
      pergunta: 'Qual é o horário de atendimento?',
      resposta: 'Atendemos de segunda a sexta das 8h às 18h. Sábados e domingos conforme agendamento prévio. Urgências podem ser atendidas fora do horário.'
    },
    {
      id: 9,
      categoria: 'Suporte',
      pergunta: 'Como faço para falar com o suporte?',
      resposta: 'Acesse a seção "Contato" do seu dashboard, ou ligue para (11) 3000-0000, envie email para suporte@inovaguil.com.br ou envie WhatsApp.'
    },
    {
      id: 10,
      categoria: 'Suporte',
      pergunta: 'Qual é o tempo de resposta do suporte?',
      resposta: 'Respondemos em até 1 hora para urgências, 4 horas para assuntos normais e 24 horas para consultas gerais.'
    },
    {
      id: 11,
      categoria: 'Relatórios',
      pergunta: 'Onde vejo o histórico de meus serviços?',
      resposta: 'Acesse "Histórico" no dashboard para ver todos os serviços já realizados, com possibilidade de filtrar por status.'
    },
    {
      id: 12,
      categoria: 'Relatórios',
      pergunta: 'Posso baixar documentos dos serviços?',
      resposta: 'Sim, cada serviço concluído gera uma ordem de serviço que pode ser visualizada e impressa a partir do seu histórico.'
    }
  ];

  const categorias = ['Todos', ...new Set(faqs.map(f => f.categoria))];
  const [categoriaFilter, setCategoriaFilter] = useState('Todos');

  const faqsFiltered = categoriaFilter === 'Todos' 
    ? faqs 
    : faqs.filter(f => f.categoria === categoriaFilter);

  return (
    <div className="cliente-faq-container">
      <div className="faq-header">
        <div className="header-content">
          <h2>❓ Perguntas Frequentes</h2>
          <p>Encontre respostas para suas dúvidas</p>
        </div>
        <button className="btn-voltar" onClick={() => navigate('/cliente/dashboard')}>
          ← Voltar
        </button>
      </div>

      <div className="faq-content">
        <div className="filtro-categoria">
          <label>Filtrar por categoria:</label>
          <div className="categoria-buttons">
            {categorias.map(cat => (
              <button
                key={cat}
                className={`categoria-btn ${categoriaFilter === cat ? 'ativo' : ''}`}
                onClick={() => setCategoriaFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="faq-list">
          {faqsFiltered.map(faq => (
            <div key={faq.id} className="faq-accordion">
              <button
                className="faq-pergunta"
                onClick={() => setAbaAbierta(abaAbierta === faq.id ? null : faq.id)}
              >
                <div className="pergunta-content">
                  <span className="categoria-tag">{faq.categoria}</span>
                  <span className="pergunta-text">{faq.pergunta}</span>
                </div>
                <span className={`toggle-icon ${abaAbierta === faq.id ? 'aberto' : ''}`}>
                  ▼
                </span>
              </button>

              {abaAbierta === faq.id && (
                <div className="faq-resposta">
                  {faq.resposta}
                </div>
              )}
            </div>
          ))}
        </div>

        {faqsFiltered.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma pergunta encontrada nesta categoria</p>
          </div>
        )}
      </div>

      <div className="faq-footer">
        <div className="footer-card">
          <h3>💬 Não encontrou o que procura?</h3>
          <p>Envie sua dúvida para nossa equipe de suporte</p>
          <button 
            className="btn-contato"
            onClick={() => navigate('/cliente/contato')}
          >
            Falar com Suporte →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClienteFAQ;
