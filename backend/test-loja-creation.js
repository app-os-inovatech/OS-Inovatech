const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testLojaCreation() {
  try {
    // 1. Login
    console.log('1️⃣  Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@sistema.com',
      senha: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login bem-sucedido');
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log('');

    // 2. Create loja
    console.log('2️⃣  Criando loja...');
    const lojaResponse = await axios.post(
      `${BASE_URL}/api/lojas`,
      {
        nome: 'Loja Teste São Paulo',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
        telefone: '(11) 98765-4321',
        email: 'loja@teste.com',
        responsavel: 'João Silva'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Loja criada com sucesso!');
    console.log('Response:', JSON.stringify(lojaResponse.data, null, 2));
    console.log('');

    // 3. List lojas
    console.log('3️⃣  Listando lojas...');
    const listResponse = await axios.get(
      `${BASE_URL}/api/lojas`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Lojas listadas com sucesso!');
    console.log(`Total de lojas: ${listResponse.data.length}`);
    listResponse.data.forEach((loja, index) => {
      console.log(`  ${index + 1}. ${loja.nome} (${loja.cidade})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    if (error.config) {
      console.error('URL:', error.config.url);
      console.error('Método:', error.config.method);
    }
    process.exit(1);
  }
}

testLojaCreation();
