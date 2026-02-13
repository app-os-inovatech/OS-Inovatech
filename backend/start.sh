#!/bin/sh

# Aguarda MySQL estar disponível (mas não falha se não conectar)
echo "Aguardando MySQL estar disponível..."
node wait-for-mysql.js || echo "MySQL não disponível, usando banco em memória"

# Inicia servidor
echo "Iniciando servidor..."
npm start
