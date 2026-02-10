import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function TecnicoDespesas() {
  const navigate = useNavigate();
  const [lojasAtribuidas, setLojasAtribuidas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoja, setModalLoja] = useState(null);
  const [formDespesa, setFormDespesa] = useState({
    categoria: '',
    descricao: '',
    valor: '',
    foto: null,
    fotoPreview: null
  });

  const categoriasDespesas = ['Uber', 'Refeição', 'Material', 'Hospedagem'];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar agendamentos atribuídos ao técnico para pegar as lojas
      const responseAgendamentos = await fetch(API_ENDPOINTS.AGENDAMENTOS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (responseAgendamentos.ok) {
        const agendamentos = await responseAgendamentos.json();
        
        // Extrair lojas únicas dos agendamentos
        const lojasMap = new Map();
        agendamentos.forEach(ag => {
          if (ag.loja && ag.loja.id) {
            lojasMap.set(ag.loja.id, {
              id: ag.loja.id,
              nome: ag.loja.nome,
              cidade: ag.loja.cidade,
              estado: ag.loja.estado
            });
          }
        });
        
        setLojasAtribuidas(Array.from(lojasMap.values()));
      }

      // Buscar despesas do técnico
      const responseDespesas = await fetch(API_ENDPOINTS.DESPESAS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (responseDespesas.ok) {
        const data = await responseDespesas.json();
        setDespesas(data);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalDespesa = (loja) => {
    setModalLoja(loja);
    setFormDespesa({
      categoria: '',
      descricao: '',
      valor: '',
      foto: null,
      fotoPreview: null
    });
  };

  const fecharModal = () => {
    setModalLoja(null);
    setFormDespesa({
      categoria: '',
      descricao: '',
      valor: '',
      foto: null,
      fotoPreview: null
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormDespesa(prev => ({
          ...prev,
          foto: file,
          fotoPreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarDespesa = async (e) => {
    e.preventDefault();

    if (!formDespesa.categoria || !formDespesa.valor) {
      alert('Preencha categoria e valor');
      return;
    }

    if (!formDespesa.foto) {
      alert('A foto do comprovante é obrigatória!');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const despesaData = {
        categoria: formDespesa.categoria,
        descricao: formDespesa.descricao,
        valor: parseFloat(formDespesa.valor),
        lojaId: modalLoja.id,
        lojaNome: modalLoja.nome,
        arquivo: {
          nome: formDespesa.foto.name,
          tipo: formDespesa.foto.type,
          tamanho: formDespesa.foto.size,
          dataUrl: formDespesa.fotoPreview
        }
      };

      const response = await fetch(API_ENDPOINTS.DESPESAS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(despesaData)
      });

      if (response.ok) {
        alert('Despesa lançada com sucesso!');
        fecharModal();
        carregarDados();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar despesa');
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
    }
  };

  const excluirDespesa = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta despesa?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.DESPESAS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Despesa excluída com sucesso!');
        carregarDados();
      } else {
        alert('Erro ao excluir despesa');
      }
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      alert('Erro ao excluir despesa');
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  if (loading) {
    return <div style={{padding: '20px'}}>Carregando...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>💰 Minhas Despesas</h1>
        <button onClick={() => navigate('/tecnico/dashboard')} className="btn-voltar">
          ← Voltar
        </button>
      </header>

      <div className="dashboard-content">
        <h2>Lojas Atribuídas</h2>
        
        {lojasAtribuidas.length === 0 ? (
          <p>Nenhuma loja atribuída no momento.</p>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px'}}>
            {lojasAtribuidas.map(loja => (
              <div key={loja.id} className="dashboard-card" style={{cursor: 'pointer'}} onClick={() => abrirModalDespesa(loja)}>
                <h3>🏪 {loja.nome}</h3>
                <p style={{fontSize: '14px', color: '#666'}}>
                  {loja.cidade} - {loja.estado}
                </p>
                <button className="btn-card" onClick={(e) => { e.stopPropagation(); abrirModalDespesa(loja); }}>
                  Lançar Despesa
                </button>
              </div>
            ))}
          </div>
        )}

        <h2>Histórico de Despesas</h2>
        
        {despesas.length === 0 ? (
          <p>Nenhuma despesa lançada.</p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Loja</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Comprovante</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map(despesa => (
                  <tr key={despesa.id}>
                    <td>{formatarData(despesa.criadoEm)}</td>
                    <td>{despesa.lojaNome}</td>
                    <td><span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: '#2196f3',
                      color: 'white',
                      fontSize: '12px'
                    }}>{despesa.categoria}</span></td>
                    <td>{despesa.descricao || '-'}</td>
                    <td style={{fontWeight: 'bold'}}>{formatarMoeda(despesa.valor)}</td>
                    <td>
                      {despesa.arquivo && (
                        <button 
                          onClick={() => window.open(despesa.arquivo.dataUrl, '_blank')}
                          style={{
                            padding: '4px 8px',
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          📷 Ver
                        </button>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => excluirDespesa(despesa.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Lançamento de Despesa */}
      {modalLoja && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <h2>Lançar Despesa - {modalLoja.nome}</h2>
            
            <form onSubmit={salvarDespesa}>
              <div className="form-group">
                <label>Categoria *</label>
                <select 
                  value={formDespesa.categoria}
                  onChange={e => setFormDespesa({...formDespesa, categoria: e.target.value})}
                  required
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                >
                  <option value="">Selecione...</option>
                  {categoriasDespesas.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formDespesa.valor}
                  onChange={e => setFormDespesa({...formDespesa, valor: e.target.value})}
                  required
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>

              <div className="form-group">
                <label>Descrição (Opcional)</label>
                <textarea
                  value={formDespesa.descricao}
                  onChange={e => setFormDespesa({...formDespesa, descricao: e.target.value})}
                  rows="3"
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>

              <div className="form-group">
                <label>Comprovante (Foto) *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  style={{width: '100%', padding: '8px'}}
                />
                {formDespesa.fotoPreview && (
                  <div style={{marginTop: '10px', textAlign: 'center'}}>
                    <img 
                      src={formDespesa.fotoPreview} 
                      alt="Preview" 
                      style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '4px'}}
                    />
                  </div>
                )}
              </div>

              <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button type="submit" className="btn-primary" style={{flex: 1}}>
                  💾 Salvar Despesa
                </button>
                <button type="button" onClick={fecharModal} className="btn-secondary" style={{flex: 1}}>
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }

        .btn-primary {
          background: #2196f3;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .btn-primary:hover {
          background: #1976d2;
        }

        .btn-secondary {
          background: #666;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .btn-secondary:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

export default TecnicoDespesas;
