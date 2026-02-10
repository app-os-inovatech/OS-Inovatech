// Matriz de permissões por tipo de usuário

const PERMISSIONS = {
  // ADMINISTRADOR - Acesso Total
  admin: {
    usuarios: ['create', 'read', 'update', 'delete'],
    lojas: ['create', 'read', 'update', 'delete'],
    tecnicos: ['create', 'read', 'update', 'delete'],
    clientes: ['create', 'read', 'update', 'delete'],
    agendamentos: ['create', 'read', 'update', 'delete', 'assign'],
    cursos: ['create', 'read', 'update', 'delete'],
    os: ['create', 'read', 'update', 'delete', 'generate', 'send'],
    fotos: ['create', 'read', 'update', 'delete'],
    relatorios: ['read', 'export'],
    configuracoes: ['read', 'update']
  },
  
  // TÉCNICO - Preenche OS, anexa fotos e acessa agenda
  tecnico: {
    agendamentos: ['read_assigned', 'read_all'],
    os: ['create', 'read_own', 'update_own', 'generate_own'],
    fotos: ['create', 'read_own', 'delete_own'],
    perfil: ['read', 'update_own'],
    cursos: ['read_own'],
    lojas: ['read'],
    clientes: ['read']
  },
  
  // GERENCIADOR - Apenas consulta relatórios
  gerenciador: {
    relatorios: ['read', 'export'],
    os: ['read'],
    agendamentos: ['read'],
    tecnicos: ['read'],
    lojas: ['read'],
    clientes: ['read'],
    perfil: ['read', 'update_own']
  },
  
  // CLIENTE - Apenas consulta e criação de agendamentos
  cliente: {
    lojas: ['read'],
    agendamentos: ['create', 'read_own'],
    tecnicos: ['read_assigned'],
    os: ['read_own'],
    perfil: ['read', 'update_own']
  }
};

const hasPermission = (userType, resource, action) => {
  if (!PERMISSIONS[userType]) return false;
  if (!PERMISSIONS[userType][resource]) return false;
  return PERMISSIONS[userType][resource].includes(action);
};

module.exports = {
  PERMISSIONS,
  hasPermission
};
