import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import '../Admin/Lojas.css';

function Agendamentos() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    loja_id: '',
    cliente_id: '',
    tecnico_id: '',
    tipo_servico: '',
    data_hora: '',
    data_final_montagem: '',
    descricao_servico: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  // Recarregar quando mostrar o formulário
  useEffect(() => {
    if (showForm) {
      carregarDados();
    }
  }, [showForm]);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      const [agendRes, lojasRes, clientesRes, tecnicosRes] = await Promise.all([
        fetch(API_ENDPOINTS.AGENDAMENTOS, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(API_ENDPOINTS.LOJAS, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(API_ENDPOINTS.CLIENTES, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(API_ENDPOINTS.TECNICOS, { headers: { 'Authorization': `Bearer ${token}` }})
      ]);

      setAgendamentos(await agendRes.json());
      setLojas(await lojasRes.json());
      setClientes(await clientesRes.json());
      const tecnicosData = await tecnicosRes.json();
      console.log('Técnicos carregados:', tecnicosData);
      setTecnicos(tecnicosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${API_ENDPOINTS.AGENDAMENTOS}/${editando}`
        : API_ENDPOINTS.AGENDAMENTOS;
      
      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editando ? 'Agendamento atualizado!' : 'Agendamento criado!');
        setShowForm(false);
        setEditando(null);
        setFormData({
          loja_id: '', cliente_id: '', tecnico_id: '', tipo_servico: '',
          data_hora: '', data_final_montagem: '', descricao_servico: '', observacoes: ''
        });
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      alert('Erro ao salvar agendamento');
    }
  };

  const handleEdit = (agendamento) => {
    setEditando(agendamento.id);
    setFormData({
      loja_id: agendamento.loja_id || '',
      cliente_id: agendamento.cliente_id || '',
      tecnico_id: agendamento.tecnico_id || '',
      tipo_servico: agendamento.tipo_servico || '',
      data_hora: agendamento.data_hora ? agendamento.data_hora.slice(0, 16) : '',
      data_final_montagem: agendamento.data_final_montagem ? agendamento.data_final_montagem.slice(0, 16) : '',
      descricao_servico: agendamento.descricao_servico || '',
      observacoes: agendamento.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este agendamento?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.AGENDAMENTOS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Agendamento excluído!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
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
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        background: colors[status] || '#666',
        color: 'white',
        fontSize: '12px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="btn-back">← Voltar</button>
        <h1>📋 Gerenciar Agendamentos</h1>
        <div>
          <button onClick={carregarDados} className="btn-refresh" style={{marginRight: '10px'}}>🔄 Atualizar</button>
          <button onClick={() => { setShowForm(true); setEditando(null); }} className="btn-new">+ Novo Agendamento</button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editando ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Loja *</label>
                  <select
                    value={formData.loja_id}
                    onChange={(e) => setFormData({...formData, loja_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {lojas.map(loja => (
                      <option key={loja.id} value={loja.id}>{loja.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Contato *</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Técnico</label>
                  <select
                    value={formData.tecnico_id}
                    onChange={(e) => setFormData({...formData, tecnico_id: e.target.value})}
                  >
                    <option value="">Não atribuído</option>
                    {tecnicos.map(tecnico => (
                      <option key={tecnico.id} value={tecnico.id}>{tecnico.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo de Serviço *</label>
                  <input
                    type="text"
                    value={formData.tipo_servico}
                    onChange={(e) => setFormData({...formData, tipo_servico: e.target.value})}
                    required
                    placeholder="Ex: Manutenção Preventiva"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={formData.data_hora}
                  onChange={(e) => setFormData({...formData, data_hora: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Data Final da Montagem</label>
                <input
                  type="datetime-local"
                  value={formData.data_final_montagem}
                  onChange={(e) => setFormData({...formData, data_final_montagem: e.target.value})}
                />
                <small style={{color: '#666', fontSize: '0.85em'}}>
                  Data prevista para finalização da montagem/instalação
                </small>
              </div>

              <div className="form-group">
                <label>Descrição do Serviço</label>
                <textarea
                  value={formData.descricao_servico}
                  onChange={(e) => setFormData({...formData, descricao_servico: e.target.value})}
                  rows="3"
                  placeholder="Descreva o serviço a ser realizado..."
                />
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Loja</th>
              <th>Contato</th>
              <th>Técnico</th>
              <th>Tipo de Serviço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center'}}>Nenhum agendamento cadastrado</td>
              </tr>
            ) : (
              agendamentos.map(agendamento => (
                <tr key={agendamento.id}>
                  <td>{new Date(agendamento.data_hora).toLocaleString('pt-BR')}</td>
                  <td>{agendamento.loja_nome}</td>
                  <td>{agendamento.cliente_nome}</td>
                  <td>{agendamento.tecnico_nome || 'Não atribuído'}</td>
                  <td>{agendamento.tipo_servico}</td>
                  <td>{getStatusBadge(agendamento.status)}</td>
                  <td>
                    <button onClick={() => handleEdit(agendamento)} className="btn-edit">✏️</button>
                    <button onClick={() => handleDelete(agendamento.id)} className="btn-delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Agendamentos;
