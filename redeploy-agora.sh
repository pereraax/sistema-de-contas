#!/bin/bash
# Redeploy: limpa cache, faz push (se houver mudanças) ou instrui a forçar redeploy no Vercel.
# Uso: ./redeploy-agora.sh

set -e
cd "$(dirname "$0")"

echo "🔄 REDEPLOY - Atualizar o domínio após deploy concluído"
echo ""

# 1. Limpar cache de build
echo "🧹 Limpando cache (.next)..."
rm -rf .next
echo "   Cache limpo."
echo ""

# 2. Se o projeto usa Git + Vercel conectado ao GitHub, um push dispara novo deploy
if git rev-parse --git-dir >/dev/null 2>&1; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "📤 Há alterações não commitadas. Faça commit e push para disparar o deploy:"
    echo "   git add ."
    echo "   git commit -m \"chore: redeploy para atualizar domínio\""
    echo "   git push origin main"
    echo ""
    echo "   Ou force um redeploy sem mudar código:"
    echo "   git commit --allow-empty -m \"chore: redeploy\" && git push origin main"
    exit 0
  fi
  echo "💡 Para forçar um novo deploy no Vercel (sem mudar código):"
  echo "   git commit --allow-empty -m \"chore: redeploy\""
  echo "   git push origin main"
  echo ""
fi

echo "📋 Se o deploy já concluiu mas o domínio não atualizou:"
echo "   1. Aguarde 2–5 minutos (cache/CDN)."
echo "   2. Limpe o cache do navegador: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)."
echo "   3. No Vercel: Dashboard → seu projeto → Deployments → ⋮ no último deploy → Redeploy."
echo ""
echo "✅ Script concluído."
