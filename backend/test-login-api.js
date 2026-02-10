const fetch = require('node-fetch');

(async () => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sistema.com',
        senha: '123456'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
