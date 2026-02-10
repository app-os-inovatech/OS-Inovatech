// Interceptador global de fetch para redirecionar URLs hardcoded
const originalFetch = window.fetch;

window.fetch = function(...args) {
  let url = args[0];
  const options = args[1] || {};

  // Se a URL é uma string e contém localhost:5001, substituir pelo IP/hostname correto
  if (typeof url === 'string' && url.includes('localhost:5001')) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Acessando via IP - redirecionar para o IP correto
      url = url.replace('http://localhost:5001', `${protocol}//${hostname}:5001`);
      console.log('🔄 Redirecionando URL:', url);
    }
  }
  
  // Também trata localhost:3001
  if (typeof url === 'string' && url.includes('localhost:3001')) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      url = url.replace('http://localhost:3001', `${protocol}//${hostname}:3001`);
      console.log('🔄 Redirecionando URL (3001):', url);
    }
  }

  return originalFetch(url, options);
};

console.log('✅ Fetch interceptor ativado');
console.log('🌐 Hostname detectado:', window.location.hostname);
console.log('🔒 Protocol:', window.location.protocol);
