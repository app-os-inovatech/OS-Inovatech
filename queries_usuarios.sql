-- Listar todos os usuários do sistema
SELECT id, nome, email, tipo, ativo FROM usuarios ORDER BY id;

-- Listar apenas admins
SELECT id, nome, email, tipo FROM usuarios WHERE tipo = 'admin' AND ativo = true;

-- Se quiser criar um novo admin (se não tiver nenhum)
-- INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, ativo, primeiro_acesso) 
-- VALUES ('Novo Admin', 'novoadmin@teste.com', 'HASH_AQUI', 'admin', '11999999999', true, false);

-- Atualizar um usuário para admin
-- UPDATE usuarios SET tipo = 'admin' WHERE email = 'seu_email@exemplo.com';

-- Verificar estrutura da tabela
-- DESCRIBE usuarios;
