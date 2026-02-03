#!/bin/bash

# Script para ver logs do servidor Next.js em tempo real
# Focado em logs do WhatsApp

echo "🔍 Procurando processo do servidor Next.js..."
PID=$(lsof -ti:3000 2>/dev/null | head -1)

if [ -z "$PID" ]; then
    echo "❌ Servidor não está rodando na porta 3000"
    echo "   Inicie o servidor com: npm run dev"
    exit 1
fi

echo "✅ Servidor encontrado (PID: $PID)"
echo ""
echo "📋 Logs do servidor (filtrado para WhatsApp):"
echo "   Pressione Ctrl+C para sair"
echo "   ==========================================="
echo ""

# Ver logs do arquivo se existir
if [ -f "/tmp/nextjs-logs.txt" ]; then
    tail -f /tmp/nextjs-logs.txt | grep --line-buffered -iE "whatsapp|plen|webhook|limite|envio|teste|plano" || tail -f /tmp/nextjs-logs.txt
else
    echo "⚠️ Arquivo /tmp/nextjs-logs.txt não encontrado"
    echo ""
    echo "💡 Para ver logs completos, pare o servidor e reinicie com:"
    echo "   npm run dev | tee /tmp/nextjs-logs.txt"
    echo ""
    echo "   Ou use o terminal onde você iniciou o servidor para ver os logs"
fi
