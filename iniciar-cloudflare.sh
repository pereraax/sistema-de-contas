#!/bin/bash

# Script simples para iniciar Cloudflare Tunnel
# Usa npx, não precisa instalar nada

echo "🚀 Iniciando Cloudflare Tunnel..."
echo ""

# Parar processos anteriores
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

# Verificar se servidor está rodando
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Servidor não está rodando na porta 3000!"
    echo "   Execute: npm run dev"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n): " continuar
    if [ "$continuar" != "s" ] && [ "$continuar" != "S" ]; then
        exit 1
    fi
fi

echo "🌐 Iniciando Cloudflare Tunnel na porta 3000..."
echo ""

# Usar npx para executar cloudflared (não precisa instalar)
npx -y cloudflared tunnel --url http://localhost:3000 > cloudflare-tunnel.log 2>&1 &
CLOUDFLARE_PID=$!

echo "⏳ Aguardando Cloudflare Tunnel iniciar (5 segundos)..."
sleep 5

# Verificar se iniciou
if ! ps -p $CLOUDFLARE_PID > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar Cloudflare Tunnel"
    echo "   Verifique cloudflare-tunnel.log"
    tail -20 cloudflare-tunnel.log 2>/dev/null
    exit 1
fi

echo "✅ Cloudflare Tunnel iniciado (PID: $CLOUDFLARE_PID)"
echo ""

# Aguardar mais um pouco para gerar a URL
sleep 3

# Tentar extrair URL do log (múltiplos padrões)
TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' cloudflare-tunnel.log 2>/dev/null | head -1)

# Se não encontrou, tentar outro padrão
if [ -z "$TUNNEL_URL" ]; then
    TUNNEL_URL=$(grep -oE 'https://[^ ]+\.trycloudflare\.com' cloudflare-tunnel.log 2>/dev/null | head -1)
fi

if [ -z "$TUNNEL_URL" ]; then
    echo "⚠️ Não foi possível obter URL automaticamente"
    echo "   Verificando log..."
    tail -30 cloudflare-tunnel.log
    echo ""
    echo "💡 A URL deve aparecer no log acima"
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
echo "📊 Para ver os logs em tempo real:"
echo "   tail -f cloudflare-tunnel.log"
echo ""
echo "🛑 Para parar o túnel:"
echo "   pkill -f 'cloudflared tunnel'"

