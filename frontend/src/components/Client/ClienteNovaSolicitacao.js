import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import '../Admin/Lojas.css';

function ClienteNovaSolicitacao() {
  const navigate = useNavigate();
  const [lojas, setLojas] = useState([]);
  const [franquias, setFranquias] = useState([]);
  const [formData, setFormData] = useState({
    loja_id: '',
    franquia_id: '',
    tipo_servico: '',
    data_hora: '',
    data_final_montagem: '',
    descricao_servico: '',
    observacoes: ''
  });

  const [checklist, setChecklist] = useState({
    // Parte Civil
    civil_1_equipamentos: '',
    civil_2_piso_forro: '',
    civil_3_agua: '',
    civil_4_eletrica: '',
    civil_5_gas: '',
    // Exaustão e Intertravamento
    exaustao_6_sistema: '',
    exaustao_7_coifa: '',
    exaustao_8_intertravamento: '',
    // Sistema Drive
    drive_9_base_sensores: '',
    drive_10_fiacao: '',
    drive_11_totem: '',
    drive_12_tomadas: ''
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      const [lojasRes, franquiasRes] = await Promise.all([
        fetch(API_ENDPOINTS.LOJAS, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(API_ENDPOINTS.FRANQUIAS, { headers: { 'Authorization': `Bearer ${token}` }})
      ]);

      setLojas(await lojasRes.json());
      setFranquias(await franquiasRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar checklist - todos os itens devem ter uma resposta
    const todosRespondidos = Object.values(checklist).every(item => item !== '');
    if (!todosRespondidos) {
      alert('Por favor, responda todos os itens do checklist antes de enviar a solicitação.');
      return;
    }

    // Abrir modal de confirmação
    setShowConfirmModal(true);
  };

  const confirmarEnvio = async () => {
    try {
      const token = localStorage.getItem('token');
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      
      const response = await fetch(API_ENDPOINTS.AGENDAMENTOS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          cliente_id: usuario.id,
          checklist: checklist
        })
      });

      if (response.ok) {
        setShowConfirmModal(false);
        alert('Solicitação criada com sucesso! O administrador e o técnico designado foram notificados.');
        navigate('/cliente/solicitacoes');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar solicitação');
      }
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      alert('Erro ao salvar solicitação');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button onClick={() => navigate('/cliente/dashboard')} className="btn-back">← Voltar</button>
        <h1>➕ Nova Solicitação de Serviço</h1>
      </header>

      <div className="modal-content" style={{margin: '20px auto', maxWidth: '800px'}}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Franquia *</label>
              <select
                value={formData.franquia_id}
                onChange={(e) => setFormData({...formData, franquia_id: e.target.value})}
                required
              >
                <option value="">Selecione a franquia...</option>
                {franquias.map(franquia => (
                  <option key={franquia.id} value={franquia.id}>{franquia.nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Loja *</label>
              <select
                value={formData.loja_id}
                onChange={(e) => setFormData({...formData, loja_id: e.target.value})}
                required
              >
                <option value="">Selecione a loja...</option>
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Serviço *</label>
              <select
                value={formData.tipo_servico}
                onChange={(e) => setFormData({...formData, tipo_servico: e.target.value})}
                required
              >
                <option value="">Selecione...</option>
                <option value="Instalação">Instalação</option>
                <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                <option value="Substituição de Equipamento">Substituição de Equipamento</option>
                <option value="Consultoria Técnica">Consultoria Técnica</option>
                <option value="Treinamento">Treinamento</option>
                <option value="BK é Fogo">BK é Fogo</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Data e Hora Preferencial *</label>
              <input
                type="datetime-local"
                value={formData.data_hora}
                onChange={(e) => setFormData({...formData, data_hora: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Data Final Prevista da Montagem</label>
            <input
              type="datetime-local"
              value={formData.data_final_montagem}
              onChange={(e) => setFormData({...formData, data_final_montagem: e.target.value})}
            />
            <small style={{color: '#666', fontSize: '0.85em'}}>
              Data prevista para finalização do serviço (opcional)
            </small>
          </div>

          <div className="form-group">
            <label>Descrição do Serviço *</label>
            <textarea
              value={formData.descricao_servico}
              onChange={(e) => setFormData({...formData, descricao_servico: e.target.value})}
              rows="4"
              required
              placeholder="Descreva detalhadamente o serviço que você precisa..."
            />
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows="2"
              placeholder="Informações adicionais, horários preferenciais, etc."
            />
          </div>

          <div className="form-group">
            <label style={{fontSize: '1.1em', fontWeight: 'bold', color: '#333', marginBottom: '10px', display: 'block'}}>
              📋 Checklist de Entrada de Obra *
            </label>
            <div style={{
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#f9f9f9'
            }}>
              <p style={{marginBottom: '15px', color: '#666', fontSize: '0.9em'}}>
                Todos os itens devem ser respondidos com Sim ou Não:
              </p>
              
              {/* Parte Civil */}
              <div style={{marginBottom: '20px'}}>
                <h4 style={{color: '#007bff', marginBottom: '10px', fontSize: '1em'}}>Parte Civil</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>1. Equipamentos e acessórios estão disponíveis para início e término da obra</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_1_equipamentos"
                          value="sim"
                          checked={checklist.civil_1_equipamentos === 'sim'}
                          onChange={(e) => setChecklist({...checklist, civil_1_equipamentos: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_1_equipamentos"
                          value="nao"
                          checked={checklist.civil_1_equipamentos === 'nao'}
                          onChange={(e) => setChecklist({...checklist, civil_1_equipamentos: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>2. Piso e forro estão em condições de início de montagem</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_2_piso_forro"
                          value="sim"
                          checked={checklist.civil_2_piso_forro === 'sim'}
                          onChange={(e) => setChecklist({...checklist, civil_2_piso_forro: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_2_piso_forro"
                          value="nao"
                          checked={checklist.civil_2_piso_forro === 'nao'}
                          onChange={(e) => setChecklist({...checklist, civil_2_piso_forro: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>3. Pontos de água quente/fria estão disponíveis a 10cm acima do forro e com registro 3/4"</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_3_agua"
                          value="sim"
                          checked={checklist.civil_3_agua === 'sim'}
                          onChange={(e) => setChecklist({...checklist, civil_3_agua: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_3_agua"
                          value="nao"
                          checked={checklist.civil_3_agua === 'nao'}
                          onChange={(e) => setChecklist({...checklist, civil_3_agua: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>4. Pontos de elétrica estão disponíveis para instalação e de acordo com o projeto</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_4_eletrica"
                          value="sim"
                          checked={checklist.civil_4_eletrica === 'sim'}
                          onChange={(e) => setChecklist({...checklist, civil_4_eletrica: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_4_eletrica"
                          value="nao"
                          checked={checklist.civil_4_eletrica === 'nao'}
                          onChange={(e) => setChecklist({...checklist, civil_4_eletrica: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>5. Pontos de Gás estão disponíveis para teste e start e saída do broiler em diâmetro 3/4" e fritadeira 1"</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_5_gas"
                          value="sim"
                          checked={checklist.civil_5_gas === 'sim'}
                          onChange={(e) => setChecklist({...checklist, civil_5_gas: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="civil_5_gas"
                          value="nao"
                          checked={checklist.civil_5_gas === 'nao'}
                          onChange={(e) => setChecklist({...checklist, civil_5_gas: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exaustão e Intertravamento */}
              <div style={{marginBottom: '20px'}}>
                <h4 style={{color: '#007bff', marginBottom: '10px', fontSize: '1em'}}>Exaustão e Intertravamento</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>6. Sistema de exaustão está disponível para start de equipamentos</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="exaustao_6_sistema"
                          value="sim"
                          checked={checklist.exaustao_6_sistema === 'sim'}
                          onChange={(e) => setChecklist({...checklist, exaustao_6_sistema: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="exaustao_6_sistema"
                          value="nao"
                          checked={checklist.exaustao_6_sistema === 'nao'}
                          onChange={(e) => setChecklist({...checklist, exaustao_6_sistema: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>7. Coifa Melting está instalada e disponível para testes</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="exaustao_7_coifa"
                          value="sim"
                          checked={checklist.exaustao_7_coifa === 'sim'}
                          onChange={(e) => setChecklist({...checklist, exaustao_7_coifa: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="exaustao_7_coifa"
                          value="nao"
                          checked={checklist.exaustao_7_coifa === 'nao'}
                          onChange={(e) => setChecklist({...checklist, exaustao_7_coifa: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>8. Sistema de Intertravamento está executado</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="exaustao_8_intertravamento"
                          value="sim"
                          checked={checklist.exaustao_8_intertravamento === 'sim'}
                          onChange={(e) => setChecklist({...checklist, exaustao_8_intertravamento: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="exaustao_8_intertravamento"
                          value="nao"
                          checked={checklist.exaustao_8_intertravamento === 'nao'}
                          onChange={(e) => setChecklist({...checklist, exaustao_8_intertravamento: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sistema Drive */}
              <div style={{marginBottom: '20px'}}>
                <h4 style={{color: '#007bff', marginBottom: '10px', fontSize: '1em'}}>Sistema Drive</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>9. Base para fixação dos sensores estão disponíveis</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_9_base_sensores"
                          value="sim"
                          checked={checklist.drive_9_base_sensores === 'sim'}
                          onChange={(e) => setChecklist({...checklist, drive_9_base_sensores: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_9_base_sensores"
                          value="nao"
                          checked={checklist.drive_9_base_sensores === 'nao'}
                          onChange={(e) => setChecklist({...checklist, drive_9_base_sensores: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>10. Pontos para passagem de fiação estão todos interligados</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_10_fiacao"
                          value="sim"
                          checked={checklist.drive_10_fiacao === 'sim'}
                          onChange={(e) => setChecklist({...checklist, drive_10_fiacao: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_10_fiacao"
                          value="nao"
                          checked={checklist.drive_10_fiacao === 'nao'}
                          onChange={(e) => setChecklist({...checklist, drive_10_fiacao: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>11. O totem está posicionado e interligação com a central está disponível</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_11_totem"
                          value="sim"
                          checked={checklist.drive_11_totem === 'sim'}
                          onChange={(e) => setChecklist({...checklist, drive_11_totem: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_11_totem"
                          value="nao"
                          checked={checklist.drive_11_totem === 'nao'}
                          onChange={(e) => setChecklist({...checklist, drive_11_totem: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{marginBottom: '8px', fontWeight: '500'}}>12. Tomadas estabilizadas estão disponíveis no forro da primeira cabine</p>
                    <div style={{display: 'flex', gap: '20px', paddingLeft: '10px'}}>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_12_tomadas"
                          value="sim"
                          checked={checklist.drive_12_tomadas === 'sim'}
                          onChange={(e) => setChecklist({...checklist, drive_12_tomadas: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#28a745'}}>✓ Sim</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="drive_12_tomadas"
                          value="nao"
                          checked={checklist.drive_12_tomadas === 'nao'}
                          onChange={(e) => setChecklist({...checklist, drive_12_tomadas: e.target.value})}
                          style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        <span style={{color: '#dc3545'}}>✗ Não</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {!Object.values(checklist).every(item => item !== '') && (
                <p style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  color: '#856404',
                  fontSize: '0.9em'
                }}>
                  ⚠️ Todos os itens devem ser respondidos (Sim ou Não) para enviar a solicitação
                </p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/cliente/dashboard')} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">Enviar Solicitação</button>
          </div>
        </form>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{marginBottom: '20px', color: '#007bff'}}>📋 Confirmar Solicitação</h2>
            
            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '1.1em', marginBottom: '10px'}}>Resumo do Checklist:</h3>
              
              {/* Parte Civil */}
              <div style={{marginBottom: '15px'}}>
                <h4 style={{color: '#007bff', fontSize: '0.95em', marginBottom: '8px'}}>Parte Civil</h4>
                <div style={{paddingLeft: '10px', fontSize: '0.9em'}}>
                  <p style={{marginBottom: '5px'}}>1. Equipamentos disponíveis: <strong style={{color: checklist.civil_1_equipamentos === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.civil_1_equipamentos === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>2. Piso e forro prontos: <strong style={{color: checklist.civil_2_piso_forro === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.civil_2_piso_forro === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>3. Pontos de água: <strong style={{color: checklist.civil_3_agua === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.civil_3_agua === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>4. Pontos de elétrica: <strong style={{color: checklist.civil_4_eletrica === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.civil_4_eletrica === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>5. Pontos de gás: <strong style={{color: checklist.civil_5_gas === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.civil_5_gas === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                </div>
              </div>

              {/* Exaustão */}
              <div style={{marginBottom: '15px'}}>
                <h4 style={{color: '#007bff', fontSize: '0.95em', marginBottom: '8px'}}>Exaustão e Intertravamento</h4>
                <div style={{paddingLeft: '10px', fontSize: '0.9em'}}>
                  <p style={{marginBottom: '5px'}}>6. Sistema de exaustão: <strong style={{color: checklist.exaustao_6_sistema === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.exaustao_6_sistema === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>7. Coifa Melting: <strong style={{color: checklist.exaustao_7_coifa === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.exaustao_7_coifa === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>8. Intertravamento: <strong style={{color: checklist.exaustao_8_intertravamento === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.exaustao_8_intertravamento === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                </div>
              </div>

              {/* Drive */}
              <div style={{marginBottom: '15px'}}>
                <h4 style={{color: '#007bff', fontSize: '0.95em', marginBottom: '8px'}}>Sistema Drive</h4>
                <div style={{paddingLeft: '10px', fontSize: '0.9em'}}>
                  <p style={{marginBottom: '5px'}}>9. Base para sensores: <strong style={{color: checklist.drive_9_base_sensores === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.drive_9_base_sensores === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>10. Passagem de fiação: <strong style={{color: checklist.drive_10_fiacao === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.drive_10_fiacao === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>11. Totem posicionado: <strong style={{color: checklist.drive_11_totem === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.drive_11_totem === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                  <p style={{marginBottom: '5px'}}>12. Tomadas estabilizadas: <strong style={{color: checklist.drive_12_tomadas === 'sim' ? '#28a745' : '#dc3545'}}>{checklist.drive_12_tomadas === 'sim' ? '✓ SIM' : '✗ NÃO'}</strong></p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#e7f3ff',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #007bff'
            }}>
              <p style={{margin: 0, fontSize: '0.9em', color: '#004085'}}>
                📧 Uma notificação será enviada automaticamente para o <strong>administrador</strong> e para o <strong>técnico designado</strong> assim que você confirmar esta solicitação.
              </p>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Voltar e Revisar
              </button>
              <button 
                onClick={confirmarEnvio}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✓ Confirmar Envio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClienteNovaSolicitacao;
