#!/bin/bash

# Script SIMPLES para configurar PM2 (sem precisar de sudo)
# Uso: ./configurar-pm2-simples.sh

echo "🚀 Configurando PM2 (versão simples - sem sudo)..."
echo ""

cd "$(dirname "$0")"

# Instalar PM2 localmente (sem precisar de sudo)
echo "📦 Instalando PM2 localmente no projeto..."
npm install pm2 --save-dev

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar PM2. Verifique se npm está funcionando."
    exit 1
fi

echo "✅ PM2 instalado localmente"
echo ""

# Parar processos existentes
echo "🛑 Parando processos existentes..."
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000" ]; then
    kill -9 $PORT_3000 2>/dev/null
    sleep 2
fi

pkill -f "localtunnel" 2>/dev/null
pkill -f "lt --port" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1

echo "✅ Processos anteriores parados"
echo ""

# Usar npx para executar PM2
PM2_CMD="npx pm2"

# Parar processos PM2 existentes
$PM2_CMD stop all 2>/dev/null
$PM2_CMD delete all 2>/dev/null

echo "📦 Iniciando servidor Next.js com PM2..."
$PM2_CMD start "npm run dev" --name "plen-server" --log-date-format "YYYY-MM-DD HH:mm:ss"

echo ""
echo "⏳ Aguardando servidor iniciar (8 segundos)..."
sleep 8

# Verificar se servidor está rodando
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ Erro ao iniciar servidor. Verifique: $PM2_CMD logs plen-server"
    exit 1
fi

echo "✅ Servidor iniciado"
echo ""
echo "🌐 Iniciando túnel com PM2..."
$PM2_CMD start "npm run tunnel" --name "plen-tunnel" --log-date-format "YYYY-MM-DD HH:mm:ss"

echo ""
echo "⏳ Aguardando túnel iniciar (5 segundos)..."
sleep 5

echo "✅ Túnel iniciado"
echo ""
echo "💾 Salvando configuração PM2..."
$PM2_CMD save

echo ""
echo "✅ Sistema configurado com PM2!"
echo ""
echo "📋 Comandos úteis (use 'npx pm2' ao invés de 'pm2'):"
echo "   • Ver status: npx pm2 status"
echo "   • Ver logs: npx pm2 logs"
echo "   • Ver logs do servidor: npx pm2 logs plen-server"
echo "   • Ver logs do túnel: npx pm2 logs plen-tunnel"
echo "   • Parar tudo: npx pm2 stop all"
echo "   • Reiniciar tudo: npx pm2 restart all"
echo "   • Verificar URL do túnel: npx pm2 logs plen-tunnel | grep 'your url is'"
echo ""
echo "🎯 Sistema agora está sempre rodando!"
echo ""
echo "⚠️ NOTA: Para auto-start no boot, você precisará instalar PM2 globalmente:"
echo "   sudo npm install -g pm2"
echo "   Depois execute: pm2 startup"








