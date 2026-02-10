const axios = require('axios');

async function testTecnicos() {
  try {
    // Primeiro faz login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      senha: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Login realizado\n');

    // Buscar técnicos
    const tecnicosRes = await axios.get('http://localhost:5001/api/tecnicos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📋 Técnicos cadastrados:', tecnicosRes.data.length);
    tecnicosRes.data.forEach((t, i) => {
      console.log(`${i+1}. ID: ${t.id} | Nome: ${t.nome} | Email: ${t.email}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testTecnicos();
