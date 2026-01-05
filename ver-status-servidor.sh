#!/bin/bash

# Script para verificar status do servidor

cd "$(dirname "$0")"

echo "🔍 Verificando status do servidor..."
echo ""

# Verificar se porta 3000 está em uso
if lsof -ti:3000 > /dev/null 2>&1; then
    PID=$(lsof -ti:3000 | head -1)
    echo "✅ Servidor está rodando (PID: $PID)"
    echo "🌐 URL: http://localhost:3000"
    echo ""
    
    # Verificar se está respondendo
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Servidor está respondendo corretamente!"
    else
        echo "⚠️ Servidor pode estar ainda compilando..."
    fi
    
    echo ""
    echo "📋 Logs do servidor:"
    if [ -f "/tmp/servidor-log.txt" ]; then
        tail -20 /tmp/servidor-log.txt
    else
        echo "   (Execute: npm run dev para ver os logs)"
    fi
else
    echo "❌ Servidor não está rodando"
    echo ""
    echo "Para iniciar, execute:"
    echo "  npm run dev"
    echo ""
    echo "Ou use o script:"
    echo "  ./iniciar-servidor.sh"
fi

