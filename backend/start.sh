#!/bin/sh

# Aguarda MySQL estar pronto
echo "Aguardando MySQL..."
sleep 15

# Inicializa banco (se necessário)
echo "Inicializando banco de dados..."
node src/config/initDatabase.js || true

# Inicia servidor
echo "Iniciando servidor..."
npm start
