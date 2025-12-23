#!/bin/bash

# Script para configurar ngrok com URL fixa
# Uso: ./configurar-ngrok.sh

echo "🚀 Configurando ngrok para URL fixa..."
echo ""

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não está instalado!"
    echo ""
    echo "📥 Para instalar ngrok:"
    echo "   1. Acesse: https://ngrok.com/download"
    echo "   2. Baixe para macOS"
    echo "   3. Extraia e mova para /usr/local/bin/ngrok"
    echo "   4. Ou instale via: brew install ngrok"
    echo ""
    echo "   Ou execute:"
    echo "   curl -o ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip"
    echo "   unzip ngrok.zip"
    echo "   sudo mv ngrok /usr/local/bin/"
    echo ""
    exit 1
fi

echo "✅ ngrok encontrado!"
echo ""

# Verificar se authtoken está configurado
if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "⚠️ Authtoken do ngrok não configurado!"
    echo ""
    echo "📝 Para obter authtoken:"
    echo "   1. Acesse: https://dashboard.ngrok.com/signup"
    echo "   2. Crie uma conta gratuita"
    echo "   3. Vá em: Your Authtoken"
    echo "   4. Copie o token"
    echo ""
    echo "   Depois execute:"
    echo "   ngrok config add-authtoken SEU_TOKEN_AQUI"
    echo ""
    read -p "Você já tem o authtoken? (s/n): " tem_token
    
    if [ "$tem_token" = "s" ] || [ "$tem_token" = "S" ]; then
        read -p "Cole o authtoken aqui: " authtoken
        ngrok config add-authtoken "$authtoken"
        echo "✅ Authtoken configurado!"
    else
        echo "⚠️ Configure o authtoken primeiro e execute este script novamente"
        exit 1
    fi
fi

echo ""
echo "🌐 Iniciando ngrok na porta 3000..."
echo ""

# Para URL fixa, precisamos usar um domínio reservado (plano pago)
# Mas podemos usar um script que mantém a mesma URL enquanto rodando
# Para isso, vamos usar ngrok com authtoken e manter o processo rodando

# Verificar se já está rodando
NGROK_PID=$(pgrep -f "ngrok http 3000")
if [ ! -z "$NGROK_PID" ]; then
    echo "⚠️ ngrok já está rodando (PID: $NGROK_PID)"
    read -p "Deseja parar e reiniciar? (s/n): " reiniciar
    if [ "$reiniciar" = "s" ] || [ "$reiniciar" = "S" ]; then
        kill $NGROK_PID
        sleep 2
    else
        echo "✅ Mantendo ngrok rodando"
        exit 0
    fi
fi

# Iniciar ngrok
echo "🚀 Iniciando ngrok..."
ngrok http 3000 > ngrok.log 2>&1 &
NGROK_PID=$!

sleep 3

# Verificar se iniciou
if ! ps -p $NGROK_PID > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar ngrok. Verifique ngrok.log"
    exit 1
fi

echo "✅ ngrok iniciado (PID: $NGROK_PID)"
echo ""

# Aguardar um pouco para ngrok gerar a URL
sleep 2

# Tentar obter URL da API do ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "⚠️ Não foi possível obter URL automaticamente"
    echo "   Acesse: http://localhost:4040 para ver a URL"
    echo "   Ou verifique ngrok.log"
else
    echo "✅ URL do ngrok:"
    echo "   $NGROK_URL"
    echo ""
    echo "🔗 URL do Webhook:"
    echo "   $NGROK_URL/api/whatsapp/apifacil/webhook"
    echo ""
    echo "📋 Copie a URL acima e configure no apifacil.dev"
fi

echo ""
echo "💡 Dica: Para manter a URL fixa, mantenha este processo rodando"
echo "   Se parar o ngrok, a URL mudará na próxima vez"
echo ""
echo "📊 Para ver a interface do ngrok: http://localhost:4040"











