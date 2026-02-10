import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import './AdminCategoriasDespesa.css';

function AdminCategoriasDespesa() {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [cor, setCor] = useState('#003DA5');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/categorias-despesa`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCategorias(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!novaCategoria.trim()) {
      alert('Digite o nome da categoria');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editando
        ? `${API_BASE_URL}/api/categorias-despesa/${editando}`
        : `${API_BASE_URL}/api/categorias-despesa`;

      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: novaCategoria,
          cor: cor
        })
      });

      if (response.ok) {
        alert(editando ? 'Categoria atualizada!' : 'Categoria criada!');
        setNovaCategoria('');
        setCor('#003DA5');
        setEditando(null);
        setShowForm(false);
        carregarCategorias();
      } else {
        alert('Erro ao salvar categoria');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar categoria');
    }
  };

  const handleEdit = (categoria) => {
    setEditando(categoria.id);
    setNovaCategoria(categoria.nome);
    setCor(categoria.cor || '#003DA5');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta categoria?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/categorias-despesa/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Categoria deletada!');
        carregarCategorias();
      } else {
        alert('Erro ao deletar categoria');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const resetForm = () => {
    setNovaCategoria('');
    setCor('#003DA5');
    setEditando(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="categorias-container">Carregando...</div>;
  }

  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <h2>📂 Categorias de Despesa</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-nova-categoria"
        >
          {showForm ? '❌ Cancelar' : '➕ Nova Categoria'}
        </button>
      </div>

      {showForm && (
        <div className="categoria-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome da Categoria</label>
              <input
                type="text"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Ex: Alimentação, Combustível..."
                required
              />
            </div>

            <div className="form-group">
              <label>Cor</label>
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-salvar">
                {editando ? '✏️ Atualizar' : '💾 Salvar'}
              </button>
              <button type="button" onClick={resetForm} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="categorias-grid">
        {categorias.length === 0 ? (
          <p className="sem-categorias">Nenhuma categoria cadastrada</p>
        ) : (
          categorias.map((cat) => (
            <div key={cat.id} className="categoria-card">
              <div 
                className="categoria-badge"
                style={{ backgroundColor: cat.cor || '#003DA5' }}
              >
                {cat.nome.charAt(0).toUpperCase()}
              </div>
              <h4>{cat.nome}</h4>
              <div className="categoria-actions">
                <button 
                  onClick={() => handleEdit(cat)}
                  className="btn-edit"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="btn-delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminCategoriasDespesa;
