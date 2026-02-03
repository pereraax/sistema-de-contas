#!/bin/bash
# Deploy direto no Vercel (execute na pasta do projeto).
# Antes: npm i -g vercel && vercel login
echo "🚀 Fazendo deploy direto no Vercel..."
echo ""
cd "$(dirname "$0")"
rm -rf .next
vercel --prod --yes
