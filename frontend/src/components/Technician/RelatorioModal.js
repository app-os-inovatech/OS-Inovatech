import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

function RelatorioModal({ isOpen, onClose, dados, onSuccess, fotosIniciais = [] }) {
  const [relatoExecucao, setRelatoExecucao] = useState('');
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para as 16 fotos obrigatórias
  const [fotoPhu, setFotoPhu] = useState('');
  const [fotoNumeroSeriePhu, setFotoNumeroSeriePhu] = useState('');
  const [fotoTemperaturaPhu, setFotoTemperaturaPhu] = useState('');
  const [fotoMicroondas, setFotoMicroondas] = useState('');
  const [fotoNumeroSerieMicroondas, setFotoNumeroSerieMicroondas] = useState('');
  const [fotoCuba1Fritadeira, setFotoCuba1Fritadeira] = useState('');
  const [fotoNumeroSerieCuba1Fritadeira, setFotoNumeroSerieCuba1Fritadeira] = useState('');
  const [fotoCuba2Fritadeira, setFotoCuba2Fritadeira] = useState('');
  const [fotoNumeroSerieCuba2Fritadeira, setFotoNumeroSerieCuba2Fritadeira] = useState('');
  const [fotoCuba3Fritadeira, setFotoCuba3Fritadeira] = useState('');
  const [fotoNumeroSerieCuba3Fritadeira, setFotoNumeroSerieCuba3Fritadeira] = useState('');
  const [fotoBroiler, setFotoBroiler] = useState('');
  const [fotoTemperaturaBroiler, setFotoTemperaturaBroiler] = useState('');
  const [fotoPressaoAltaBroiler, setFotoPressaoAltaBroiler] = useState('');
  const [fotoPressaoBaixaBroiler, setFotoPressaoBaixaBroiler] = useState('');
  const [fotoNumeroSerieBroiler, setFotoNumeroSerieBroiler] = useState('');

  useEffect(() => {
    if (isOpen && dados) {
      setFotos(fotosIniciais);
    } else {
      setFotos([]);
    }
  }, [isOpen, dados, fotosIniciais]);

  if (!isOpen || !dados) {
    return null;
  }

  const handleFotoEquipamento = (e, setFoto) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result);
    reader.onerror = () => alert('Erro ao processar foto');
    reader.readAsDataURL(file);
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + fotos.length > 10) {
      alert('Máximo de 10 fotos permitidas');
      return;
    }

    // Converter arquivos para base64
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(fotosBase64 => {
      setFotos([...fotos, ...fotosBase64]);
    }).catch(error => {
      console.error('Erro ao converter fotos:', error);
      alert('Erro ao processar fotos');
    });
  };

  const removerFoto = (index) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!relatoExecucao.trim()) {
      alert('Por favor, descreva as atividades realizadas');
      return;
    }

    // Validar que todas as 16 fotos foram capturadas
    if (!fotoPhu || !fotoNumeroSeriePhu || !fotoTemperaturaPhu || 
        !fotoMicroondas || !fotoNumeroSerieMicroondas ||
        !fotoCuba1Fritadeira || !fotoNumeroSerieCuba1Fritadeira ||
        !fotoCuba2Fritadeira || !fotoNumeroSerieCuba2Fritadeira ||
        !fotoCuba3Fritadeira || !fotoNumeroSerieCuba3Fritadeira ||
        !fotoBroiler || !fotoTemperaturaBroiler || 
        !fotoPressaoAltaBroiler || !fotoPressaoBaixaBroiler || 
        !fotoNumeroSerieBroiler) {
      alert('É obrigatório enviar todas as 16 fotos dos equipamentos. Verifique se todas foram capturadas.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/relatorios-diarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agendamento_id: dados.agendamentoId,
          loja_id: dados.lojaId,
          check_in: dados.checkIn,
          check_out: dados.checkOut,
          checkin_latitude: dados.checkInLatitude,
          checkin_longitude: dados.checkInLongitude,
          checkout_latitude: dados.checkOutLatitude,
          checkout_longitude: dados.checkOutLongitude,
          loja_nome: dados.lojaNome,
          tipo_servico: dados.tipoServico,
          relato_execucao: relatoExecucao,
          fotos: fotos,
          // 16 fotos obrigatórias dos equipamentos
          foto_phu: fotoPhu,
          foto_numero_serie_phu: fotoNumeroSeriePhu,
          foto_temperatura_phu: fotoTemperaturaPhu,
          foto_microondas: fotoMicroondas,
          foto_numero_serie_microondas: fotoNumeroSerieMicroondas,
          foto_cuba_1_fritadeira: fotoCuba1Fritadeira,
          foto_numero_serie_cuba_1_fritadeira: fotoNumeroSerieCuba1Fritadeira,
          foto_cuba_2_fritadeira: fotoCuba2Fritadeira,
          foto_numero_serie_cuba_2_fritadeira: fotoNumeroSerieCuba2Fritadeira,
          foto_cuba_3_fritadeira: fotoCuba3Fritadeira,
          foto_numero_serie_cuba_3_fritadeira: fotoNumeroSerieCuba3Fritadeira,
          foto_broiler: fotoBroiler,
          foto_temperatura_broiler: fotoTemperaturaBroiler,
          foto_pressao_alta_broiler: fotoPressaoAltaBroiler,
          foto_pressao_baixa_broiler: fotoPressaoBaixaBroiler,
          foto_numero_serie_broiler: fotoNumeroSerieBroiler
        })
      });

      if (response.ok) {
        alert('Relatório enviado com sucesso!');
        setRelatoExecucao('');
        setFotos([]);
        // Resetar todas as fotos
        setFotoPhu('');
        setFotoNumeroSeriePhu('');
        setFotoTemperaturaPhu('');
        setFotoMicroondas('');
        setFotoNumeroSerieMicroondas('');
        setFotoCuba1Fritadeira('');
        setFotoNumeroSerieCuba1Fritadeira('');
        setFotoCuba2Fritadeira('');
        setFotoNumeroSerieCuba2Fritadeira('');
        setFotoCuba3Fritadeira('');
        setFotoNumeroSerieCuba3Fritadeira('');
        setFotoBroiler('');
        setFotoTemperaturaBroiler('');
        setFotoPressaoAltaBroiler('');
        setFotoPressaoBaixaBroiler('');
        setFotoNumeroSerieBroiler('');
        onSuccess();
      } else {
        const error = await response.json();
        alert('Erro ao enviar relatório: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar relatório');
    } finally {
      setLoading(false);
    }
  };

  const calcularDuracao = () => {
    const inicio = new Date(dados.checkIn);
    const fim = new Date(dados.checkOut);
    const duracao = Math.floor((fim - inicio) / 1000 / 60); // em minutos
    return `${Math.floor(duracao / 60)}h ${duracao % 60}min`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        width: '100%'
      }}>
        <h2 style={{marginBottom: '20px', color: '#333', textAlign: 'center'}}>
          📝 Relatório Diário de Execução
        </h2>

        {/* Informações do Dia */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '25px'
        }}>
          <h3 style={{margin: '0 0 15px 0', fontSize: '1.1em'}}>Informações do Atendimento</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95em'}}>
            <div>
              <strong>Loja:</strong><br/>
              {dados.lojaNome}
            </div>
            <div>
              <strong>Duração Total:</strong><br/>
              {calcularDuracao()}
            </div>
            <div>
              <strong>Check-in:</strong><br/>
              {new Date(dados.checkIn).toLocaleString('pt-BR')}
            </div>
            <div>
              <strong>Check-out:</strong><br/>
              {new Date(dados.checkOut).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Relato de Execução */}
        <div style={{marginBottom: '25px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333',
            fontSize: '1em'
          }}>
            Relato de Execução <span style={{color: '#dc3545'}}>*</span>
          </label>
          <textarea
            value={relatoExecucao}
            onChange={(e) => setRelatoExecucao(e.target.value)}
            placeholder="Descreva detalhadamente as atividades realizadas, equipamentos instalados, dificuldades encontradas e observações importantes..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.95em',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <small style={{color: '#666', fontSize: '0.85em'}}>
            Seja específico sobre o trabalho realizado
          </small>
        </div>

        {/* Fotos dos Equipamentos - Obrigatórias */}
        <div style={{marginBottom: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107'}}>
          <h3 style={{marginTop: '0', color: '#856404', marginBottom: '20px'}}>
            📷 Fotos dos Equipamentos <span style={{color: '#dc3545'}}>* (Todas obrigatórias)</span>
          </h3>
          
          {/* PHU */}
          <div style={{marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #ddd'}}>
            <h4 style={{margin: '0 0 10px 0', color: '#333'}}>🔥 PHU (Plataforma de Aquecimento Unitária)</h4>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Foto da PHU {fotoPhu ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoPhu)} style={{width: '100%', padding: '8px'}} />
                {fotoPhu && <img src={fotoPhu} alt="PHU" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Número de série {fotoNumeroSeriePhu ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoNumeroSeriePhu)} style={{width: '100%', padding: '8px'}} />
                {fotoNumeroSeriePhu && <img src={fotoNumeroSeriePhu} alt="Série PHU" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Temperaturas {fotoTemperaturaPhu ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoTemperaturaPhu)} style={{width: '100%', padding: '8px'}} />
                {fotoTemperaturaPhu && <img src={fotoTemperaturaPhu} alt="Temp PHU" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
            </div>
          </div>

          {/* Microondas */}
          <div style={{marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #ddd'}}>
            <h4 style={{margin: '0 0 10px 0', color: '#333'}}>🌊 Microondas</h4>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Foto do Microondas {fotoMicroondas ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoMicroondas)} style={{width: '100%', padding: '8px'}} />
                {fotoMicroondas && <img src={fotoMicroondas} alt="Microondas" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Número de série {fotoNumeroSerieMicroondas ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoNumeroSerieMicroondas)} style={{width: '100%', padding: '8px'}} />
                {fotoNumeroSerieMicroondas && <img src={fotoNumeroSerieMicroondas} alt="Série Microondas" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
            </div>
          </div>

          {/* Fritadeira */}
          <div style={{marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #ddd'}}>
            <h4 style={{margin: '0 0 10px 0', color: '#333'}}>🍟 Fritadeira (3 Cubas)</h4>
            {[
              { cuba: 1, fotoEstado: fotoCuba1Fritadeira, setFotoEstado: setFotoCuba1Fritadeira, fotoSerie: fotoNumeroSerieCuba1Fritadeira, setFotoSerie: setFotoNumeroSerieCuba1Fritadeira },
              { cuba: 2, fotoEstado: fotoCuba2Fritadeira, setFotoEstado: setFotoCuba2Fritadeira, fotoSerie: fotoNumeroSerieCuba2Fritadeira, setFotoSerie: setFotoNumeroSerieCuba2Fritadeira },
              { cuba: 3, fotoEstado: fotoCuba3Fritadeira, setFotoEstado: setFotoCuba3Fritadeira, fotoSerie: fotoNumeroSerieCuba3Fritadeira, setFotoSerie: setFotoNumeroSerieCuba3Fritadeira }
            ].map(({cuba, fotoEstado, setFotoEstado, fotoSerie, setFotoSerie}) => (
              <div key={cuba} style={{marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Cuba {cuba} {fotoEstado ? '✓' : '❌'}</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoEstado)} style={{width: '100%', padding: '8px'}} />
                  {fotoEstado && <img src={fotoEstado} alt={`Cuba ${cuba}`} style={{width: '100%', height: '60px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Série Cuba {cuba} {fotoSerie ? '✓' : '❌'}</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoSerie)} style={{width: '100%', padding: '8px'}} />
                  {fotoSerie && <img src={fotoSerie} alt={`Série Cuba ${cuba}`} style={{width: '100%', height: '60px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
                </div>
              </div>
            ))}
          </div>

          {/* Broiler */}
          <div style={{marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #ddd'}}>
            <h4 style={{margin: '0 0 10px 0', color: '#333'}}>🔥 Broiler</h4>
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '10px'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9em', marginBottom: '5px', fontWeight: 'bold'}}>Foto do Broiler {fotoBroiler ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoBroiler)} style={{width: '100%', padding: '8px'}} />
                {fotoBroiler && <img src={fotoBroiler} alt="Broiler" style={{width: '100%', height: '80px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.85em', marginBottom: '5px', fontWeight: 'bold'}}>Temperatura {fotoTemperaturaBroiler ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoTemperaturaBroiler)} style={{width: '100%', padding: '8px', fontSize: '0.9em'}} />
                {fotoTemperaturaBroiler && <img src={fotoTemperaturaBroiler} alt="Temp Broiler" style={{width: '100%', height: '60px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.85em', marginBottom: '5px', fontWeight: 'bold'}}>P. Alta {fotoPressaoAltaBroiler ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoPressaoAltaBroiler)} style={{width: '100%', padding: '8px', fontSize: '0.9em'}} />
                {fotoPressaoAltaBroiler && <img src={fotoPressaoAltaBroiler} alt="P. Alta" style={{width: '100%', height: '60px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.85em', marginBottom: '5px', fontWeight: 'bold'}}>P. Baixa {fotoPressaoBaixaBroiler ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoPressaoBaixaBroiler)} style={{width: '100%', padding: '8px', fontSize: '0.9em'}} />
                {fotoPressaoBaixaBroiler && <img src={fotoPressaoBaixaBroiler} alt="P. Baixa" style={{width: '100%', height: '60px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.85em', marginBottom: '5px', fontWeight: 'bold'}}>Série {fotoNumeroSerieBroiler ? '✓' : '❌'}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFotoEquipamento(e, setFotoNumeroSerieBroiler)} style={{width: '100%', padding: '8px', fontSize: '0.9em'}} />
                {fotoNumeroSerieBroiler && <img src={fotoNumeroSerieBroiler} alt="Série Broiler" style={{width: '100%', height: '60px', objectFit: 'cover', marginTop: '5px', borderRadius: '4px'}} />}
              </div>
            </div>
          </div>

          {/* Indicador de Progresso */}
          <div style={{padding: '10px', background: '#e8f5e9', borderRadius: '4px', textAlign: 'center'}}>
            <strong>Fotos capturadas: </strong>
            {[fotoPhu, fotoNumeroSeriePhu, fotoTemperaturaPhu, fotoMicroondas, fotoNumeroSerieMicroondas, fotoCuba1Fritadeira, fotoNumeroSerieCuba1Fritadeira, fotoCuba2Fritadeira, fotoNumeroSerieCuba2Fritadeira, fotoCuba3Fritadeira, fotoNumeroSerieCuba3Fritadeira, fotoBroiler, fotoTemperaturaBroiler, fotoPressaoAltaBroiler, fotoPressaoBaixaBroiler, fotoNumeroSerieBroiler].filter(f => f).length}/16
          </div>
        </div>

        {/* Upload de Fotos Adicionais */}
        <div style={{marginBottom: '25px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333',
            fontSize: '1em'
          }}>
            Fotos do Local da Instalação <span style={{color: '#dc3545'}}>* (mínimo 3 fotos)</span>
          </label>
          
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFotoChange}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              border: '2px dashed #667eea',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          />

          <small style={{color: '#666', fontSize: '0.85em', display: 'block', marginBottom: '15px'}}>
            Envie fotos claras mostrando o trabalho realizado. {fotos.length}/10 fotos
          </small>

          {/* Preview das Fotos */}
          {fotos.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '10px'
            }}>
              {fotos.map((foto, index) => (
                <div key={index} style={{position: 'relative'}}>
                  <img 
                    src={foto} 
                    alt={`Foto ${index + 1}`} 
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #ddd'
                    }}
                  />
                  <button
                    onClick={() => removerFoto(index)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      fontSize: '1.2em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          marginTop: '30px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: '500'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: '500'
            }}
          >
            {loading ? '📤 Enviando...' : '✓ Enviar Relatório'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RelatorioModal;
