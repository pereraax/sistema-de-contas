#!/bin/bash

# Script para configurar PM2 e manter sistema sempre rodando
# Uso: ./configurar-pm2.sh

echo "🚀 Configurando PM2 para manter sistema sempre rodando..."
echo ""

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2 localmente (sem precisar de sudo)..."
    
    # Tentar instalar localmente primeiro
    npm install pm2 --save-dev
    
    if [ $? -ne 0 ]; then
        echo "⚠️ Erro ao instalar PM2 localmente. Tentando globalmente com sudo..."
        echo "   (Você precisará digitar sua senha)"
        sudo npm install -g pm2
        if [ $? -ne 0 ]; then
            echo "❌ Erro ao instalar PM2."
            echo ""
            echo "💡 Alternativa: Instale PM2 manualmente:"
            echo "   npm install -g pm2"
            echo "   (ou use sudo npm install -g pm2)"
            exit 1
        fi
    else
        echo "✅ PM2 instalado localmente"
        # Adicionar ao PATH para este script
        export PATH="./node_modules/.bin:$PATH"
    fi
else
    echo "✅ PM2 já está instalado"
fi

echo ""
echo "🛑 Parando processos existentes (se houver)..."
echo "   (Isso pode levar alguns segundos)"

# Parar processos PM2
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null

# Parar processos na porta 3000
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000" ]; then
    echo "   Parando processo na porta 3000..."
    kill -9 $PORT_3000 2>/dev/null
    sleep 2
fi

# Parar processos localtunnel
pkill -f "localtunnel" 2>/dev/null
pkill -f "lt --port" 2>/dev/null
sleep 1

echo "✅ Processos anteriores parados"

echo ""
echo "📦 Iniciando servidor Next.js com PM2..."
cd "$(dirname "$0")"

# Usar npx pm2 se PM2 estiver instalado localmente
if [ -f "./node_modules/.bin/pm2" ]; then
    PM2_CMD="./node_modules/.bin/pm2"
else
    PM2_CMD="pm2"
fi

$PM2_CMD start "npm run dev" --name "plen-server" --log-date-format "YYYY-MM-DD HH:mm:ss"

echo ""
echo "⏳ Aguardando servidor iniciar (5 segundos)..."
sleep 5

# Verificar se servidor está rodando
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar servidor. Verifique: pm2 logs plen-server"
    exit 1
fi

echo "✅ Servidor iniciado"
echo ""
echo "🌐 Iniciando túnel com PM2..."
$PM2_CMD start "npm run tunnel" --name "plen-tunnel" --log-date-format "YYYY-MM-DD HH:mm:ss"

echo ""
echo "⏳ Aguardando túnel iniciar (5 segundos)..."
sleep 5

# Verificar se túnel está rodando
TUNNEL_PID=$($PM2_CMD jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | tail -1)
if [ -z "$TUNNEL_PID" ]; then
    echo "⚠️ Túnel pode não ter iniciado. Verifique: $PM2_CMD logs plen-tunnel"
else
    echo "✅ Túnel iniciado"
fi

echo ""
echo "💾 Salvando configuração PM2..."
$PM2_CMD save

echo ""
echo "⚙️ Configurando para iniciar automaticamente no boot..."
echo "   (Isso pode pedir sua senha)"
$PM2_CMD startup
echo ""
echo "⚠️ IMPORTANTE: Execute o comando que apareceu acima para configurar auto-start no boot"
echo "   (Geralmente algo como: sudo env PATH=... pm2 startup ...)"

echo ""
echo "✅ Sistema configurado com PM2!"
echo ""
echo "📋 Comandos úteis:"
if [ -f "./node_modules/.bin/pm2" ]; then
    echo "   (Use: npx pm2 ou ./node_modules/.bin/pm2)"
    PM2_EXAMPLE="npx pm2"
else
    PM2_EXAMPLE="pm2"
fi
echo "   • Ver status: $PM2_EXAMPLE status"
echo "   • Ver logs: $PM2_EXAMPLE logs"
echo "   • Ver logs do servidor: $PM2_EXAMPLE logs plen-server"
echo "   • Ver logs do túnel: $PM2_EXAMPLE logs plen-tunnel"
echo "   • Parar tudo: $PM2_EXAMPLE stop all"
echo "   • Reiniciar tudo: $PM2_EXAMPLE restart all"
echo "   • Verificar URL do túnel: $PM2_EXAMPLE logs plen-tunnel | grep 'your url is'"
echo ""
echo "🎯 Sistema agora está sempre rodando!"
echo "   Mesmo se reiniciar o computador, o PM2 iniciará automaticamente (após configurar startup)"








