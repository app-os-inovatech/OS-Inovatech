import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Salvar no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.user));

      // Redirecionar baseado no tipo de usuário
      switch (data.user.tipo) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'tecnico':
          navigate('/tecnico/dashboard');
          break;
        case 'cliente':
          navigate('/cliente/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img src="/logos/Inovaguil-logo.png" alt="INOVAGUIL Manutenção" onError={(e) => {
            e.target.src = '/logos/inovaguil-logo.svg';
          }} />
        </div>
        <h2>Sistema de Ordem de Serviço</h2>
        
        {erro && <div className="erro-message">{erro}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
              disabled={carregando}
            />
          </div>

          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="credenciais-teste">
          <p><strong>Credenciais de Teste:</strong></p>
          <p>Admin: admin@example.com / admin123</p>
          <p>Técnico: tecnico@example.com / tecnico123</p>
          <p>Cliente: cliente@example.com / cliente123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
