import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { events } from '../data/events'
import { trackNames } from '../data/tracks'
import type { TrackId } from '../types'
import { formatDateTime, getNearestEvent, sortEventsByDate } from '../utils/date'

const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText = 'КАЛЕНДАРЬ >>'
const headerTitle = 'ТВОЙ ПРОФИЛЬ'
const subtitleRotation = ['УЧИСЬ', 'РАЗВИВАЙСЯ', 'УЧАСТВУЙ'] as const

const TYPE_SPEED_MS = 46
const DELETE_SPEED_MS = 28
const HOLD_SPEED_MS = 2000
const SWITCH_DELAY_MS = 220

const trackOrder: TrackId[] = ['cybersecurity', 'networks', 'devops', 'sysadmin']

export const ProfilePage = () => {
  const { user } = useAuth()
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing')
  const [charCount, setCharCount] = useState(0)

  if (!user) {
    return null
  }

  const activeSubtitle = subtitleRotation[subtitleIndex]

  const avatarLetter = user.username.trim().charAt(0).toUpperCase() || '?'
  const lastRegistration = user.registrations[0] ?? null
  const nearestEvent = getNearestEvent(sortEventsByDate(events))

  const averagePoints = user.registrations.length
    ? Math.round(user.totalPoints / user.registrations.length)
    : 0

  const trackStats = trackOrder.map((trackId) => {
    const entries = user.registrations.filter((item) => item.trackId === trackId)
    return {
      trackId,
      name: trackNames[trackId],
      count: entries.length,
      latestEntry: entries[0] ?? null,
    }
  })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (charCount < activeSubtitle.length) {
        timer = setTimeout(() => setCharCount((value) => value + 1), TYPE_SPEED_MS)
      } else {
        timer = setTimeout(() => setPhase('hold'), HOLD_SPEED_MS)
      }
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('deleting'), 0)
    } else if (charCount > 0) {
      timer = setTimeout(() => setCharCount((value) => value - 1), DELETE_SPEED_MS)
    } else {
      timer = setTimeout(() => {
        setSubtitleIndex((value) => (value + 1) % subtitleRotation.length)
        setPhase('typing')
      }, SWITCH_DELAY_MS)
    }

    return () => clearTimeout(timer)
  }, [activeSubtitle.length, charCount, phase])

  return (
    <div className="bm-profile-page">
      <div className="bm-profile-wrapper">
        <header className="bm-profile-header">
          <div className="bm-title-stack bm-profile-title-stack">
            <h1 className="bm-h1 bm-h1-no-wrap">{headerTitle}</h1>
            <h1 className="bm-h1 bm-h1-outline">{activeSubtitle.slice(0, charCount)}</h1>
            <p className="bm-profile-subtitle">
              Личная статистика по регистрации в компетенциях, набору очков и
              последней активности в рамках клуба.
            </p>
          </div>

          <div className="bm-profile-header-links">
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
          </div>

          <div className="bm-user-chip mono" aria-label="Current user">
            <div className="bm-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="bm-user-text">USER: {user.username}</div>
          </div>
        </header>

        <section className="bm-profile-stats-grid">
          <article className="bm-profile-stat-card">
            <p className="bm-profile-stat-label mono">ОБЩИЕ БАЛЛЫ</p>
            <p className="bm-profile-stat-value">{user.totalPoints}</p>
          </article>

          <article className="bm-profile-stat-card">
            <p className="bm-profile-stat-label mono">РЕГИСТРАЦИИ</p>
            <p className="bm-profile-stat-value">{user.registrations.length}</p>
          </article>

          <article className="bm-profile-stat-card">
            <p className="bm-profile-stat-label mono">ПОСЛЕДНИЙ ТРЕК</p>
            <p className="bm-profile-stat-value bm-profile-stat-value-sm">
              {lastRegistration
                ? trackNames[lastRegistration.trackId].toUpperCase()
                : 'НЕТ ДАННЫХ'}
            </p>
          </article>

          <article className="bm-profile-stat-card">
            <p className="bm-profile-stat-label mono">СРЕДНИЙ БАЛЛ</p>
            <p className="bm-profile-stat-value">{averagePoints}</p>
          </article>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">СВОДКА ПО КОМПЕТЕНЦИЯМ</h2>
          <div className="bm-profile-track-grid">
            {trackStats.map((trackStat) => (
              <article key={trackStat.trackId} className="bm-profile-track-card">
                <div className="bm-profile-track-head">
                  <h3 className="bm-profile-track-title mono">
                    {trackStat.name.toUpperCase()}
                  </h3>
                  <span className="bm-profile-track-count mono">{trackStat.count}</span>
                </div>
                <p className="bm-profile-track-meta">
                  {trackStat.latestEntry
                    ? `Последний: ${formatDateTime(trackStat.latestEntry.date)} / ${trackStat.latestEntry.level}`
                    : 'Пока нет регистраций'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section bm-track-section-last">
          <h2 className="bm-track-section-title mono">ПОСЛЕДНИЕ РЕГИСТРАЦИИ</h2>

          {user.registrations.length ? (
            <div className="bm-profile-log-list">
              {user.registrations.slice(0, 12).map((entry) => (
                <article key={entry.id} className="bm-profile-log-row">
                  <div>
                    <p className="bm-profile-log-title mono">
                      {trackNames[entry.trackId].toUpperCase()} / {entry.level.toUpperCase()}
                    </p>
                    <p className="bm-profile-log-meta">{formatDateTime(entry.date)}</p>
                  </div>
                  <p className="bm-profile-log-points mono">+{entry.points} PTS</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="bm-profile-empty">
              Пока нет регистраций. Перейди в нужную компетенцию и нажми кнопку
              регистрации на соревнование.
            </p>
          )}

          {nearestEvent ? (
            <p className="bm-profile-next-event mono">
              {`БЛИЖАЙШЕЕ СОБЫТИЕ: ${trackNames[nearestEvent.track].toUpperCase()} / ${formatDateTime(nearestEvent.date)}`}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
