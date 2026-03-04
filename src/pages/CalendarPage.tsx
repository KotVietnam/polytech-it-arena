import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { testCalendarEvents } from '../data/testEvents'
import { trackNames } from '../data/tracks'
import { useEvents } from '../hooks/useEvents'
import type { Level, TrackId } from '../types'
import { sortEventsByDate } from '../utils/date'

type TimelineStatus = 'completed' | 'executing' | 'pending' | 'locked'

interface TimelineItem {
  id: string
  timeLabel: string
  title: string
  description: string
  status: TimelineStatus
  track: TrackId
  level: Level
}

const primaryTitle = 'КАЛЕНДАРЬ СОБЫТИЙ'
const titleLine2Rotation = [
  'СМОТРИ ПОДРОБНОСТИ',
  'СОЗДАЙ СТРАТЕГИЮ',
  'УСПЕЙ ЗАПИСАТЬСЯ',
] as const
const homeLinkText = 'НА ГЛАВНУЮ >>'
const profileSoonLabel = 'Открыть профиль пользователя'
const registerCtaText = 'ЗАПИСАТЬСЯ'
const registerDoneText = 'ЗАПИСАНО'

const registerModalTitle = 'ЗАПИСЬ НА СОРЕВНОВАНИЕ'
const registerModalHint =
  'Отсканируй QR-код или перейди по ссылке, чтобы открыть форму записи.'
const openLinkText = 'ПЕРЕЙТИ ПО ССЫЛКЕ'
const confirmRegisterText = 'ПОДТВЕРДИТЬ ЗАПИСЬ'
const closeModalText = 'ЗАКРЫТЬ'

const TYPE_SPEED_MS = 46
const DELETE_SPEED_MS = 28
const HOLD_SPEED_MS = 2000
const SWITCH_DELAY_MS = 220

const dateTimeShortFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const statusLabelMap: Record<TimelineStatus, string> = {
  completed: '[ ЗАВЕРШЕНО ]',
  executing: '>> БЛИЖАЙШЕЕ',
  pending: '[ ОЖИДАЕТ ]',
  locked: '[ ЗАПЛАНИРОВАНО ]',
}

const toTimeLabel = (isoDate: string) =>
  dateTimeShortFormatter.format(new Date(isoDate)).replace(',', '')

const getRegistrationLink = (eventId: string) => {
  if (typeof window === 'undefined') {
    return `/calendar?register=${encodeURIComponent(eventId)}`
  }

  return `${window.location.origin}/calendar?register=${encodeURIComponent(eventId)}`
}

export const CalendarPage = () => {
  const { user, registerTrack } = useAuth()
  const { events } = useEvents()
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing')
  const [charCount, setCharCount] = useState(0)
  const [referenceTime] = useState(() => Date.now())
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(() => new Set())
  const [registerModalItem, setRegisterModalItem] = useState<TimelineItem | null>(null)

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const mergedEventsById = new Map<string, (typeof events)[number]>()
    for (const item of [...events, ...testCalendarEvents]) {
      mergedEventsById.set(item.id, item)
    }

    const sorted = sortEventsByDate(Array.from(mergedEventsById.values()))
    const nearestUpcomingIndex = sorted.findIndex(
      (eventItem) => new Date(eventItem.date).getTime() >= referenceTime,
    )

    const executingIndex = nearestUpcomingIndex >= 0 ? nearestUpcomingIndex : 0

    return sorted.map((eventItem, index) => {
      let status: TimelineStatus = 'locked'
      if (index < executingIndex) {
        status = 'completed'
      } else if (index === executingIndex) {
        status = 'executing'
      } else if (index === executingIndex + 1) {
        status = 'pending'
      }

      return {
        id: eventItem.id,
        timeLabel: toTimeLabel(eventItem.date),
        title: eventItem.title,
        description: `${trackNames[eventItem.track]} / ${eventItem.level} / ${eventItem.location}`,
        status,
        track: eventItem.track,
        level: eventItem.level,
      }
    })
  }, [events, referenceTime])

  const activeSubtitle = titleLine2Rotation[subtitleIndex]

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
        setSubtitleIndex((value) => (value + 1) % titleLine2Rotation.length)
        setPhase('typing')
      }, SWITCH_DELAY_MS)
    }

    return () => clearTimeout(timer)
  }, [activeSubtitle.length, charCount, phase])

  const handleRegisterClick = (item: TimelineItem) => {
    if (registeredEventIds.has(item.id) || item.status === 'completed') {
      return
    }

    setRegisterModalItem(item)
  }

  const handleConfirmRegister = () => {
    if (!registerModalItem) {
      return
    }

    registerTrack(registerModalItem.track, registerModalItem.level)
    setRegisteredEventIds((previous) => {
      const next = new Set(previous)
      next.add(registerModalItem.id)
      return next
    })
    setRegisterModalItem(null)
  }

  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || '?'
  const registrationUrl = registerModalItem ? getRegistrationLink(registerModalItem.id) : ''
  const qrCodeUrl = registrationUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(registrationUrl)}`
    : ''

  return (
    <div className="bm-tl-page">
      <div className="bm-tl-container">
        <header className="bm-tl-header">
          <ThemeToggle />

          <div className="bm-tl-title-group">
            <h1 className="bm-h1 bm-tl-primary-title">{primaryTitle}</h1>
            <h1 className="bm-h1 bm-h1-outline">{activeSubtitle.slice(0, charCount)}</h1>
          </div>

          <Link to="/home" className="bm-header-schedule mono">
            {homeLinkText}
          </Link>

          <Link
            to="/profile"
            className="bm-user-chip bm-user-chip-button mono"
            aria-label={profileSoonLabel}
            title={profileSoonLabel}
          >
            <div className="bm-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="bm-user-text">USER: {user?.username ?? 'UNKNOWN'}</div>
          </Link>
        </header>

        <section className="bm-tl-timeline" aria-label="Календарь соревнований">
          {timelineItems.map((item) => {
            const isCurrent = item.status === 'executing'
            const canRegister = item.status !== 'completed'
            const isRegistered = registeredEventIds.has(item.id)
            const rowClassName = ['bm-tl-time-row', isCurrent ? 'current' : '']
              .filter(Boolean)
              .join(' ')

            return (
              <article key={item.id} className={rowClassName}>
                <div className="bm-tl-time-cell mono">{item.timeLabel}</div>

                <div className="bm-tl-event-cell">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>

                <div className="bm-tl-status-cell mono">
                  <div className="bm-tl-status-stack">
                    <span>{statusLabelMap[item.status]}</span>
                    {canRegister ? (
                      <button
                        type="button"
                        className="bm-tl-register-btn mono"
                        onClick={() => handleRegisterClick(item)}
                        disabled={isRegistered}
                        aria-label={`${registerCtaText}: ${item.title}`}
                      >
                        {isRegistered ? registerDoneText : registerCtaText}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        {registerModalItem ? (
          <div
            className="bm-tl-modal-backdrop"
            role="presentation"
            onClick={() => setRegisterModalItem(null)}
          >
            <div
              className="bm-tl-modal"
              role="dialog"
              aria-modal="true"
              aria-label={registerModalTitle}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="bm-tl-modal-head">
                <p className="bm-tl-modal-title mono">{registerModalTitle}</p>
                <button
                  type="button"
                  className="bm-tl-modal-close mono"
                  onClick={() => setRegisterModalItem(null)}
                >
                  {closeModalText}
                </button>
              </div>

              <p className="bm-tl-modal-event">{registerModalItem.title}</p>
              <p className="bm-tl-modal-hint">{registerModalHint}</p>

              <div className="bm-tl-modal-content">
                <img
                  src={qrCodeUrl}
                  alt={`QR для записи на событие ${registerModalItem.title}`}
                  className="bm-tl-modal-qr"
                />

                <div className="bm-tl-modal-actions">
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bm-tl-modal-link mono"
                  >
                    {openLinkText}
                  </a>

                  <button
                    type="button"
                    className="bm-tl-modal-confirm mono"
                    onClick={handleConfirmRegister}
                  >
                    {confirmRegisterText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}