#!/bin/bash

# Script para verificar se servidor e túnel estão rodando

echo "🔍 Verificando status do sistema..."
echo ""

# Verificar servidor
SERVER_PID=$(lsof -ti:3000 2>/dev/null)
if [ -z "$SERVER_PID" ]; then
    echo "❌ Servidor: NÃO está rodando (porta 3000)"
    echo "   Execute: npm run dev"
else
    echo "✅ Servidor: Rodando (PID: $SERVER_PID)"
fi

# Verificar túnel
TUNNEL_PID=$(ps aux | grep -i "localtunnel\|lt --port" | grep -v grep | awk '{print $2}' | head -1)
if [ -z "$TUNNEL_PID" ]; then
    echo "❌ Túnel: NÃO está rodando"
    echo "   Execute: npm run tunnel"
else
    echo "✅ Túnel: Rodando (PID: $TUNNEL_PID)"
    
    # Tentar extrair URL do log
    if [ -f "tunnel.log" ]; then
        TUNNEL_URL=$(grep -oP 'your url is: \K[^\s]+' tunnel.log 2>/dev/null | tail -1)
        if [ ! -z "$TUNNEL_URL" ]; then
            echo "   URL: $TUNNEL_URL"
            echo "   Webhook: $TUNNEL_URL/api/whatsapp/apifacil/webhook"
        fi
    fi
fi

echo ""
echo "📋 Para iniciar tudo: ./iniciar-tudo.sh"
echo "📋 Ou: npm run start:all"










