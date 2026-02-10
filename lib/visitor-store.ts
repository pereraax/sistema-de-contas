/**
 * Store em memória de visitas (persiste enquanto o processo estiver rodando).
 * Usado por /api/visitors/track e /api/visitors/stats.
 */

const VISITORS: { path: string; ts: number }[] = []
const MAX_ENTRIES = 50000
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000 // 2 min = online

function prune() {
  const now = Date.now()
  const cutoff = now - 30 * 24 * 60 * 60 * 1000 // 30 dias
  while (VISITORS.length > MAX_ENTRIES || (VISITORS.length > 0 && VISITORS[0].ts < cutoff)) {
    VISITORS.shift()
  }
}

export function addVisit(path: string) {
  VISITORS.push({ path, ts: Date.now() })
  prune()
}

export function getStats() {
  const now = Date.now()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const startOfWeek = now - 7 * 24 * 60 * 60 * 1000 // últimos 7 dias
  const onlineCutoff = now - ONLINE_THRESHOLD_MS

  let online = 0
  let hoje = 0
  let semana = 0
  let mes = 0
  for (let i = VISITORS.length - 1; i >= 0; i--) {
    const { ts } = VISITORS[i]
    if (ts >= onlineCutoff) online++
    if (ts >= startOfToday.getTime()) hoje++
    if (ts >= startOfWeek) semana++
    if (ts >= startOfMonth) mes++
  }

  return {
    total: VISITORS.length,
    online,
    hoje,
    semana,
    mes,
  }
}
