const axios = require('axios');

async function testarAgendamento() {
  try {
    // Login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      senha: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Login realizado\n');

    // Buscar lojas
    const lojasRes = await axios.get('http://localhost:5001/api/lojas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const lojaId = lojasRes.data[0]?.id;
    console.log(`📍 Loja ID: ${lojaId} - ${lojasRes.data[0]?.nome}`);

    // Buscar clientes
    const clientesRes = await axios.get('http://localhost:5001/api/clientes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clienteId = clientesRes.data[0]?.id;
    console.log(`👤 Cliente ID: ${clienteId} - ${clientesRes.data[0]?.nome}\n`);

    // Criar agendamento de teste
    const novoAgendamento = {
      loja_id: lojaId,
      cliente_id: clienteId,
      tecnico_id: null,
      tipo_servico: 'Manutenção Teste',
      data_hora: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      descricao_servico: 'Teste de agendamento via API',
      observacoes: 'Criado automaticamente para teste'
    };

    console.log('📝 Criando agendamento:', JSON.stringify(novoAgendamento, null, 2));

    const response = await axios.post('http://localhost:5001/api/agendamentos', 
      novoAgendamento,
      { headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }}
    );

    console.log('\n✅ Agendamento criado com sucesso!');
    console.log('ID:', response.data.id || response.data);
  } catch (error) {
    console.error('\n❌ Erro ao criar agendamento:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testarAgendamento();
