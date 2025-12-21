#!/bin/bash

echo "🔄 Monitorando logs do WhatsApp em tempo real..."
echo "📋 Pressione Ctrl+C para parar"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Monitorar arquivo de log se existir
if [ -f "/private/tmp/whatsapp-server.log" ]; then
  tail -f /private/tmp/whatsapp-server.log | while IFS= read -r line; do
    timestamp=$(date '+%H:%M:%S')
    # Filtrar e destacar linhas importantes
    if echo "$line" | grep -qiE "whatsapp|webjs|qr|conectado|ready|authenticated|mensagem|plen|erro|✅|❌|📨|📤"; then
      echo "[$timestamp] $line"
    fi
  done
else
  echo "⚠️ Arquivo de log não encontrado: /private/tmp/whatsapp-server.log"
  echo ""
  echo "📝 Tentando encontrar logs do Next.js..."
  echo ""
  
  # Tentar ver processos Node.js
  ps aux | grep -E "next|node.*3000" | grep -v grep
  
  echo ""
  echo "💡 Dica: Os logs podem aparecer diretamente no terminal onde você iniciou 'npm run dev'"
fi











