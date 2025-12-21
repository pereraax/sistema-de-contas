#!/bin/bash

# Script para parar todos os processos do sistema
# Uso: ./parar-tudo.sh

echo "🛑 Parando todos os processos do sistema..."
echo ""

# Parar processos na porta 3000
echo "🔍 Verificando porta 3000..."
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000" ]; then
    echo "🛑 Parando processo na porta 3000 (PID: $PORT_3000)..."
    kill -9 $PORT_3000 2>/dev/null
    sleep 2
    echo "✅ Porta 3000 liberada"
else
    echo "✅ Porta 3000 já está livre"
fi

# Parar processos PM2
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🛑 Parando processos PM2..."
    pm2 stop all 2>/dev/null
    pm2 delete all 2>/dev/null
    echo "✅ Processos PM2 parados"
fi

# Parar processos localtunnel
echo ""
echo "🛑 Parando processos localtunnel..."
pkill -f "localtunnel" 2>/dev/null
pkill -f "lt --port" 2>/dev/null
sleep 1
echo "✅ Processos localtunnel parados"

# Parar processos Next.js
echo ""
echo "🛑 Parando processos Next.js..."
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1
echo "✅ Processos Next.js parados"

echo ""
echo "✅ Todos os processos foram parados!"
echo ""
echo "💡 Agora você pode iniciar novamente com:"
echo "   • ./configurar-pm2.sh (recomendado - sempre rodando)"
echo "   • ./iniciar-tudo.sh (temporário)"










