#!/bin/bash
echo "🛑 PARANDO TODOS OS PROCESSOS CHROMIUM..."
killall -9 Chromium 2>/dev/null
killall -9 chromium 2>/dev/null
pkill -9 -f "puppeteer" 2>/dev/null
pkill -9 -f "chrome-mac" 2>/dev/null
ps aux | grep -i "chromium\|puppeteer" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
sleep 2
COUNT=$(ps aux | grep -i "chromium\|puppeteer" | grep -v grep | wc -l | tr -d ' ')
echo "📊 Processos restantes: $COUNT"











