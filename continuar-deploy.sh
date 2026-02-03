#!/bin/bash
# Redeploy / continuar deploy no Railway.
# O deploy é disparado por: git push origin main (se o projeto Railway estiver conectado ao GitHub).

set -e
cd "$(dirname "$0")"

echo "🚂 Railway - Redeploy"
echo ""
echo "Para disparar um novo deploy:"
echo "  git add . && git commit -m \"sua mensagem\" && git push origin main"
echo ""
echo "Ou no dashboard: https://railway.app → seu projeto → Deployments → Redeploy"
echo ""
