#!/bin/bash

# Script para iniciar servidor + túnel automaticamente
# Uso: ./iniciar-tudo.sh

echo "🚀 Iniciando Sistema PLEN WhatsApp..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto (onde está package.json)"
    exit 1
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando processos..."
    kill $SERVER_PID $TUNNEL_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar servidor em background
echo "📦 Iniciando servidor Next.js..."
cd "$(dirname "$0")"
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Aguardar servidor iniciar
echo "⏳ Aguardando servidor iniciar (8 segundos)..."
sleep 8

# Verificar se servidor está rodando (verificar porta 3000)
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar servidor. Verifique server.log:"
    tail -10 server.log 2>/dev/null || echo "   (log não disponível)"
    exit 1
fi

echo "✅ Servidor iniciado (PID: $SERVER_PID)"
echo ""

# Iniciar túnel em background
echo "🌐 Iniciando túnel (localtunnel)..."
npm run tunnel > tunnel.log 2>&1 &
TUNNEL_PID=$!

# Aguardar túnel iniciar
echo "⏳ Aguardando túnel iniciar (3 segundos)..."
sleep 3

# Verificar se túnel está rodando (aguardar mais um pouco)
sleep 2
if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar túnel. Verifique tunnel.log:"
    tail -10 tunnel.log 2>/dev/null || echo "   (log não disponível)"
    # Não matar servidor, apenas avisar
    echo "⚠️ Servidor continua rodando. Inicie o túnel manualmente: npm run tunnel"
fi

# Extrair URL do túnel do log
TUNNEL_URL=$(grep -oP 'your url is: \K[^\s]+' tunnel.log 2>/dev/null | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "⚠️ Não foi possível extrair URL do túnel. Verifique tunnel.log"
else
    echo "✅ Túnel iniciado (PID: $TUNNEL_PID)"
    echo ""
    echo "🌐 URL do Túnel: $TUNNEL_URL"
    echo "🔗 URL do Webhook: $TUNNEL_URL/api/whatsapp/apifacil/webhook"
    echo ""
    echo "⚠️ IMPORTANTE: Configure esta URL no apifacil.dev:"
    echo "   $TUNNEL_URL/api/whatsapp/apifacil/webhook"
    echo ""
fi

echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "📋 Logs:"
echo "   • Servidor: tail -f server.log"
echo "   • Túnel: tail -f tunnel.log"
echo ""
echo "🛑 Para parar: Pressione Ctrl+C"
echo ""

# Manter script rodando
wait











