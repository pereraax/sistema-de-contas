#!/bin/bash
# Inicia o dev server com cache limpo (evita erro "Cannot find module './8948.js'").
# Uso: ./iniciar-dev-limpo.sh
# Depois: pare o servidor atual (Ctrl+C) e rode este script, ou rode em outro terminal.

set -e
cd "$(dirname "$0")"

echo "🧹 Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache
echo "   .next e node_modules/.cache removidos."
echo ""
echo "▶️  Iniciando dev server (npm run dev)..."
echo "   Aguarde a compilação. Na primeira vez pode demorar um pouco."
echo ""
exec npm run dev
