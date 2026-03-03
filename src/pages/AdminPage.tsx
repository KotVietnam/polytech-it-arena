import { useCallback, useEffect, useState } from 'react'
import {
  apiAdminCreateArchive,
  apiAdminCreateEvent,
  apiAdminDeleteArchive,
  apiAdminDeleteEvent,
  apiAdminListUsers,
  apiAdminUpdateUserRole,
  apiGetArchives,
  apiGetEvents,
  type AdminUserItem,
} from '../api/client'
import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'
import { trackNames } from '../data/tracks'
import { useAuth } from '../context/AuthContext'
import type { ArchiveItem, EventItem, Level, TrackId, UserRole } from '../types'
import { formatDateTime } from '../utils/date'

const trackOptions: TrackId[] = ['cybersecurity', 'networks', 'devops', 'sysadmin']
const levelOptions: Level[] = ['Junior', 'Middle', 'Senior']

const toIsoFromLocal = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

const getDefaultLocalDateTime = () => {
  const now = new Date()
  const tzOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

const validateEventForm = (form: {
  title: string
  duration: string
  location: string
  description: string
  dateLocal: string
}) => {
  if (!form.title.trim()) {
    return 'Укажи название соревнования.'
  }
  if (!form.duration.trim()) {
    return 'Укажи длительность соревнования.'
  }
  if (!form.location.trim()) {
    return 'Укажи место проведения.'
  }
  if (form.description.trim().length < 5) {
    return 'Описание должно быть не короче 5 символов.'
  }
  if (!form.dateLocal.trim()) {
    return 'Укажи дату и время проведения.'
  }
  return null
}

const validateArchiveForm = (form: {
  eventId: string
  summary: string
  publishedAtLocal: string
}) => {
  if (!form.eventId.trim()) {
    return 'Выбери соревнование для архива.'
  }
  if (form.summary.trim().length < 10) {
    return 'Итог архива должен быть не короче 10 символов.'
  }
  if (!form.publishedAtLocal.trim()) {
    return 'Укажи дату публикации архива.'
  }
  return null
}

export const AdminPage = () => {
  const { user, token } = useAuth()

  const [events, setEvents] = useState<EventItem[]>([])
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [eventForm, setEventForm] = useState({
    track: 'cybersecurity' as TrackId,
    level: 'Junior' as Level,
    title: '',
    duration: '',
    location: '',
    description: '',
    dateLocal: getDefaultLocalDateTime(),
  })

  const [archiveForm, setArchiveForm] = useState({
    eventId: '',
    summary: '',
    materialsRaw: '',
    publishedAtLocal: getDefaultLocalDateTime(),
  })

  const loadData = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [eventsResponse, archivesResponse, usersResponse] = await Promise.all([
        apiGetEvents(),
        apiGetArchives(),
        apiAdminListUsers(token),
      ])

      setEvents(eventsResponse.items)
      setArchives(archivesResponse.items)
      setUsers(usersResponse.items)

      if (!archiveForm.eventId && eventsResponse.items[0]) {
        setArchiveForm((previous) => ({
          ...previous,
          eventId: eventsResponse.items[0].id,
        }))
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка загрузки'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [archiveForm.eventId, token])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (!user) {
    return null
  }

  if (user.role !== 'ADMIN') {
    return (
      <Card className="max-w-2xl">
        <h2 className="mono text-lg text-red-300">Доступ ограничен</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Раздел доступен только пользователям с ролью ADMIN.
        </p>
      </Card>
    )
  }

  const onCreateEvent = async () => {
    if (!token) {
      return
    }

    setError(null)
    setNotice(null)

    const validationError = validateEventForm(eventForm)
    if (validationError) {
      setError(validationError)
      return
    }

    const isoDate = toIsoFromLocal(eventForm.dateLocal)
    if (!isoDate) {
      setError('Некорректная дата соревнования')
      return
    }

    try {
      await apiAdminCreateEvent(token, {
        track: eventForm.track,
        level: eventForm.level,
        title: eventForm.title.trim(),
        duration: eventForm.duration.trim(),
        location: eventForm.location.trim(),
        description: eventForm.description.trim(),
        date: isoDate,
      })
      setNotice('Соревнование добавлено')
      setEventForm((previous) => ({
        ...previous,
        title: '',
        duration: '',
        location: '',
        description: '',
        dateLocal: '',
      }))
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка создания'
      setError(message)
    }
  }

  const onCreateArchive = async () => {
    if (!token) {
      return
    }

    setError(null)
    setNotice(null)

    const validationError = validateArchiveForm(archiveForm)
    if (validationError) {
      setError(validationError)
      return
    }

    const publishedAt = toIsoFromLocal(archiveForm.publishedAtLocal)
    if (!publishedAt) {
      setError('Некорректная дата публикации архива')
      return
    }

    const materials = archiveForm.materialsRaw
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    try {
      await apiAdminCreateArchive(token, {
        eventId: archiveForm.eventId,
        summary: archiveForm.summary.trim(),
        materials,
        publishedAt,
      })
      setNotice('Архивная запись добавлена')
      setArchiveForm((previous) => ({
        ...previous,
        summary: '',
        materialsRaw: '',
        publishedAtLocal: '',
      }))
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка создания'
      setError(message)
    }
  }

  const onDeleteEvent = async (eventId: string) => {
    if (!token) {
      return
    }

    try {
      await apiAdminDeleteEvent(token, eventId)
      setNotice('Соревнование удалено')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка удаления'
      setError(message)
    }
  }

  const onDeleteArchive = async (archiveId: string) => {
    if (!token) {
      return
    }

    try {
      await apiAdminDeleteArchive(token, archiveId)
      setNotice('Архивная запись удалена')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка удаления'
      setError(message)
    }
  }

  const onChangeUserRole = async (userId: string, role: UserRole) => {
    if (!token) {
      return
    }

    try {
      await apiAdminUpdateUserRole(token, userId, role)
      setNotice('Роль обновлена')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка обновления роли'
      setError(message)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Admin"
        title="Панель управления"
        description="Управление соревнованиями, архивом и ролями пользователей."
      />

      {loading ? <Card>Загрузка данных...</Card> : null}
      {error ? <Card className="border border-red-700/80 bg-red-700/10">{error}</Card> : null}
      {notice ? <Card className="border border-zinc-700 bg-black/70 text-zinc-200">{notice}</Card> : null}

      <Card className="space-y-4">
        <h3 className="mono text-base text-red-300">Добавить соревнование</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="border border-zinc-700 bg-black px-3 py-2"
            value={eventForm.track}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                track: event.target.value as TrackId,
              }))
            }
          >
            {trackOptions.map((track) => (
              <option key={track} value={track}>
                {trackNames[track]}
              </option>
            ))}
          </select>

          <select
            className="border border-zinc-700 bg-black px-3 py-2"
            value={eventForm.level}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                level: event.target.value as Level,
              }))
            }
          >
            {levelOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <input
            className="border border-zinc-700 bg-black px-3 py-2"
            placeholder="Название"
            value={eventForm.title}
            onChange={(event) =>
              setEventForm((previous) => ({ ...previous, title: event.target.value }))
            }
          />

          <input
            className="border border-zinc-700 bg-black px-3 py-2"
            placeholder="Длительность (например 2 ч 30 мин)"
            value={eventForm.duration}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                duration: event.target.value,
              }))
            }
          />

          <input
            className="border border-zinc-700 bg-black px-3 py-2"
            placeholder="Локация"
            value={eventForm.location}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                location: event.target.value,
              }))
            }
          />

          <input
            className="border border-zinc-700 bg-black px-3 py-2"
            type="datetime-local"
            value={eventForm.dateLocal}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                dateLocal: event.target.value,
              }))
            }
          />
        </div>

        <textarea
          className="min-h-24 w-full border border-zinc-700 bg-black px-3 py-2"
          placeholder="Описание"
          value={eventForm.description}
          onChange={(event) =>
            setEventForm((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
        />

        <button
          type="button"
          className="border border-red-700 bg-red-700/20 px-4 py-2 text-red-200"
          onClick={() => {
            void onCreateEvent()
          }}
        >
          Создать соревнование
        </button>
      </Card>

      <Card className="space-y-4">
        <h3 className="mono text-base text-red-300">Добавить запись в архив</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="border border-zinc-700 bg-black px-3 py-2"
            value={archiveForm.eventId}
            onChange={(event) =>
              setArchiveForm((previous) => ({
                ...previous,
                eventId: event.target.value,
              }))
            }
          >
            <option value="">Выберите соревнование</option>
            {events.map((eventItem) => (
              <option key={eventItem.id} value={eventItem.id}>
                {eventItem.title} ({formatDateTime(eventItem.date)})
              </option>
            ))}
          </select>

          <input
            className="border border-zinc-700 bg-black px-3 py-2"
            type="datetime-local"
            value={archiveForm.publishedAtLocal}
            onChange={(event) =>
              setArchiveForm((previous) => ({
                ...previous,
                publishedAtLocal: event.target.value,
              }))
            }
          />
        </div>

        <textarea
          className="min-h-24 w-full border border-zinc-700 bg-black px-3 py-2"
          placeholder="Итог соревнования"
          value={archiveForm.summary}
          onChange={(event) =>
            setArchiveForm((previous) => ({
              ...previous,
              summary: event.target.value,
            }))
          }
        />

        <textarea
          className="min-h-20 w-full border border-zinc-700 bg-black px-3 py-2"
          placeholder="Материалы (каждый с новой строки)"
          value={archiveForm.materialsRaw}
          onChange={(event) =>
            setArchiveForm((previous) => ({
              ...previous,
              materialsRaw: event.target.value,
            }))
          }
        />

        <button
          type="button"
          className="border border-red-700 bg-red-700/20 px-4 py-2 text-red-200"
          onClick={() => {
            void onCreateArchive()
          }}
        >
          Создать запись архива
        </button>
      </Card>

      <Card className="space-y-4">
        <h3 className="mono text-base text-red-300">Соревнования</h3>
        <div className="space-y-2">
          {events.map((eventItem) => (
            <div
              key={eventItem.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-zinc-800 p-3"
            >
              <div>
                <p className="text-sm text-white">{eventItem.title}</p>
                <p className="mono text-xs text-zinc-400">
                  {trackNames[eventItem.track]} / {eventItem.level} / {formatDateTime(eventItem.date)}
                </p>
              </div>
              <button
                type="button"
                className="border border-red-900 bg-red-900/20 px-3 py-1 text-xs text-red-200"
                onClick={() => {
                  void onDeleteEvent(eventItem.id)
                }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="mono text-base text-red-300">Архивные записи</h3>
        <div className="space-y-2">
          {archives.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-zinc-800 p-3"
            >
              <div>
                <p className="text-sm text-white">{entry.event.title}</p>
                <p className="mono text-xs text-zinc-400">
                  Архив опубликован: {formatDateTime(entry.publishedAt)}
                </p>
              </div>
              <button
                type="button"
                className="border border-red-900 bg-red-900/20 px-3 py-1 text-xs text-red-200"
                onClick={() => {
                  void onDeleteArchive(entry.id)
                }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="mono text-base text-red-300">Пользователи и роли</h3>
        <div className="space-y-2">
          {users.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-zinc-800 p-3"
            >
              <div>
                <p className="text-sm text-white">{item.username}</p>
                <p className="mono text-xs text-zinc-400">
                  last login: {item.lastLoginAt ? formatDateTime(item.lastLoginAt) : 'never'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="border border-zinc-700 bg-black px-2 py-1 text-xs"
                  value={item.role}
                  onChange={(event) => {
                    void onChangeUserRole(item.id, event.target.value as UserRole)
                  }}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
