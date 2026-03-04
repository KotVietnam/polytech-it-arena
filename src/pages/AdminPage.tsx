import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { events as fallbackEvents } from '../data/events'
import { trackNames } from '../data/tracks'
import type { ArchiveItem, EventItem, Level, TrackId, UserRole } from '../types'
import { formatDateTime, getNearestEvent, sortEventsByDate } from '../utils/date'

const trackOptions: TrackId[] = ['cybersecurity', 'networks', 'devops', 'sysadmin']
const levelOptions: Level[] = ['Junior', 'Middle', 'Senior']

const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText = 'КАЛЕНДАРЬ >>'
const archiveLinkText = 'АРХИВ >>'

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
  if (!form.title.trim()) return 'Укажите название соревнования.'
  if (!form.duration.trim()) return 'Укажите длительность соревнования.'
  if (!form.location.trim()) return 'Укажите место проведения.'
  if (form.description.trim().length < 5) return 'Описание должно быть не короче 5 символов.'
  if (!form.dateLocal.trim()) return 'Укажите дату и время проведения.'
  return null
}

const validateArchiveForm = (form: {
  eventId: string
  summary: string
  publishedAtLocal: string
}) => {
  if (!form.eventId.trim()) return 'Выберите соревнование для архива.'
  if (form.summary.trim().length < 10) return 'Итог архива должен быть не короче 10 символов.'
  if (!form.publishedAtLocal.trim()) return 'Укажите дату публикации архива.'
  return null
}

export const AdminPage = () => {
  const { user, token } = useAuth()
  const canManage = Boolean(token && user?.role === 'ADMIN')
  const isViewMode = !canManage

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

  const sortedEvents = useMemo(() => sortEventsByDate(events), [events])
  const nearestEvent = useMemo(() => getNearestEvent(sortedEvents), [sortedEvents])
  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || 'G'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [eventsResponse, archivesResponse] = await Promise.all([
        apiGetEvents(),
        apiGetArchives(),
      ])

      setEvents(
        eventsResponse.items.length
          ? sortEventsByDate(eventsResponse.items)
          : sortEventsByDate(fallbackEvents),
      )
      setArchives(archivesResponse.items)

      if (canManage && token) {
        const usersResponse = await apiAdminListUsers(token)
        setUsers(usersResponse.items)
      } else {
        setUsers([])
      }

      if (!archiveForm.eventId && eventsResponse.items[0]) {
        setArchiveForm((previous) => ({
          ...previous,
          eventId: eventsResponse.items[0].id,
        }))
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка загрузки'
      if (isViewMode) {
        setEvents(sortEventsByDate(fallbackEvents))
        setArchives([])
        setUsers([])
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [archiveForm.eventId, canManage, isViewMode, token])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const onCreateEvent = async () => {
    if (!canManage || !token) return

    setError(null)
    setNotice(null)

    const validationError = validateEventForm(eventForm)
    if (validationError) {
      setError(validationError)
      return
    }

    const isoDate = toIsoFromLocal(eventForm.dateLocal)
    if (!isoDate) {
      setError('Некорректная дата соревнования.')
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
      setNotice('Соревнование добавлено.')
      setEventForm((previous) => ({
        ...previous,
        title: '',
        duration: '',
        location: '',
        description: '',
      }))
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка создания'
      setError(message)
    }
  }

  const onCreateArchive = async () => {
    if (!canManage || !token) return

    setError(null)
    setNotice(null)

    const validationError = validateArchiveForm(archiveForm)
    if (validationError) {
      setError(validationError)
      return
    }

    const publishedAt = toIsoFromLocal(archiveForm.publishedAtLocal)
    if (!publishedAt) {
      setError('Некорректная дата публикации архива.')
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
      setNotice('Архивная запись добавлена.')
      setArchiveForm((previous) => ({
        ...previous,
        summary: '',
        materialsRaw: '',
      }))
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка создания'
      setError(message)
    }
  }

  const onDeleteEvent = async (eventId: string) => {
    if (!canManage || !token) return
    try {
      await apiAdminDeleteEvent(token, eventId)
      setNotice('Соревнование удалено.')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка удаления'
      setError(message)
    }
  }

  const onDeleteArchive = async (archiveId: string) => {
    if (!canManage || !token) return
    try {
      await apiAdminDeleteArchive(token, archiveId)
      setNotice('Архивная запись удалена.')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка удаления'
      setError(message)
    }
  }

  const onChangeUserRole = async (userId: string, role: UserRole) => {
    if (!canManage || !token) return
    try {
      await apiAdminUpdateUserRole(token, userId, role)
      setNotice('Роль обновлена.')
      await loadData()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка обновления роли'
      setError(message)
    }
  }

  return (
    <div className="bm-admin-page">
      <div className="bm-admin-wrapper">
        <header className="bm-admin-header">
          <ThemeToggle />

          <div className="bm-title-stack bm-admin-title-stack">
            <h1 className="bm-h1 bm-h1-no-wrap">ADMIN PANEL</h1>
            <h1 className="bm-h1 bm-h1-outline">
              {isViewMode ? 'MONITOR MODE' : 'MANAGEMENT MODE'}
            </h1>
            <p className="bm-admin-subtitle">
              {isViewMode
                ? 'Режим наблюдения без авторизации: просмотр соревнований, архива и активности.'
                : 'Полный режим управления: события, архивные записи и роли пользователей.'}
            </p>
          </div>

          <div className="bm-admin-header-links">
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
            <Link to="/archive" className="bm-track-header-link mono">
              {archiveLinkText}
            </Link>
          </div>

          <Link
            to="/profile"
            className="bm-user-chip bm-user-chip-button mono"
            aria-label="Открыть профиль"
            title="Открыть профиль"
          >
            <div className="bm-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="bm-user-text">USER: {user?.username ?? 'GUEST'}</div>
          </Link>
        </header>

        <section className="bm-admin-content">
          <div className="bm-admin-stats-grid">
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">РЕЖИМ</p>
              <p className="bm-admin-stat-value">{isViewMode ? 'ПРОСМОТР' : 'УПРАВЛЕНИЕ'}</p>
            </article>
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">СОБЫТИЯ</p>
              <p className="bm-admin-stat-value">{events.length}</p>
            </article>
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">АРХИВ</p>
              <p className="bm-admin-stat-value">{archives.length}</p>
            </article>
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">БЛИЖАЙШЕЕ</p>
              <p className="bm-admin-stat-value bm-admin-stat-value-sm">
                {nearestEvent
                  ? `${trackNames[nearestEvent.track]} / ${formatDateTime(nearestEvent.date)}`
                  : 'НЕТ ДАННЫХ'}
              </p>
            </article>
          </div>

          {loading ? <article className="bm-admin-state-panel">Загрузка данных...</article> : null}
          {error ? <article className="bm-admin-state-panel bm-admin-state-panel-error">{error}</article> : null}
          {notice ? <article className="bm-admin-state-panel">{notice}</article> : null}

          {!canManage ? (
            <article className="bm-admin-state-panel">
              Редактирование выключено. Для создания/удаления событий и архива нужен вход
              под ролью ADMIN.
            </article>
          ) : (
            <div className="bm-admin-forms-grid">
              <article className="bm-admin-panel">
                <h3 className="bm-admin-panel-title mono">ДОБАВИТЬ СОРЕВНОВАНИЕ</h3>

                <div className="bm-admin-form-grid">
                  <select
                    className="bm-admin-input"
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
                    className="bm-admin-input"
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
                    className="bm-admin-input"
                    placeholder="Название"
                    value={eventForm.title}
                    onChange={(event) =>
                      setEventForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                  />

                  <input
                    className="bm-admin-input"
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
                    className="bm-admin-input"
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
                    className="bm-admin-input"
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
                  className="bm-admin-input bm-admin-textarea"
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
                  className="bm-admin-btn mono"
                  onClick={() => {
                    void onCreateEvent()
                  }}
                >
                  СОЗДАТЬ
                </button>
              </article>

              <article className="bm-admin-panel">
                <h3 className="bm-admin-panel-title mono">ДОБАВИТЬ АРХИВ</h3>

                <div className="bm-admin-form-grid bm-admin-form-grid-two">
                  <select
                    className="bm-admin-input"
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
                    className="bm-admin-input"
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
                  className="bm-admin-input bm-admin-textarea"
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
                  className="bm-admin-input bm-admin-textarea bm-admin-textarea-sm"
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
                  className="bm-admin-btn mono"
                  onClick={() => {
                    void onCreateArchive()
                  }}
                >
                  СОЗДАТЬ
                </button>
              </article>
            </div>
          )}

          <article className="bm-admin-panel">
            <h3 className="bm-admin-panel-title mono">СОРЕВНОВАНИЯ</h3>
            <div className="bm-admin-list">
              {sortedEvents.map((eventItem) => (
                <div key={eventItem.id} className="bm-admin-row">
                  <div>
                    <p className="bm-admin-row-title">{eventItem.title}</p>
                    <p className="bm-admin-row-meta mono">
                      {trackNames[eventItem.track]} / {eventItem.level} / {formatDateTime(eventItem.date)}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      className="bm-admin-btn bm-admin-btn-danger mono"
                      onClick={() => {
                        void onDeleteEvent(eventItem.id)
                      }}
                    >
                      УДАЛИТЬ
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </article>

          <article className="bm-admin-panel">
            <h3 className="bm-admin-panel-title mono">АРХИВНЫЕ ЗАПИСИ</h3>
            <div className="bm-admin-list">
              {archives.length ? (
                archives.map((entry) => (
                  <div key={entry.id} className="bm-admin-row">
                    <div>
                      <p className="bm-admin-row-title">{entry.event.title}</p>
                      <p className="bm-admin-row-meta mono">
                        Архив опубликован: {formatDateTime(entry.publishedAt)}
                      </p>
                    </div>
                    {canManage ? (
                      <button
                        type="button"
                        className="bm-admin-btn bm-admin-btn-danger mono"
                        onClick={() => {
                          void onDeleteArchive(entry.id)
                        }}
                      >
                        УДАЛИТЬ
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="bm-admin-row-meta">Пока архивных записей нет.</p>
              )}
            </div>
          </article>

          {canManage ? (
            <article className="bm-admin-panel">
              <h3 className="bm-admin-panel-title mono">ПОЛЬЗОВАТЕЛИ И РОЛИ</h3>
              <div className="bm-admin-list">
                {users.map((item) => (
                  <div key={item.id} className="bm-admin-row">
                    <div>
                      <p className="bm-admin-row-title">{item.username}</p>
                      <p className="bm-admin-row-meta mono">
                        last login: {item.lastLoginAt ? formatDateTime(item.lastLoginAt) : 'never'}
                      </p>
                    </div>

                    <select
                      className="bm-admin-input bm-admin-select-role"
                      value={item.role}
                      onChange={(event) => {
                        void onChangeUserRole(item.id, event.target.value as UserRole)
                      }}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </div>
  )
}

