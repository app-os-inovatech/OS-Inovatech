import React, { useState } from 'react';
import './ChecklistModal.css';

function ChecklistModal({ isOpen, onClose, agendamento, onSubmit }) {
  const [formData, setFormData] = useState({
    tipo_checklist: 'Kit de Montagem',
    loja_nome: agendamento?.loja_nome || '',
    itens: {},
    observacoes: ''
  });

  if (!isOpen) return null;

  const itensKit = [
    { id: 1, qtd: 1, nome: 'COLA CPVC 1/5G' },
    { id: 2, qtd: 1, nome: 'PLUG 2P + 32A AZUL' },
    { id: 3, qtd: 1, nome: 'SPRAY MARROM' },
    { id: 5, qtd: 1, nome: 'SILICONE BISNAGA 50G' },
    { id: 6, qtd: 1, nome: 'TEE AQUATHERM 15MM' },
    { id: 7, qtd: 1, nome: 'ANEL DE VEDAÇÃO 75MM' },
    { id: 8, qtd: 1, nome: 'CONEXÃO Z' },
    { id: 9, qtd: 1, nome: 'MANGUEIRA BROILLER 1"' },
    { id: 10, qtd: 1, nome: 'MANGUEIRA FRITADEIRA 3/4 + NIPLE 3/4' },
    { id: 11, qtd: 1, nome: 'TEE PVC 20MM' },
    { id: 14, qtd: 1, nome: 'REDUÇÃO DE 75 - 50MM BRANCA P ESG' },
    { id: 55, qtd: 1, nome: 'VÁLVULA DE PIA TANQUE 1.1/4 (ÁGUA QUENTE)' },
    { id: 4, qtd: 2, nome: 'TEE PVC COLAR/ROSCA 20MM' },
    { id: 13, qtd: 2, nome: 'CURVA TRANNISPOSIÇÃO AQUATHERM 15MM' },
    { id: 15, qtd: 2, nome: 'REGISTRO DE 1/2 AZUL' },
    { id: 16, qtd: 2, nome: 'SIFÃO PADRÃO' },
    { id: 18, qtd: 2, nome: 'NIPLE REDUÇÃO DE 3/4 PARA 1/2 GALVANIZADO' },
    { id: 19, qtd: 2, nome: 'DISCO DE CORTE' },
    { id: 20, qtd: 2, nome: 'ENGATE RÁPIDO COMPLETO' },
    { id: 21, qtd: 2, nome: 'ESGUICHO' },
    { id: 22, qtd: 2, nome: 'MANGUEIRA MOP' },
    { id: 23, qtd: 2, nome: 'VÁLVULA DE GÁS DE SEGUNDO ESTÁGIO' },
    { id: 24, qtd: 2, nome: 'ABRAÇADEIRA TIPO U (MOP) 1/2' },
    { id: 30, qtd: 2, nome: 'TUBO 50MM PVC MARROM 1,5M' },
    { id: 34, qtd: 2, nome: 'LUVA TRANSP AQUATHERM 15X1/2' },
    { id: 35, qtd: 2, nome: 'LUVA 75MM P ESGOTO' },
    { id: 17, qtd: 3, nome: 'TEE PVC 50MM' },
    { id: 26, qtd: 3, nome: 'ADAPTADOR/CONECTOR TRANS AQUATHERM 1/2 - 15MM' },
    { id: 27, qtd: 3, nome: 'UNIÃO AQUATHERM 15MM' },
    { id: 28, qtd: 3, nome: 'UNIÃO PVC DE 20' },
    { id: 29, qtd: 3, nome: 'ENGATE FLEXÍVEL ÁGUA QUENTE E FRIO 1/2" 60CM MF' },
    { id: 32, qtd: 3, nome: 'JOELHO/COTOVELO PVC 50MM' },
    { id: 31, qtd: 4, nome: 'JOELHO/COTOVELO DE 75MM P ESGOTO' },
    { id: 33, qtd: 4, nome: 'JOELHO TRANS AQUATHERM 1/2 15MM' },
    { id: 38, qtd: 4, nome: 'LUVA SOLD COLA/ROSCA PVC 30X1.1/2' },
    { id: 41, qtd: 4, nome: 'ADAPTADOR/CONECTOR PVC 3/4 -25' },
    { id: 36, qtd: 5, nome: 'ADAPTADOR/CONECTOR TRANS AQUATHERM 3/4 - 22MM' },
    { id: 37, qtd: 5, nome: 'BUCHA REDUÇÃO AQUATHERM 22 - 15MM' },
    { id: 39, qtd: 5, nome: 'FITA VEDA ROSCA' },
    { id: 40, qtd: 5, nome: 'BUCHA REDUÇÃO PVC 25-20' },
    { id: 43, qtd: 6, nome: 'JOELHO/COTOVELO GALVANIZADO 1/2' },
    { id: 50, qtd: 8, nome: 'TUBO AQUATHERM 15MM 1,5M' },
    { id: 51, qtd: 8, nome: 'TUBO PVC MARROM 20MM 1,5M' },
    { id: 44, qtd: 9, nome: 'ADAPTADOR/CONECTOR PVC 1/2 - 20' },
    { id: 45, qtd: 9, nome: 'JOELHO/COTOVELO AQUATHERM 15MM' },
    { id: 46, qtd: 9, nome: 'JOELHO/COTOVELO PVC 20' },
    { id: 47, qtd: 9, nome: 'LUVA AQUATHERM 15MM' },
    { id: 48, qtd: 9, nome: 'LUVA PVC 20MM' },
    { id: 49, qtd: 9, nome: 'NIPLE 1/2 GALVANIZADO OU LATÃO (TUPY)' },
    { id: 52, qtd: 10, nome: 'ARRUELA LISA PARA NIPLE 1/2' },
    { id: 53, qtd: 70, nome: 'BUCHA 58' },
    { id: 54, qtd: 70, nome: 'PARAFUSO CAB PANELA INOX' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar se todos os itens foram respondidos
    const totalRespondidos = Object.keys(formData.itens).length;
    const totalItens = itensKit.length;
    
    if (totalRespondidos !== totalItens) {
      alert(`Você deve responder todos os ${totalItens} itens. Respondidos: ${totalRespondidos}`);
      return;
    }
    
    // Preparar dados para envio
    const dadosEnvio = {
      ...formData,
      itens: JSON.stringify(formData.itens)
    };
    
    // Chamar onSubmit se existir
    if (onSubmit) {
      onSubmit(dadosEnvio);
    }
  };

  const handleSelectItem = (itemId, value) => {
    setFormData(prev => ({
      ...prev,
      itens: {
        ...prev.itens,
        [itemId]: value
      }
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalItens = itensKit.length;
  const totalRespondidos = Object.keys(formData.itens).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✅ Checklist - Kit de Montagem</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="checklist-form">
          <div className="form-section">
            <p style={{marginBottom: '10px', color: '#666'}}>
              Loja: <strong>{formData.loja_nome}</strong>
            </p>
            <p style={{marginBottom: '20px', color: '#003DA5', fontWeight: 'bold'}}>
              Preenchidos: {totalRespondidos} de {totalItens} itens
            </p>
            
            <div className="checklist-items">
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{backgroundColor: '#003DA5', borderBottom: '2px solid #003DA5'}}>
                    <th style={{padding: '12px', textAlign: 'center', width: '80px', color: 'white', fontWeight: 'bold'}}>Qtd</th>
                    <th style={{padding: '12px', textAlign: 'left', flex: 1, color: 'white', fontWeight: 'bold'}}>Item</th>
                    <th style={{padding: '12px', textAlign: 'center', width: '180px', color: 'white', fontWeight: 'bold'}}>Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  {itensKit.map(item => {
                    const respondido = formData.itens[item.id];
                    const rowColor = respondido === undefined ? '#F5F7FA' : '#FFFFFF';
                    const borderStyle = respondido === undefined ? '3px solid #FFC107' : 'none';
                    
                    return (
                      <tr key={item.id} style={{borderBottom: '1px solid #E0E0E0', backgroundColor: rowColor, borderLeft: borderStyle}}>
                        <td style={{padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#003DA5'}}>
                          {item.qtd}
                        </td>
                        <td style={{padding: '8px', color: '#2C3E50', fontWeight: '600'}}>
                          {item.nome}
                        </td>
                        <td style={{padding: '8px', textAlign: 'center'}}>
                          <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                            <button
                              type="button"
                              onClick={() => handleSelectItem(item.id, 'sim')}
                              style={{
                                padding: '6px 16px',
                                backgroundColor: respondido === 'sim' ? '#28A745' : '#E9ECEF',
                                color: respondido === 'sim' ? 'white' : '#333',
                                border: respondido === 'sim' ? '2px solid #20C997' : '1px solid #DDD',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: respondido === 'sim' ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                              }}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectItem(item.id, 'não')}
                              style={{
                                padding: '6px 16px',
                                backgroundColor: respondido === 'não' ? '#DC3545' : '#E9ECEF',
                                color: respondido === 'não' ? 'white' : '#333',
                                border: respondido === 'não' ? '2px solid #BD2130' : '1px solid #DDD',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: respondido === 'não' ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                              }}
                            >
                              Não
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-section">
            <h3>Observações</h3>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Itens faltantes, problemas ou observações gerais..."
              rows="4"
              style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd'}}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-submit">
              Confirmar e Iniciar Montagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChecklistModal;
