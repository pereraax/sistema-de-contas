#!/usr/bin/env bash
# Atualiza o domínio: commit + push para main → Railway faz o deploy.
# Antes de rodar: SALVE todos os arquivos no editor (Cmd+S ou File → Save All).

set -e
cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "atualização: $(date '+%Y-%m-%d %H:%M')"
  git push origin main
  echo ""
  echo "✅ Push concluído. O Railway fará o deploy em alguns minutos; o domínio será atualizado."
else
  echo "⚠️  Nenhuma alteração no disco. Salve os arquivos no editor (Cmd+S ou File → Save All) e peça de novo: 'atualize no domínio'."
  exit 1
fi
