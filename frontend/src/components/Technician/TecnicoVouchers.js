import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import './TecnicoVouchers.css';

function TecnicoVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVouchers();
  }, []);

  const carregarVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/vouchers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setVouchers(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir este voucher?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setVouchers((prev) => prev.filter((v) => v.id !== id));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Erro ao excluir voucher');
      }
    } catch (error) {
      console.error('Erro ao excluir voucher:', error);
      alert('Erro ao excluir voucher');
    }
  };

  if (loading) {
    return <div className="voucher-container">Carregando...</div>;
  }

  return (
    <div className="voucher-container">
      <div className="voucher-header">
        <h1>📄 Meus Vouchers - Documentos de Viagem</h1>
        <p className="info-text">Documentos enviados pelo administrador</p>
      </div>

      <div className="voucher-list-section">
        {vouchers.length === 0 ? (
          <p className="no-vouchers">Nenhum documento disponível</p>
        ) : (
          <div className="voucher-list">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="voucher-item">
                <div className="voucher-info">
                  <h3>{voucher.descricao}</h3>
                  <p className="voucher-date">
                    📅 {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="voucher-file">📎 {voucher.arquivo_nome}</p>
                </div>
                <div className="voucher-actions">
                  <a 
                    href={`${API_BASE_URL}${voucher.arquivo}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-view"
                  >
                    👁️ Visualizar
                  </a>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDelete(voucher.id)}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TecnicoVouchers;
