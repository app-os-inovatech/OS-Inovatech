import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './ListaChecklistsObra.css';

function ListaChecklistsObra({ agendamentoId }) {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklistSelecionado, setChecklistSelecionado] = useState(null);

  useEffect(() => {
    carregarChecklists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendamentoId]);

  const carregarChecklists = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = agendamentoId 
        ? `${API_BASE_URL}/api/checklist-entrada-obra?agendamento_id=${agendamentoId}`
        : `${API_BASE_URL}/api/checklist-entrada-obra`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChecklists(response.data);
    } catch (error) {
      console.error('Erro ao carregar checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const visualizarChecklist = (checklist) => {
    setChecklistSelecionado(checklist);
  };

  const fecharVisualizacao = () => {
    setChecklistSelecionado(null);
  };

  const imprimirChecklist = () => {
    window.print();
  };

  const getStatusIcon = (valor) => {
    if (valor === 'sim') return '✅';
    if (valor === 'nao') return '❌';
    return '⏳';
  };

  if (loading) return <div className="loading">Carregando checklists...</div>;

  if (checklistSelecionado) {
    return (
      <div className="checklist-visualizacao">
        <div className="visualizacao-header">
          <h2>Checklist de Entrada de Obra</h2>
          <div className="header-actions">
            <button onClick={imprimirChecklist} className="btn-print">🖨️ Imprimir</button>
            <button onClick={fecharVisualizacao} className="btn-close">✖ Fechar</button>
          </div>
        </div>

        <div className="checklist-info">
          <div className="info-grid">
            <div><strong>Loja:</strong> {checklistSelecionado.loja_nome}</div>
            <div><strong>Cidade:</strong> {checklistSelecionado.cidade}</div>
            <div><strong>Gerenciador:</strong> {checklistSelecionado.gerenciador}</div>
            <div><strong>Data:</strong> {new Date(checklistSelecionado.data_checklist).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div className="checklist-secoes">
          <section className="checklist-secao">
            <h3>Parte Civil</h3>
            <table>
              <tbody>
                <tr>
                  <td>1. Equipamentos e acessórios estão disponíveis para início e término da obra</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.civil_1_equipamentos)}</td>
                </tr>
                <tr>
                  <td>2. Piso e forro estão em condições de início de montagem</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.civil_2_piso_forro)}</td>
                </tr>
                <tr>
                  <td>3. Pontos de água quente/fria estão disponíveis a 10cm acima do forro e com registro 3/4"</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.civil_3_agua)}</td>
                </tr>
                <tr>
                  <td>4. Pontos de elétrica estão disponíveis para instalação e de acordo com o projeto</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.civil_4_eletrica)}</td>
                </tr>
                <tr>
                  <td>5. Pontos de Gás estão disponíveis para teste e start e saída do broiler em diâmetro 3/4" e fritadeira 1"</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.civil_5_gas)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="checklist-secao">
            <h3>Exaustão e Intertravamento</h3>
            <table>
              <tbody>
                <tr>
                  <td>6. Sistema de exaustão está disponível para start de equipamentos</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.exaustao_6_sistema)}</td>
                </tr>
                <tr>
                  <td>7. Coifa Melting está instalada e disponível para testes</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.exaustao_7_coifa)}</td>
                </tr>
                <tr>
                  <td>8. Sistema de Intertravamento está executado</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.exaustao_8_intertravamento)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="checklist-secao">
            <h3>Sistema Drive</h3>
            <table>
              <tbody>
                <tr>
                  <td>9. Base para fixação dos sensores estão disponíveis</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.drive_9_base_sensores)}</td>
                </tr>
                <tr>
                  <td>10. Pontos para passagem de fiação estão todos interligados</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.drive_10_fiacao)}</td>
                </tr>
                <tr>
                  <td>11. O totem está posicionado e interligação com a central está disponível</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.drive_11_totem)}</td>
                </tr>
                <tr>
                  <td>12. Tomadas estabilizadas estão disponíveis no forro da primeira cabine</td>
                  <td className="status-cell">{getStatusIcon(checklistSelecionado.drive_12_tomadas)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {checklistSelecionado.pendencias && (
            <section className="checklist-secao">
              <h3>Pendências</h3>
              <div className="pendencias-box">
                {checklistSelecionado.pendencias}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lista-checklists">
      <h2>Checklists de Entrada de Obra</h2>
      
      {checklists.length === 0 ? (
        <p className="sem-dados">Nenhum checklist encontrado.</p>
      ) : (
        <div className="checklists-grid">
          {checklists.map((checklist) => (
            <div key={checklist.id} className="checklist-card">
              <h3>{checklist.loja_nome}</h3>
              <p><strong>Cidade:</strong> {checklist.cidade}</p>
              <p><strong>Gerenciador:</strong> {checklist.gerenciador}</p>
              <p><strong>Data:</strong> {new Date(checklist.data_checklist).toLocaleDateString('pt-BR')}</p>
              <p><strong>Criado em:</strong> {new Date(checklist.created_at).toLocaleString('pt-BR')}</p>
              <button 
                onClick={() => visualizarChecklist(checklist)}
                className="btn-visualizar"
              >
                📄 Visualizar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListaChecklistsObra;
