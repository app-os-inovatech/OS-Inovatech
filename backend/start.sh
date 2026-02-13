#!/bin/sh

# Aguarda MySQL estar pronto
echo "Aguardando MySQL estar disponível..."
node wait-for-mysql.js

# Inicializa banco (se necessário)
echo "Inicializando banco de dados..."
node src/config/initDatabase.js || true

# Inicia servidor
echo "Iniciando servidor..."
npm start
