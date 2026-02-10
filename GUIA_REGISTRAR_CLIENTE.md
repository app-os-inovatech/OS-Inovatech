# 📝 GUIA - REGISTRAR NOVO CLIENTE

## 🎯 Objetivo

Permitir que novos clientes se registrem no sistema e acessem a área de cliente.

---

## 📋 Opções de Registro

### ✅ **Opção 1: Registro Público (Recomendado)**

Qualquer pessoa pode se registrar criando uma conta

**Vantagem:** Mais clientes, sem necessidade de admin
**Desvantagem:** Validação necessária

### ✅ **Opção 2: Convite (Mais Seguro)**

Admin envia convite por email, cliente confirma

**Vantagem:** Controle total, sem spam
**Desvantagem:** Mais trabalho administrativo

### ✅ **Opção 3: Via Admin (Atual)**

Admin cria a conta do cliente manualmente

**Vantagem:** Totalmente controlado
**Desvantagem:** Demanda tempo do admin

---

## 🔧 Criar Componente de Registro (Opção 1)

Se quiser adicionar registro público:

**Arquivo:** `frontend/src/components/ClienteRegistro.js`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

function ClienteRegistro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    empresa: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    // Validações
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!validarEmail(formData.email)) {
      setErro('Email inválido');
      return;
    }

    if (formData.senha.length < 6) {
      setErro('Senha deve ter mínimo 6 caracteres');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setErro('Senhas não conferem');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          telefone: formData.telefone,
          empresa: formData.empresa,
          tipo_usuario: 'cliente' // Always create as client
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.message || 'Erro ao registrar');
        return;
      }

      setSucesso('✅ Conta criada com sucesso! Redirecionando para login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2>📝 Criar Conta</h2>
        <p>Preencha os dados abaixo para se registrar</p>

        {erro && <div className="mensagem erro">{erro}</div>}
        {sucesso && <div className="mensagem sucesso">{sucesso}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="form-group">
            <label>Empresa/Loja</label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="form-group">
            <label>Senha *</label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar Senha *</label>
            <input
              type="password"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              placeholder="Confirme sua senha"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-registro">
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="login-link">
          Já tem conta? <a onClick={() => navigate('/login')}>Faça login aqui</a>
        </p>
      </div>
    </div>
  );
}

export default ClienteRegistro;
```

---

## 🔌 Criar Endpoint de Registro (Backend)

**Arquivo:** `backend/src/routes/auth.js`

```javascript
// Adicionar ao arquivo existente

router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha, telefone, empresa, tipo_usuario } = req.body;

    // Validar dados
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Dados obrigatórios ausentes' });
    }

    // Verificar se email já existe
    const conn = mysql.createConnection(dbConfig);
    const checkEmail = 'SELECT id FROM usuarios WHERE email = ?';
    
    conn.query(checkEmail, [email], async (err, results) => {
      if (results.length > 0) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Inserir usuário
      const insertUser = `
        INSERT INTO usuarios 
        (nome, email, senha, telefone, tipo_usuario, status, data_criacao) 
        VALUES (?, ?, ?, ?, ?, 'ativo', NOW())
      `;

      conn.query(
        insertUser,
        [nome, email, senhaHash, telefone, tipo_usuario || 'cliente'],
        (err, result) => {
          conn.end();
          
          if (err) {
            return res.status(500).json({ message: 'Erro ao registrar' });
          }

          res.status(201).json({ 
            message: 'Usuário criado com sucesso',
            id: result.insertId 
          });
        }
      );
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});
```

---

## 🛣️ Adicionar Rota no App.js

```javascript
import ClienteRegistro from './components/ClienteRegistro';

// ... dentro do Routes:
<Route path="/registro" element={<ClienteRegistro />} />
```

---

## 📧 Email de Confirmação (Opcional)

```javascript
// Após registro bem-sucedido, enviar email

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: '✅ Conta Criada com Sucesso!',
  html: `
    <h2>Bem-vindo ao INOVAGUIL!</h2>
    <p>Olá ${nome},</p>
    <p>Sua conta foi criada com sucesso.</p>
    <p>
      <a href="https://inovaguil.com.br/login" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Acessar Sistema
      </a>
    </p>
    <p>Email: ${email}</p>
    <p>Qualquer dúvida, contate suporte@inovaguil.com.br</p>
  `
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Erro ao enviar email:', error);
  } else {
    console.log('Email enviado:', info.response);
  }
});
```

---

## 👨‍💼 Registrar Cliente via Admin (Método Atual)

**Como fazer:**

1. Acesse `/admin/usuarios`
2. Clique em "Novo Usuário"
3. Selecione tipo "Cliente"
4. Preencha dados
5. Salve

**Opção:** Enviar credenciais por email para o cliente

---

## 🔐 Melhores Práticas

✅ **Fazer:**
- Validar email antes de salvar
- Hash seguro de senha (bcrypt)
- Email de confirmação
- Termos de serviço a aceitar
- Proteção contra bot (CAPTCHA opcional)

❌ **Evitar:**
- Senhas fracas
- Email não validado
- Reuso de código
- Dados de teste em produção

---

## 🎯 Próximos Passos

1. Decidir qual opção usar:
   - [ ] Registro público
   - [ ] Convite por email
   - [ ] Apenas admin

2. Implementar a solução

3. Testar com usuários reais

4. Monitorer/gerenciar contas

---

**Documentação Criada:** 29/01/2026
**Versão:** 1.0
