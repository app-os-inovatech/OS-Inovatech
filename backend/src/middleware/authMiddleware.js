const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Pegar token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Formato: Bearer TOKEN
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    // Verificar token
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      // Adicionar informações do usuário na requisição
      req.user = decoded;
      return next();
    });

  } catch (error) {
    return res.status(401).json({ error: 'Falha na autenticação' });
  }
};

module.exports = authMiddleware;
