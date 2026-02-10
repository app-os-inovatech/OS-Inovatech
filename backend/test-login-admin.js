const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testando login com admin@example.com...\n');
    
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      senha: 'admin123'
    });

    console.log('✅ Login bem-sucedido!');
    console.log('Token:', response.data.token);
    console.log('Usuário:', JSON.stringify(response.data.user, null, 2));
  } catch (error) {
    console.error('❌ Erro no login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testLogin();
