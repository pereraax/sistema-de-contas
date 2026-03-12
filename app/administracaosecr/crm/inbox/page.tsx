'use client'

import { useState, useEffect } from 'react'
import { NotificationFeed } from '@/components/crm/NotificationFeed'
import type { ActivityItem } from '@/components/crm/NotificationFeed'

export default function CrmInboxPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [period, setPeriod] = useState('todos')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (period) params.set('period', period)
    if (search.trim()) params.set('search', search.trim())
    fetch(`/api/admin/crm/activity?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setActivities(data.activities ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period, search])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Inbox</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Central de notificações e atividades
        </p>
      </div>
      <NotificationFeed
        activities={activities}
        period={period}
        onPeriodChange={setPeriod}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
      />
    </div>
  )
}
