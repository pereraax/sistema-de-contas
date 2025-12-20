#!/bin/bash

# Script para ver a URL atual do tunnel

echo "🔍 Verificando URL do tunnel..."
echo ""

# Tentar ler do arquivo salvo
if [ -f .webhook-url.txt ]; then
    WEBHOOK_URL=$(cat .webhook-url.txt)
    TUNNEL_URL=$(cat .tunnel-url.txt 2>/dev/null || echo "")
    
    echo "✅ URL encontrada:"
    echo ""
    if [ ! -z "$TUNNEL_URL" ]; then
        echo "🌐 URL do Tunnel:"
        echo "   $TUNNEL_URL"
        echo ""
    fi
    echo "🔗 URL do Webhook:"
    echo "   $WEBHOOK_URL"
    echo ""
    
    # Verificar se o processo ainda está rodando
    if pgrep -f "cloudflared tunnel" > /dev/null 2>&1; then
        echo "✅ Tunnel está rodando - URL está ativa!"
    else
        echo "⚠️ Tunnel NÃO está rodando - URL não está ativa!"
        echo "   Execute: ./iniciar-tunnel-fixo.sh"
    fi
else
    echo "⚠️ URL não encontrada em .webhook-url.txt"
    echo ""
    echo "💡 Execute primeiro: ./iniciar-tunnel-fixo.sh"
    echo ""
    
    # Tentar buscar no log
    if [ -f logs/cloudflare-tunnel.log ]; then
        echo "🔍 Procurando no log..."
        TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' logs/cloudflare-tunnel.log 2>/dev/null | tail -1)
        
        if [ ! -z "$TUNNEL_URL" ]; then
            echo "✅ URL encontrada no log:"
            echo "   $TUNNEL_URL"
            echo "   $TUNNEL_URL/api/whatsapp/apifacil/webhook"
        fi
    fi
fi






