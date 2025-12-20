#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 MONITORAMENTO DE LOGS DO WHATSAPP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Monitorando logs em tempo real..."
echo "💡 Envie uma mensagem no WhatsApp para ver os logs aparecerem"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

tail -f /private/tmp/whatsapp-server.log 2>/dev/null | while IFS= read -r line; do
  # Filtrar apenas linhas relevantes
  if echo "$line" | grep -qiE "whatsapp|webjs|plen|mensagem|oi|olá|erro|✅|❌|📨|📤|📞|👤|⚠️|chamando|enviando|processando|conectado|cliente"; then
    echo "[$(date '+%H:%M:%S')] $line"
  fi
done









