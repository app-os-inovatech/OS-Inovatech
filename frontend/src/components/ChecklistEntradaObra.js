import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './ChecklistEntradaObra.css';

// Componente de Checklist de Entrada de Obra - Atualizado
function ChecklistEntradaObra({ agendamentoId, onClose }) {
  const [formData, setFormData] = useState({
    agendamento_id: agendamentoId,
    loja_nome: '',
    cidade: '',
    gerenciador: '',
    data_checklist: new Date().toISOString().split('T')[0],
    
    // Parte Civil
    civil_1_equipamentos: 'pendente',
    civil_2_piso_forro: 'pendente',
    civil_3_agua: 'pendente',
    civil_4_eletrica: 'pendente',
    civil_5_gas: 'pendente',
    
    // Exaustão e Intertravamento
    exaustao_6_sistema: 'pendente',
    exaustao_7_coifa: 'pendente',
    exaustao_8_intertravamento: 'pendente',
    
    // Sistema Drive
    drive_9_base_sensores: 'pendente',
    drive_10_fiacao: 'pendente',
    drive_11_totem: 'pendente',
    drive_12_tomadas: 'pendente',
    
    pendencias: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/checklist-entrada-obra`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('Checklist salvo com sucesso!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      setMessage('Erro ao salvar checklist. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderRadioGroup = (name, label) => (
    <tr>
      <td>{label}</td>
      <td className="radio-cell">
        <label className="radio-label">
          <input
            type="radio"
            name={name}
            value="sim"
            checked={formData[name] === 'sim'}
            onChange={(e) => handleChange(name, e.target.value)}
          />
          <span>Sim</span>
        </label>
      </td>
      <td className="radio-cell">
        <label className="radio-label">
          <input
            type="radio"
            name={name}
            value="nao"
            checked={formData[name] === 'nao'}
            onChange={(e) => handleChange(name, e.target.value)}
          />
          <span>Não</span>
        </label>
      </td>
    </tr>
  );

  return (
    <div className="checklist-container">
      <div className="checklist-header">
        <h2>Check List de Entrada de Obra</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="info-section">
          <div className="form-row">
            <div className="form-group">
              <label>Loja:</label>
              <input
                type="text"
                value={formData.loja_nome}
                onChange={(e) => handleChange('loja_nome', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Cidade:</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gerenciador:</label>
              <input
                type="text"
                value={formData.gerenciador}
                onChange={(e) => handleChange('gerenciador', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Data:</label>
              <input
                type="date"
                value={formData.data_checklist}
                onChange={(e) => handleChange('data_checklist', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Parte Civil */}
        <div className="checklist-section">
          <h3>Parte Civil</h3>
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Itens</th>
                <th>Sim</th>
                <th>Não</th>
              </tr>
            </thead>
            <tbody>
              {renderRadioGroup('civil_1_equipamentos', '1. Equipamentos e acessórios estão disponíveis para início e término da obra')}
              {renderRadioGroup('civil_2_piso_forro', '2. Piso e forro estão em condições de início de montagem')}
              {renderRadioGroup('civil_3_agua', '3. Pontos de água quente/fria estão disponíveis a 10cm acima do forro e com registro 3/4"')}
              {renderRadioGroup('civil_4_eletrica', '4. Pontos de elétrica estão disponíveis para instalação e de acordo com o projeto')}
              {renderRadioGroup('civil_5_gas', '5. Pontos de Gás estão disponíveis para teste e start e saída do broiler em diâmetro 3/4" e fritadeira 1"')}
            </tbody>
          </table>
        </div>

        {/* Exaustão e Intertravamento */}
        <div className="checklist-section">
          <h3>Exaustão e Intertravamento</h3>
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Itens</th>
                <th>Sim</th>
                <th>Não</th>
              </tr>
            </thead>
            <tbody>
              {renderRadioGroup('exaustao_6_sistema', '6. Sistema de exaustão está disponível para start de equipamentos')}
              {renderRadioGroup('exaustao_7_coifa', '7. Coifa Melting está instalada e disponível para testes')}
              {renderRadioGroup('exaustao_8_intertravamento', '8. Sistema de Intertravamento está executado')}
            </tbody>
          </table>
        </div>

        {/* Sistema Drive */}
        <div className="checklist-section">
          <h3>Sistema Drive</h3>
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Itens</th>
                <th>Sim</th>
                <th>Não</th>
              </tr>
            </thead>
            <tbody>
              {renderRadioGroup('drive_9_base_sensores', '9. Base para fixação dos sensores estão disponíveis')}
              {renderRadioGroup('drive_10_fiacao', '10. Pontos para passagem de fiação estão todos interligados')}
              {renderRadioGroup('drive_11_totem', '11. O totem está posicionado e interligação com a central está disponível')}
              {renderRadioGroup('drive_12_tomadas', '12. Tomadas estabilizadas estão disponíveis no forro da primeira cabine')}
            </tbody>
          </table>
        </div>

        {/* Pendências */}
        <div className="checklist-section">
          <h3>Listar Pendências</h3>
          <textarea
            className="pendencias-textarea"
            value={formData.pendencias}
            onChange={(e) => handleChange('pendencias', e.target.value)}
            placeholder="Descreva as pendências encontradas..."
            rows="8"
          />
        </div>

        {message && (
          <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          {onClose && (
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Checklist'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChecklistEntradaObra;
