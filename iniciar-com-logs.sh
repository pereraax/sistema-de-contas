#!/bin/bash

# Script para iniciar o servidor e mostrar logs em tempo real

echo "🚀 Iniciando servidor Next.js com logs visíveis..."
echo ""
echo "📋 IMPORTANTE: Mantenha este terminal aberto para ver os logs!"
echo "   Quando você enviar mensagens via WhatsApp, os logs aparecerão aqui."
echo ""
echo "   Para parar o servidor, pressione: Ctrl+C"
echo ""
echo "=========================================="
echo ""

cd "$(dirname "$0")"
npm run dev

