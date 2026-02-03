#!/bin/bash

# Script para parar tudo e iniciar o servidor limpo na porta 3000

echo "🛑 Parando todos os processos na porta 3000..."
echo ""

# Parar processos específicos na porta 3000 PRIMEIRO
echo "1. Parando processos na porta 3000..."
for i in {1..10}; do
    PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ -z "$PIDS" ]; then
        break
    fi
    echo "   Tentativa $i: Parando PIDs: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null
    sleep 1
done

# Parar todos os processos node
echo "2. Parando processos node..."
killall -9 node 2>/dev/null
pkill -9 -f "next" 2>/dev/null
pkill -9 -f "npm" 2>/dev/null
pkill -9 -f "localtunnel" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null

# Parar processos específicos na porta 3000 NOVAMENTE
echo "3. Verificando e parando processos restantes na porta 3000..."
for i in {1..5}; do
    PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ -z "$PIDS" ]; then
        break
    fi
    echo "   Tentativa $i: Parando PIDs: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null
    sleep 2
done

# Aguardar um pouco para garantir que tudo parou
echo "3. Aguardando processos pararem completamente..."
sleep 3

# Verificar se a porta está livre
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Ainda há processos na porta 3000!"
    echo "   Tentando parar novamente..."
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
    sleep 2
fi

# Verificar novamente - tentar mais uma vez de forma mais agressiva
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️ Ainda há processos. Tentando parada mais agressiva..."
    
    # Matar todos os processos node sem exceção
    killall -9 node 2>/dev/null
    
    # Aguardar mais tempo
    sleep 5
    
    # Tentar parar novamente
    PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PIDS" ]; then
        echo "$PIDS" | xargs kill -9 2>/dev/null
        sleep 3
    fi
    
    # Verificar uma última vez
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "❌ Não foi possível liberar a porta 3000 completamente"
        echo "   Processos ainda rodando:"
        lsof -i:3000 | head -10
        echo ""
        echo "💡 Tentando iniciar mesmo assim (pode dar erro)..."
        echo ""
    else
        echo "✅ Porta 3000 liberada após parada agressiva!"
    fi
fi

echo "✅ Porta 3000 está livre!"
echo ""
echo "🚀 Iniciando servidor na porta 3000..."
echo ""

# Iniciar o servidor
npm run dev

