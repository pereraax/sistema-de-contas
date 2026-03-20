#!/usr/bin/env bash
# Sempre que você roda `npm run dev`: mata processo na porta (evita EADDRINUSE) e sobe o Next limpo.
set -e
cd "$(dirname "$0")/.."
PORT="${PORT:-3000}"

echo "🔄 Verificando porta $PORT..."
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "   Encerrando processo antigo na porta $PORT..."
  lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
  sleep 0.4
fi

if [ "${NEXT_DEV_CLEAR_CACHE:-}" = "1" ]; then
  echo "🗑️  Limpando .next (NEXT_DEV_CLEAR_CACHE=1)..."
  rm -rf .next
fi

echo "▶️  Next.js → http://localhost:$PORT"
exec next dev -p "$PORT"
