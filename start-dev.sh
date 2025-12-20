#!/bin/bash

cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# Parar processos antigos
pkill -9 -f "next" 2>/dev/null
pkill -9 -f "node.*dev" 2>/dev/null
sleep 2

# Limpar cache
rm -rf .next node_modules/.cache .turbo 2>/dev/null

# Iniciar servidor
echo "🚀 Iniciando servidor Next.js..."
npm run dev















