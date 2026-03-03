import { useEffect, useState } from 'react'
import { apiGetArchives } from '../api/client'
import type { ArchiveItem } from '../types'

export const useArchives = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiGetArchives()
        if (!cancelled) {
          setArchives(response.items)
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof Error ? requestError.message : 'Не удалось загрузить архив'
          setError(message)
          setArchives([])
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
  }, [])

  return { archives, loading, error }
}
