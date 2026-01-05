#!/bin/bash

# Script para iniciar o servidor Next.js

cd "$(dirname "$0")"

echo "🚀 Iniciando servidor Next.js..."
echo ""

# Parar processos existentes na porta 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Parando processo existente na porta 3000..."
    kill $(lsof -ti:3000) 2>/dev/null
    sleep 2
fi

# Iniciar servidor
echo "✅ Iniciando servidor..."
npm run dev
