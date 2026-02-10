const db = require('../config/database');

const auditMiddleware = (action) => {
  return async (req, res, next) => {
    // Salvar a função original res.json
    const originalJson = res.json.bind(res);

    // Substituir res.json para capturar resposta
    res.json = function(data) {
      // Log apenas se for sucesso (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Executar log de forma assíncrona (não bloqueia resposta)
        setImmediate(async () => {
          try {
            const userId = req.user ? req.user.id : null;
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const detalhes = JSON.stringify({
              method: req.method,
              path: req.path,
              params: req.params,
              body: req.body?.senha ? { ...req.body, senha: '[OCULTO]' } : req.body
            });

            // Tentar inserir log, mas não falhar se não conseguir
            try {
              await db.query(
                'INSERT INTO logs_acesso (usuario_id, acao, detalhes, ip_address) VALUES (?, ?, ?, ?)',
                [userId, action, detalhes, ipAddress]
              );
            } catch (dbError) {
              // Silenciosamente ignora erro de log (banco em mock não tem tabela)
              console.log(`📝 Log de auditoria não registrado: ${action}`);
            }
          } catch (error) {
            console.log(`⚠️ Erro ao processar log de auditoria: ${error.message}`);
          }
        });
      }

      // Chamar função original
      return originalJson(data);
    };

    next();
  };
};

module.exports = auditMiddleware;
