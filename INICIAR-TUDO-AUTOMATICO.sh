#!/bin/bash

# Script para iniciar TUDO automaticamente: servidor + tunnel
# Uso: ./INICIAR-TUDO-AUTOMATICO.sh

echo "🚀 Iniciando Sistema Completo (Servidor + Tunnel)..."
echo ""

# Verificar se já está rodando
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Servidor já está rodando na porta 3000"
    read -p "Deseja reiniciar? (s/n): " reiniciar
    if [ "$reiniciar" = "s" ] || [ "$reiniciar" = "S" ]; then
        echo "🛑 Parando servidor..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "✅ Mantendo servidor rodando"
    fi
fi

# Iniciar servidor se não estiver rodando
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo "📡 Iniciando servidor..."
    npm run dev > logs/server.log 2>&1 &
    SERVER_PID=$!
    echo "⏳ Aguardando servidor iniciar (5 segundos)..."
    sleep 5
    
    if ! lsof -ti:3000 > /dev/null 2>&1; then
        echo "❌ Erro ao iniciar servidor"
        exit 1
    fi
    
    echo "✅ Servidor iniciado (PID: $SERVER_PID)"
    echo ""
fi

# Iniciar tunnel
echo "🌐 Configurando tunnel..."
./configurar-tunnel-automatico.sh

echo ""
echo "✅ Sistema completo iniciado!"
echo ""






