import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function AdminDespesas() {
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [imagemModal, setImagemModal] = useState(null);

  useEffect(() => {
    carregarDespesas();
  }, []);

  const carregarDespesas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.DESPESAS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDespesas(data);
      } else {
        console.error('Erro ao carregar despesas');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
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
        carregarDespesas();
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

  // Filtrar despesas
  const despesasFiltradas = despesas.filter(d => {
    const matchTecnico = !filtroTecnico || d.tecnicoNome.toLowerCase().includes(filtroTecnico.toLowerCase());
    const matchCategoria = !filtroCategoria || d.categoria === filtroCategoria;
    const matchLoja = !filtroLoja || (d.lojaNome && d.lojaNome.toLowerCase().includes(filtroLoja.toLowerCase()));
    return matchTecnico && matchCategoria && matchLoja;
  });

  // Agrupar despesas por técnico
  const despesasPorTecnico = despesasFiltradas.reduce((acc, despesa) => {
    const tecnico = despesa.tecnicoNome || 'Sem técnico';
    if (!acc[tecnico]) {
      acc[tecnico] = [];
    }
    acc[tecnico].push(despesa);
    return acc;
  }, {});

  // Calcular totais
  const totalGeral = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);
  const categorias = [...new Set(despesas.map(d => d.categoria))];

  const baixarRelatorioExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.DESPESAS}/relatorio/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        let mensagem = 'Erro ao gerar relatório';
        try {
          const erro = await response.json();
          mensagem = erro?.error || mensagem;
        } catch (_) {
          // Mantém mensagem padrão se não for JSON
        }
        alert(mensagem);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Despesas_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      alert('Erro ao baixar relatório');
    }
  };

  if (loading) {
    return <div style={{padding: '20px'}}>Carregando...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <h1 style={{margin: 0}}>💰 Gestão de Despesas</h1>
        <div style={{display: 'flex', gap: '10px', marginLeft: 'auto'}}>
          <button 
            onClick={baixarRelatorioExcel}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
            title="Baixar relatório consolidado em Excel"
          >
            📊 Baixar Relatório
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-voltar">
            ← Voltar
          </button>
        </div>
      </header>

      <div className="admin-content">
        {/* Filtros */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{marginTop: 0}}>🔍 Filtros</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Técnico</label>
              <input
                type="text"
                placeholder="Buscar técnico..."
                value={filtroTecnico}
                onChange={e => setFiltroTecnico(e.target.value)}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Categoria</label>
              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
              >
                <option value="">Todas</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Loja</label>
              <input
                type="text"
                placeholder="Buscar loja..."
                value={filtroLoja}
                onChange={e => setFiltroLoja(e.target.value)}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
              />
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div style={{
          background: '#2196f3',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{margin: 0}}>Total de Despesas: {formatarMoeda(totalGeral)}</h2>
          <p style={{margin: '10px 0 0 0'}}>{despesasFiltradas.length} despesa(s) encontrada(s)</p>
        </div>

        {/* Despesas agrupadas por técnico */}
        {Object.keys(despesasPorTecnico).length === 0 ? (
          <p>Nenhuma despesa encontrada.</p>
        ) : (
          Object.entries(despesasPorTecnico).map(([tecnico, despesasTecnico]) => {
            const totalTecnico = despesasTecnico.reduce((sum, d) => sum + d.valor, 0);
            
            return (
              <div key={tecnico} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <h3 style={{margin: 0}}>👤 {tecnico}</h3>
                  <div style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    Total: {formatarMoeda(totalTecnico)}
                  </div>
                </div>

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
                      {despesasTecnico.map(despesa => (
                        <tr key={despesa.id}>
                          <td>{formatarData(despesa.criadoEm)}</td>
                          <td>{despesa.lojaNome || '-'}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: getCategoriaColor(despesa.categoria),
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {despesa.categoria}
                            </span>
                          </td>
                          <td>{despesa.descricao || '-'}</td>
                          <td style={{fontWeight: 'bold', color: '#2196f3'}}>{formatarMoeda(despesa.valor)}</td>
                          <td>
                            {despesa.arquivo && (
                              <button 
                                onClick={() => setImagemModal(despesa.arquivo.dataUrl)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                📷 Ver Comprovante
                              </button>
                            )}
                          </td>
                          <td>
                            <button 
                              onClick={() => excluirDespesa(despesa.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
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
              </div>
            );
          })
        )}
      </div>

      {/* Modal de visualização de imagem */}
      {imagemModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => setImagemModal(null)}
        >
          <div style={{position: 'relative', maxWidth: '90%', maxHeight: '90vh'}}>
            <button
              onClick={() => setImagemModal(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✖ Fechar
            </button>
            <img 
              src={imagemModal} 
              alt="Comprovante" 
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para cores das categorias
function getCategoriaColor(categoria) {
  const cores = {
    'Uber': '#9c27b0',
    'Refeição': '#ff9800',
    'Material': '#2196f3',
    'Hospedagem': '#4caf50'
  };
  return cores[categoria] || '#666';
}

export default AdminDespesas;
