#!/bin/bash
# Redeploy no Railway: limpa cache e instrui a forçar redeploy (push ou dashboard).
# Uso: ./redeploy-agora.sh

set -e
cd "$(dirname "$0")"

echo "🔄 REDEPLOY - Railway"
echo ""

echo "🧹 Limpando cache (.next)..."
rm -rf .next
echo "   Cache limpo."
echo ""

if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "💡 Para forçar um novo deploy no Railway:"
  echo "   1. Push (dispara deploy automático se o projeto estiver conectado ao GitHub):"
  echo "      git add . && git commit -m \"chore: redeploy\" && git push origin main"
  echo "      ou: git commit --allow-empty -m \"chore: redeploy\" && git push origin main"
  echo ""
  echo "   2. Ou no Railway: https://railway.app → seu projeto → Deployments → ⋮ → Redeploy"
  echo ""
else
  echo "💡 No Railway: https://railway.app → seu projeto → Deployments → Redeploy"
  echo ""
fi

echo "📋 Se o domínio não atualizou após o deploy:"
echo "   1. Aguarde 2–5 minutos (cache)."
echo "   2. Hard refresh: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)."
echo "   3. No Railway: último deploy → Redeploy."
echo ""
echo "✅ Concluído."
