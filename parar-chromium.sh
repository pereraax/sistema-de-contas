#!/bin/bash

echo "🛑 Parando todos os processos Chromium/Puppeteer..."

# Matar todos os processos Chromium
pkill -9 Chromium 2>/dev/null
pkill -9 chromium 2>/dev/null
pkill -9 -f "puppeteer" 2>/dev/null
pkill -9 -f "chrome-mac" 2>/dev/null
pkill -9 -f "chromium.*about:blank" 2>/dev/null

# Aguardar um pouco
sleep 2

# Verificar se ainda há processos
COUNT=$(ps aux | grep -i "chromium\|puppeteer" | grep -v grep | wc -l | tr -d ' ')

if [ "$COUNT" -eq "0" ]; then
  echo "✅ Todos os processos Chromium foram finalizados!"
else
  echo "⚠️ Ainda há $COUNT processos. Tentando novamente..."
  # Tentar novamente de forma mais agressiva
  ps aux | grep -i "chromium\|puppeteer" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
  sleep 1
  FINAL_COUNT=$(ps aux | grep -i "chromium\|puppeteer" | grep -v grep | wc -l | tr -d ' ')
  echo "📊 Processos restantes: $FINAL_COUNT"
fi

echo "✅ Pronto!"











