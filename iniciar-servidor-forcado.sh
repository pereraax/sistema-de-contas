#!/bin/bash

# Script para iniciar servidor mesmo se houver processos na porta 3000
# Tenta parar, mas se não conseguir, força o início

echo "🚀 Iniciando servidor (modo forçado)..."
echo ""

# Tentar parar processos na porta 3000
echo "1. Tentando parar processos na porta 3000..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
killall -9 node 2>/dev/null
sleep 2

# Verificar se há processos
PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "⚠️ Ainda há processos na porta 3000 (PIDs: $PIDS)"
    echo "   Mas vamos tentar iniciar mesmo assim..."
    echo ""
fi

# Verificar se o servidor já está rodando e funcionando
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Servidor já está rodando e respondendo na porta 3000!"
    echo "   Você pode ver os logs do processo existente"
    echo ""
    echo "   Para ver os logs, execute:"
    echo "   tail -f .next/trace 2>/dev/null || ps aux | grep 'next dev' | grep -v grep"
    echo ""
    read -p "Deseja parar e reiniciar? (s/n): " reiniciar
    if [ "$reiniciar" = "s" ] || [ "$reiniciar" = "S" ]; then
        echo "   Parando servidor existente..."
        lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
        sleep 3
    else
        echo "   Mantendo servidor existente rodando"
        exit 0
    fi
fi

echo "🚀 Iniciando servidor Next.js na porta 3000..."
echo ""

# Iniciar o servidor
npm run dev






