import type { ArchiveItem, AuthUser, EventItem, Level, TrackId, UserRole } from '../types'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api')

interface RequestOptions extends RequestInit {
  token?: string | null
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const payload = (await response.json()) as {
        error?: string
        details?: Array<{ path: string; message: string }>
      }
      if (payload.error) {
        errorMessage = payload.error
      }
      if (payload.details?.length) {
        const detailsText = payload.details
          .map((item) => `${item.path || 'field'}: ${item.message}`)
          .join('; ')
        errorMessage = `${errorMessage}: ${detailsText}`
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export const apiLogin = async (username: string, password: string) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const apiGetMe = async (token: string) =>
  request<{ user: AuthUser }>('/auth/me', { token })

export const apiGetEvents = async (params?: {
  track?: TrackId
  level?: Level
}) => {
  const search = new URLSearchParams()
  if (params?.track) {
    search.set('track', params.track)
  }
  if (params?.level) {
    search.set('level', params.level)
  }
  const suffix = search.size ? `?${search.toString()}` : ''
  return request<{ items: EventItem[] }>(`/events${suffix}`)
}

export const apiGetArchives = async () => request<{ items: ArchiveItem[] }>('/archives')

export interface EventFormPayload {
  track: TrackId
  level: Level
  title: string
  duration: string
  location: string
  description: string
  date: string
  registrationLink?: string | null
}

export interface ArchiveFormPayload {
  eventId: string
  summary: string
  materials: string[]
  publishedAt: string
}

export const apiAdminCreateEvent = async (token: string, payload: EventFormPayload) =>
  request<{ item: EventItem }>('/admin/events', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

export const apiAdminUpdateEvent = async (
  token: string,
  eventId: string,
  payload: Partial<EventFormPayload>,
) =>
  request<{ item: EventItem }>(`/admin/events/${eventId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })

export const apiAdminDeleteEvent = async (token: string, eventId: string) =>
  request<void>(`/admin/events/${eventId}`, {
    method: 'DELETE',
    token,
  })

export const apiAdminCreateArchive = async (
  token: string,
  payload: ArchiveFormPayload,
) =>
  request<{ item: ArchiveItem }>('/admin/archives', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })

export const apiAdminDeleteArchive = async (token: string, archiveId: string) =>
  request<void>(`/admin/archives/${archiveId}`, {
    method: 'DELETE',
    token,
  })

export interface AdminUserItem {
  id: string
  username: string
  displayName: string | null
  email: string | null
  role: UserRole
  lastLoginAt: string | null
}

export const apiAdminListUsers = async (token: string) =>
  request<{ items: AdminUserItem[] }>('/admin/users', { token })

export const apiAdminUpdateUserRole = async (
  token: string,
  userId: string,
  role: UserRole,
) =>
  request<{ user: AdminUserItem }>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ role }),
  })
