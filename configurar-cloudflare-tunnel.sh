#!/bin/bash

# Script para configurar Cloudflare Tunnel (URL fixa GRATUITA)
# Uso: ./configurar-cloudflare-tunnel.sh

echo "🚀 Configurando Cloudflare Tunnel (URL fixa gratuita)..."
echo ""

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "📥 Instalando cloudflared..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared 2>/dev/null || {
            echo "⚠️ brew não disponível. Instale manualmente:"
            echo "   Acesse: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
            exit 1
        }
    else
        echo "⚠️ Instale cloudflared manualmente:"
        echo "   Acesse: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

echo "✅ cloudflared encontrado!"
echo ""

# Verificar se já está rodando
CLOUDFLARE_PID=$(pgrep -f "cloudflared tunnel")
if [ ! -z "$CLOUDFLARE_PID" ]; then
    echo "⚠️ Cloudflare Tunnel já está rodando (PID: $CLOUDFLARE_PID)"
    read -p "Deseja parar e reiniciar? (s/n): " reiniciar
    if [ "$reiniciar" = "s" ] || [ "$reiniciar" = "S" ]; then
        kill $CLOUDFLARE_PID
        sleep 2
    else
        echo "✅ Mantendo Cloudflare Tunnel rodando"
        exit 0
    fi
fi

echo "🌐 Iniciando Cloudflare Tunnel..."
echo ""

# Iniciar cloudflared
cloudflared tunnel --url http://localhost:3000 > cloudflare-tunnel.log 2>&1 &
CLOUDFLARE_PID=$!

sleep 3

# Verificar se iniciou
if ! ps -p $CLOUDFLARE_PID > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar Cloudflare Tunnel. Verifique cloudflare-tunnel.log"
    exit 1
fi

echo "✅ Cloudflare Tunnel iniciado (PID: $CLOUDFLARE_PID)"
echo ""

# Aguardar um pouco para gerar a URL
sleep 3

# Tentar extrair URL do log
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' cloudflare-tunnel.log 2>/dev/null | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "⚠️ Não foi possível obter URL automaticamente"
    echo "   Verifique cloudflare-tunnel.log"
    echo "   Procure por uma URL que comece com: https://"
else
    echo "✅ URL do Cloudflare Tunnel:"
    echo "   $TUNNEL_URL"
    echo ""
    echo "🔗 URL do Webhook:"
    echo "   $TUNNEL_URL/api/whatsapp/apifacil/webhook"
    echo ""
    echo "📋 Copie a URL acima e configure no apifacil.dev"
    echo ""
    echo "💡 IMPORTANTE: Esta URL é FIXA enquanto o processo estiver rodando!"
    echo "   Se parar o Cloudflare Tunnel, a URL mudará na próxima vez"
fi

echo ""
echo "📊 Para ver os logs: tail -f cloudflare-tunnel.log"








