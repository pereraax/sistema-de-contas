#!/usr/bin/env bash
# Deploy para o Railway a partir da pasta do projeto.
# Use depois de ter rodado uma vez: railway login && railway link

set -e
cd "$(dirname "$0")"

if ! command -v railway &>/dev/null; then
  echo "Railway CLI não encontrado. Rode: npm install -g @railway/cli"
  exit 1
fi

if ! railway status &>/dev/null; then
  echo "Projeto não está linkado. Rode no terminal: railway login && railway link"
  exit 1
fi

echo "Enviando código e iniciando deploy no Railway..."
railway up
