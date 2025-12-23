#!/bin/bash

# Script de start para Render
# Garante que o servidor inicie corretamente

echo "🚀 Iniciando servidor Next.js..."
echo "   - NODE_ENV: ${NODE_ENV:-production}"
echo "   - PORT: ${PORT:-10000}"
echo "   - RENDER: ${RENDER:-not set}"

# Verificar se server.js existe
if [ ! -f "server.js" ]; then
  echo "❌ Erro: server.js não encontrado!"
  exit 1
fi

# Iniciar servidor
exec node server.js
