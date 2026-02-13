#!/bin/sh

# Aguarda MySQL estar pronto
sleep 5

# Inicializa banco (se necessário)
node src/config/initDatabase.js || true

# Inicia servidor
npm start
