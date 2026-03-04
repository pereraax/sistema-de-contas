#!/bin/bash
# Túnel localhost para Z-API. Mostra a URL para colar em "Ao receber" / "Ao enviar".
# Uso: npm run tunnel:zapi   ou   ./tunnel-zapi.sh
# Deixe rodando; a URL aparece abaixo. Ctrl+C para parar.

PORT="${1:-3000}"

if command -v cloudflared &>/dev/null; then
  CLOUDFLARED="cloudflared"
elif [ -x "/tmp/cloudflared" ]; then
  CLOUDFLARED="/tmp/cloudflared"
else
  echo "❌ cloudflared não encontrado. Instale: brew install cloudflared"
  echo "   Ou: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi

echo ""
echo "📡 Túnel localhost:$PORT → Z-API (Cloudflare)"
echo "   Abaixo aparecerá a URL. Cole em Z-API → Webhook → Ao receber:"
echo "   https://XXXX.trycloudflare.com/api/whatsapp/zapi/webhook"
echo ""
echo "   Deixe este terminal aberto. Ctrl+C para parar o túnel."
echo ""

exec $CLOUDFLARED tunnel --url "http://localhost:$PORT"
