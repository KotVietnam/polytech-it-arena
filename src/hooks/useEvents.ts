import { useEffect, useState } from 'react'
import { apiGetEvents } from '../api/client'
import type { EventItem, Level, TrackId } from '../types'

interface UseEventsFilters {
  track?: TrackId
  level?: Level
}

export const useEvents = (filters?: UseEventsFilters) => {
  const track = filters?.track
  const level = filters?.level
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiGetEvents({ track, level })
        if (!cancelled) {
          setEvents(response.items)
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof Error ? requestError.message : 'Не удалось загрузить соревнования'
          setError(message)
          setEvents([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [level, track])

  return { events, loading, error }
}
