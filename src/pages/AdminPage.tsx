import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  apiAdminAddLiveScore,
  apiAdminCreateArchive,
  apiAdminCreateEvent,
  apiAdminDeleteArchive,
  apiAdminDeleteEvent,
  apiAdminDrawLiveTeams,
  apiAdminListUsers,
  apiAdminUpdateUserRole,
  apiGetArchives,
  apiGetEventLiveStats,
  apiGetEvents,
  type AdminUserItem,
  type EventLiveStatsItem,
} from '../api/client'
import { UserControls } from '../components/UserControls'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import type { ArchiveItem, EventItem, Level, TrackId, UserRole } from '../types'
import {
  formatDateTime,
  getCurrentEvent,
  getNearestEvent,
  sortEventsByDate,
} from '../utils/date'

const trackOptions: TrackId[] = ['cybersecurity', 'networks', 'devops', 'sysadmin']
const levelOptions: Level[] = ['Junior', 'Middle', 'Senior']

const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText = 'КАЛЕНДАРЬ >>'
const archiveLinkText = 'АРХИВ >>'
const liveControlLinkText = 'LIVE CONTROL >>'

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
  registrationLink: string
}) => {
  if (!form.title.trim()) return 'Укажите название соревнования.'
  if (!form.duration.trim()) return 'Укажите длительность соревнования.'
  if (!form.location.trim()) return 'Укажите место проведения.'
  if (form.description.trim().length < 5) return 'Описание должно быть не короче 5 символов.'
  if (!form.dateLocal.trim()) return 'Укажите дату и время проведения.'

  const normalizedLink = form.registrationLink.trim()
  if (normalizedLink) {
    try {
      const url = new URL(normalizedLink)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'Ссылка регистрации должна начинаться с http:// или https://.'
      }
    } catch {
      return 'Некорректная ссылка регистрации.'
    }
  }

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

const validateLiveScoreForm = (form: {
  reason: string
  points: string
}) => {
  const parsedPoints = Number(form.points)
  if (!Number.isInteger(parsedPoints) || parsedPoints === 0) {
    return 'Укажите целое число очков (не 0).'
  }
  if (parsedPoints < -100 || parsedPoints > 100) {
    return 'Диапазон очков: от -100 до 100.'
  }
  if (form.reason.trim().length < 2) {
    return 'Причина действия должна быть не короче 2 символов.'
  }
  return null
}

export const AdminPage = () => {
  const { user, token, isGuest } = useAuth()
  const canManage = Boolean(token && user?.role === 'ADMIN')
  const isViewMode = !canManage

  const [events, setEvents] = useState<EventItem[]>([])
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [liveEventId, setLiveEventId] = useState('')
  const [liveStats, setLiveStats] = useState<EventLiveStatsItem | null>(null)
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
    registrationLink: '',
  })

  const [archiveForm, setArchiveForm] = useState({
    eventId: '',
    summary: '',
    materialsRaw: '',
    publishedAtLocal: getDefaultLocalDateTime(),
  })

  const [liveScoreForm, setLiveScoreForm] = useState({
    team: 'BLUE' as 'BLUE' | 'RED',
    points: '5',
    reason: '',
  })

  const sortedEvents = useMemo(() => sortEventsByDate(events), [events])
  const nearestEvent = useMemo(() => getNearestEvent(sortedEvents), [sortedEvents])
  const normalizedRegistrationLink = eventForm.registrationLink.trim()
  const eventFormQrUrl = normalizedRegistrationLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(normalizedRegistrationLink)}`
    : ''

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [eventsResponse, archivesResponse] = await Promise.all([
        apiGetEvents(),
        apiGetArchives(),
      ])

      setEvents(sortEventsByDate(eventsResponse.items))
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

      if (eventsResponse.items.length) {
        const sorted = sortEventsByDate(eventsResponse.items)
        const currentEvent = getCurrentEvent(sorted)
        setLiveEventId((previous) => previous || currentEvent?.id || sorted[0].id)
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка загрузки'
      if (isViewMode) {
        setEvents([])
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

  useEffect(() => {
    if (!events.length) {
      setLiveEventId('')
      return
    }

    if (liveEventId && events.some((item) => item.id === liveEventId)) {
      return
    }

    const sorted = sortEventsByDate(events)
    const currentEvent = getCurrentEvent(sorted)
    setLiveEventId(currentEvent?.id ?? sorted[0].id)
  }, [events, liveEventId])

  useEffect(() => {
    if (!liveEventId) {
      setLiveStats(null)
      return
    }

    let cancelled = false
    const loadLiveStats = async () => {
      try {
        const response = await apiGetEventLiveStats(liveEventId)
        if (!cancelled) {
          setLiveStats(response.item)
        }
      } catch {
        if (!cancelled) {
          setLiveStats(null)
        }
      }
    }

    void loadLiveStats()
    const timer = setInterval(() => {
      void loadLiveStats()
    }, 15_000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [liveEventId])

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
        registrationLink: normalizedRegistrationLink || null,
      })
      setNotice('Соревнование добавлено.')
      setEventForm((previous) => ({
        ...previous,
        title: '',
        duration: '',
        location: '',
        description: '',
        registrationLink: '',
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

  const onDrawLiveTeams = async () => {
    if (!canManage || !token) return

    setError(null)
    setNotice(null)

    if (!liveEventId) {
      setError('Выберите событие для судейства.')
      return
    }

    try {
      const response = await apiAdminDrawLiveTeams(token, liveEventId)
      setLiveStats(response.item)
      setNotice('Жеребьевка выполнена. Команды сформированы.')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка жеребьевки'
      setError(message)
    }
  }

  const onAddLiveScore = async () => {
    if (!canManage || !token) return

    setError(null)
    setNotice(null)

    if (!liveEventId) {
      setError('Выберите событие для судейства.')
      return
    }

    const validationError = validateLiveScoreForm({
      points: liveScoreForm.points,
      reason: liveScoreForm.reason,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    const parsedPoints = Number(liveScoreForm.points)

    try {
      const response = await apiAdminAddLiveScore(token, liveEventId, {
        team: liveScoreForm.team,
        points: parsedPoints,
        reason: liveScoreForm.reason.trim(),
      })
      setLiveStats(response.item)
      setNotice('Судейский балл зафиксирован.')
      setLiveScoreForm((previous) => ({
        ...previous,
        reason: '',
      }))
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка начисления'
      setError(message)
    }
  }

  return (
    <div className="bm-admin-page">
      <div className="bm-admin-wrapper">
        <header className="bm-admin-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel="Открыть профиль"
            profileTitle="Открыть профиль"
          />

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
            <Link to="/admin/live" className="bm-track-header-link mono">
              {liveControlLinkText}
            </Link>
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

                  <input
                    className="bm-admin-input"
                    placeholder="Ссылка регистрации (https://...)"
                    value={eventForm.registrationLink}
                    onChange={(event) =>
                      setEventForm((previous) => ({
                        ...previous,
                        registrationLink: event.target.value,
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

                {eventFormQrUrl ? (
                  <div className="bm-admin-qr-preview">
                    <img
                      src={eventFormQrUrl}
                      alt="QR код ссылки регистрации"
                      className="bm-admin-qr-image"
                    />
                    <p className="bm-admin-qr-caption mono">QR ДЛЯ ГОСТЕЙ ГОТОВ</p>
                  </div>
                ) : null}

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

              <article className="bm-admin-panel">
                <h3 className="bm-admin-panel-title mono">LIVE СУДЕЙСТВО</h3>

                <div className="bm-admin-form-grid bm-admin-form-grid-two">
                  <select
                    className="bm-admin-input"
                    value={liveEventId}
                    onChange={(event) =>
                      setLiveEventId(event.target.value)
                    }
                  >
                    <option value="">Выберите событие</option>
                    {sortedEvents.map((eventItem) => (
                      <option key={eventItem.id} value={eventItem.id}>
                        {eventItem.title} ({formatDateTime(eventItem.date)})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="bm-admin-btn mono"
                    onClick={() => {
                      void onDrawLiveTeams()
                    }}
                  >
                    ПРОВЕСТИ ЖЕРЕБЬЁВКУ
                  </button>
                </div>

                {liveStats ? (
                  <div className="bm-admin-point-rules">
                    <p className="bm-admin-row-meta mono">
                      УЧАСТНИКОВ: {liveStats.participantsCount}
                    </p>
                    <p className="bm-admin-row-meta mono">
                      СТАТУС: {liveStats.hasDraw ? 'ЖЕРЕБЬЕВКА ВЫПОЛНЕНА' : 'ОЖИДАЕТ ЖЕРЕБЬЕВКИ'}
                    </p>
                    {liveStats.teams.map((team) => (
                      <p key={team.id} className="bm-admin-row-meta mono">
                        {team.name}: {team.score} PTS / {team.participantsCount} УЧ.
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="bm-admin-row-meta mono">Нет live-данных по событию.</p>
                )}

                <div className="bm-admin-form-grid bm-admin-form-grid-two">
                  <select
                    className="bm-admin-input"
                    value={liveScoreForm.team}
                    onChange={(event) =>
                      setLiveScoreForm((previous) => ({
                        ...previous,
                        team: event.target.value as 'BLUE' | 'RED',
                      }))
                    }
                  >
                    <option value="BLUE">BLUE TEAM</option>
                    <option value="RED">RED TEAM</option>
                  </select>

                  <input
                    className="bm-admin-input"
                    type="number"
                    min={-100}
                    max={100}
                    step={1}
                    placeholder="Баллы действия (+/-)"
                    value={liveScoreForm.points}
                    onChange={(event) =>
                      setLiveScoreForm((previous) => ({
                        ...previous,
                        points: event.target.value,
                      }))
                    }
                  />
                </div>

                <textarea
                  className="bm-admin-input bm-admin-textarea bm-admin-textarea-sm"
                  placeholder="Причина судейского действия"
                  value={liveScoreForm.reason}
                  onChange={(event) =>
                    setLiveScoreForm((previous) => ({
                      ...previous,
                      reason: event.target.value,
                    }))
                  }
                />

                {liveStats?.recentActions.length ? (
                  <div className="bm-admin-point-rules">
                    {liveStats.recentActions.slice(0, 6).map((action) => (
                      <p key={action.id} className="bm-admin-row-meta mono">
                        {action.team.toUpperCase()} {action.points > 0 ? '+' : ''}
                        {action.points} / {action.reason}
                      </p>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="bm-admin-btn mono"
                  onClick={() => {
                    void onAddLiveScore()
                  }}
                >
                  ЗАФИКСИРОВАТЬ ДЕЙСТВИЕ
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
                    {eventItem.registrationLink ? (
                      <p className="bm-admin-row-meta mono">LINK: {eventItem.registrationLink}</p>
                    ) : null}
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
                      <p className="bm-admin-row-meta mono">total: {item.totalPoints} pts</p>
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
