// Middleware para controle de permissões por tipo de usuário

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('🔍 [RoleMiddleware] Verificando permissões:');
    console.log('   - Usuário:', req.user);
    console.log('   - Roles permitidas:', allowedRoles);
    
    if (!req.user) {
      console.log('❌ [RoleMiddleware] Usuário não autenticado');
      return res.status(401).json({ 
        error: 'Não autenticado',
        message: 'Você precisa estar logado para acessar este recurso'
      });
    }
    
    console.log('   - Tipo do usuário:', req.user.tipo);
    console.log('   - Tipo de dado:', typeof req.user.tipo);
    console.log('   - Includes?', allowedRoles.includes(req.user.tipo));
    
    if (!allowedRoles.includes(req.user.tipo)) {
      console.log('❌ [RoleMiddleware] Acesso negado');
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      });
    }
    
    console.log('✅ [RoleMiddleware] Acesso permitido');
    next();
  };
};

// Atalhos para papéis específicos
const requireAdmin = requireRole('admin');
const requireTechnician = requireRole('tecnico');
const requireClient = requireRole('cliente');
const requireManager = requireRole('gerenciador');
const requireAdminOrTechnician = requireRole('admin', 'tecnico');
const requireAdminOrManager = requireRole('admin', 'gerenciador');
const requireAny = requireRole('admin', 'tecnico', 'cliente', 'gerenciador');

module.exports = {
  requireRole,
  requireAdmin,
  requireTechnician,
  requireClient,
  requireManager,
  requireAdminOrTechnician,
  requireAdminOrManager,
  requireAny
};
