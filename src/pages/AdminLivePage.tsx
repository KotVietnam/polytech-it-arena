import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  apiAdminAddLiveScore,
  apiAdminDrawLiveTeams,
  apiAdminUpdateLiveTimer,
  apiGetEventLiveStats,
  apiGetEvents,
  type EventLiveStatsItem,
} from '../api/client'
import { UserControls } from '../components/UserControls'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import { formatDateTime, getCurrentEvent, sortEventsByDate } from '../utils/date'
import type { EventItem } from '../types'

const homeLinkText = 'НА ГЛАВНУЮ >>'
const adminLinkText = 'ADMIN PANEL >>'
const calendarLinkText = 'КАЛЕНДАРЬ >>'

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

const timerStatusTextMap: Record<EventLiveStatsItem['timer']['status'], string> = {
  idle: 'НЕ ЗАПУЩЕН',
  running: 'ИДЁТ',
  paused: 'ПАУЗА',
  break: 'ПЕРЕРЫВ',
}

const formatTimer = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

const resolveLiveElapsedSeconds = (snapshot: EventLiveStatsItem | null, nowMs: number) => {
  if (!snapshot) {
    return 0
  }

  const base = snapshot.timer.elapsedSeconds
  if (snapshot.timer.status !== 'running' || !snapshot.timer.startedAt) {
    return base
  }

  const startedAtMs = new Date(snapshot.timer.startedAt).getTime()
  if (!Number.isFinite(startedAtMs)) {
    return base
  }

  const delta = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
  return base + delta
}

export const AdminLivePage = () => {
  const { user, token, isGuest } = useAuth()
  const canManage = Boolean(token && user?.role === 'ADMIN')

  const [events, setEvents] = useState<EventItem[]>([])
  const [liveEventId, setLiveEventId] = useState('')
  const [liveStats, setLiveStats] = useState<EventLiveStatsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [timerActionBusy, setTimerActionBusy] = useState<null | 'START' | 'PAUSE' | 'BREAK' | 'RESUME' | 'RESET'>(null)
  const [timerNow, setTimerNow] = useState(() => Date.now())
  const [liveScoreForm, setLiveScoreForm] = useState({
    team: 'BLUE' as 'BLUE' | 'RED',
    points: '5',
    reason: '',
  })

  const sortedEvents = useMemo(() => sortEventsByDate(events), [events])
  const currentEvent = useMemo(() => getCurrentEvent(sortedEvents), [sortedEvents])
  const liveTimerStatus = liveStats?.timer.status ?? 'idle'
  const liveElapsedSeconds = resolveLiveElapsedSeconds(liveStats, timerNow)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiGetEvents()
      const sorted = sortEventsByDate(response.items)
      setEvents(sorted)

      if (!sorted.length) {
        setLiveEventId('')
        return
      }

      setLiveEventId((previous) => previous || getCurrentEvent(sorted)?.id || sorted[0].id)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка загрузки'
      setError(message)
      setEvents([])
      setLiveEventId('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (!events.length) {
      setLiveEventId('')
      return
    }

    if (liveEventId && events.some((item) => item.id === liveEventId)) {
      return
    }

    setLiveEventId(getCurrentEvent(events)?.id ?? events[0].id)
  }, [events, liveEventId])

  useEffect(() => {
    if (!liveEventId) {
      setLiveStats(null)
      return
    }

    let cancelled = false
    const loadStats = async () => {
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

    void loadStats()
    const timer = setInterval(() => {
      void loadStats()
    }, 15_000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [liveEventId])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerNow(Date.now())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

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

    try {
      const response = await apiAdminAddLiveScore(token, liveEventId, {
        team: liveScoreForm.team,
        points: Number(liveScoreForm.points),
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

  const onTimerAction = async (action: 'START' | 'PAUSE' | 'BREAK' | 'RESUME' | 'RESET') => {
    if (!canManage || !token) return

    setError(null)
    setNotice(null)

    if (!liveEventId) {
      setError('Выберите событие для судейства.')
      return
    }

    setTimerActionBusy(action)
    try {
      const response = await apiAdminUpdateLiveTimer(token, liveEventId, { action })
      setLiveStats(response.item)
      setNotice(`Таймер: ${timerStatusTextMap[response.item.timer.status]}.`)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Ошибка управления таймером'
      setError(message)
    } finally {
      setTimerActionBusy(null)
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
            <h1 className="bm-h1 bm-h1-no-wrap">LIVE CONTROL</h1>
            <h1 className="bm-h1 bm-h1-outline">ПРОВЕДЕНИЕ СОРЕВНОВАНИЯ</h1>
            <p className="bm-admin-subtitle">
              Судейская панель для жеребьевки, распределения команд и фиксации баллов в реальном времени.
            </p>
          </div>

          <div className="bm-admin-header-links">
            <Link to="/admin" className="bm-track-header-link mono">
              {adminLinkText}
            </Link>
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
          </div>
        </header>

        <section className="bm-admin-content">
          <div className="bm-admin-stats-grid">
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">СОРЕВНОВАНИЙ</p>
              <p className="bm-admin-stat-value">{events.length}</p>
            </article>
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">АКТИВНОЕ</p>
              <p className="bm-admin-stat-value bm-admin-stat-value-sm">
                {currentEvent ? currentEvent.title : 'НЕТ'}
              </p>
            </article>
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">УЧАСТНИКОВ</p>
              <p className="bm-admin-stat-value">{liveStats?.participantsCount ?? 0}</p>
            </article>
            <article className="bm-admin-stat-card">
              <p className="mono bm-admin-stat-label">СТАТУС</p>
              <p className="bm-admin-stat-value bm-admin-stat-value-sm">
                {timerStatusTextMap[liveTimerStatus]}
              </p>
            </article>
          </div>

          {loading ? <article className="bm-admin-state-panel">Загрузка данных...</article> : null}
          {error ? (
            <article className="bm-admin-state-panel bm-admin-state-panel-error">{error}</article>
          ) : null}
          {notice ? <article className="bm-admin-state-panel">{notice}</article> : null}

          {!canManage ? (
            <article className="bm-admin-state-panel">
              Для доступа к проведению соревнования требуется роль ADMIN.
            </article>
          ) : (
            <article className="bm-admin-panel">
              <h3 className="bm-admin-panel-title mono">СУДЕЙСКИЙ КОНТУР</h3>

              <div className="bm-admin-form-grid bm-admin-form-grid-two">
                <select
                  className="bm-admin-input"
                  value={liveEventId}
                  onChange={(event) => setLiveEventId(event.target.value)}
                >
                  <option value="">Выберите событие</option>
                  {sortedEvents.map((eventItem) => (
                    <option key={eventItem.id} value={eventItem.id}>
                      {eventItem.title} ({trackNames[eventItem.track]} / {formatDateTime(eventItem.date)})
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
                    ТАЙМЕР: {formatTimer(liveElapsedSeconds)} / {timerStatusTextMap[liveTimerStatus]}
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
                <button
                  type="button"
                  className="bm-admin-btn mono"
                  disabled={timerActionBusy !== null}
                  onClick={() => {
                    void onTimerAction(liveTimerStatus === 'idle' ? 'START' : 'RESUME')
                  }}
                >
                  {liveTimerStatus === 'idle' ? 'СТАРТ ТАЙМЕРА' : 'ПРОДОЛЖИТЬ'}
                </button>
                <button
                  type="button"
                  className="bm-admin-btn mono"
                  disabled={timerActionBusy !== null}
                  onClick={() => {
                    void onTimerAction('PAUSE')
                  }}
                >
                  ПАУЗА
                </button>
                <button
                  type="button"
                  className="bm-admin-btn mono"
                  disabled={timerActionBusy !== null}
                  onClick={() => {
                    void onTimerAction('BREAK')
                  }}
                >
                  ПЕРЕРЫВ
                </button>
                <button
                  type="button"
                  className="bm-admin-btn bm-admin-btn-danger mono"
                  disabled={timerActionBusy !== null}
                  onClick={() => {
                    void onTimerAction('RESET')
                  }}
                >
                  СБРОС
                </button>
              </div>

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
                  {liveStats.recentActions.slice(0, 10).map((action) => (
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
          )}
        </section>
      </div>
    </div>
  )
}
