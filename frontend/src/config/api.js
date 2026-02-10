// Configuração dinâmica da API baseada no ambiente

const getApiBaseUrl = () => {
  // Prioriza variável de ambiente (produção)
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.trim();
  }

  // Se estiver em desenvolvimento e acessando via rede local (celular, outro PC, etc)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Acessando via IP da rede local - usar o mesmo IP/hostname
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5001`;
  }
  
  // Ambiente local (localhost)
  return 'http://localhost:5001';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Usuários
  USUARIOS: `${API_BASE_URL}/api/usuarios`,
  
  // Agendamentos
  AGENDAMENTOS: `${API_BASE_URL}/api/agendamentos`,
  
  // Clientes
  CLIENTES: `${API_BASE_URL}/api/clientes`,
  
  // Lojas
  LOJAS: `${API_BASE_URL}/api/lojas`,
  
  // Franquias
  FRANQUIAS: `${API_BASE_URL}/api/franquias`,
  
  // Técnicos
  TECNICOS: `${API_BASE_URL}/api/tecnicos`,
  
  // Manuais
  MANUAIS: `${API_BASE_URL}/api/manuais`,
  
  // Relatórios
  RELATORIOS: `${API_BASE_URL}/api/relatorios-diarios`,
  
  // Notificações
  NOTIFICACOES: `${API_BASE_URL}/api/notificacoes`,
  
  // Despesas
  DESPESAS: `${API_BASE_URL}/api/despesas`,
  
  // Checklist
  CHECKLIST: `${API_BASE_URL}/api/checklist-entrada-obra`,
  CHECKLIST_ENTRADA_OBRA: `${API_BASE_URL}/api/checklist-entrada-obra`
};

// Construtor de URLs de upload
export const getUploadUrl = (path) => `${API_BASE_URL}${path}`;

export const UPLOAD_PATHS = {
  MANUALS: (filename) => `${API_BASE_URL}/uploads/manuals/${filename}`,
  VIDEOS: (filename) => `${API_BASE_URL}/uploads/videos/${filename}`,
  PHOTOS: (filename) => `${API_BASE_URL}/uploads/photos/${filename}`,
  TECNICO_PHOTOS: (photo) => `${API_BASE_URL}${photo}`
};

// Função auxiliar para fazer requisições
export const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
};

console.log('API Base URL:', API_BASE_URL);
