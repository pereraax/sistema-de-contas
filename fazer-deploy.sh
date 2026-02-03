#!/bin/bash
# Deploy no Railway: push para o GitHub dispara deploy automático (se o projeto estiver conectado).
# Uso: ./fazer-deploy.sh

set -e
cd "$(dirname "$0")"

echo "🚀 Deploy no Railway (via GitHub)"
echo ""

rm -rf .next
echo "🧹 Cache .next removido."
echo ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "❌ Não é um repositório Git. Configure Git e conecte ao GitHub, depois conecte o repo ao Railway."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "📤 Há alterações. Faça commit e push para disparar o deploy no Railway:"
  echo "   git add ."
  echo "   git commit -m \"sua mensagem\""
  echo "   git push origin main"
  exit 0
fi

echo "💡 Para forçar redeploy no Railway:"
echo "   git commit --allow-empty -m \"chore: redeploy\""
echo "   git push origin main"
echo ""
echo "   Ou no dashboard: https://railway.app → seu projeto → Deployments → Redeploy"
echo ""
