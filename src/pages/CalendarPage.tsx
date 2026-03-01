import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { events } from '../data/events'
import { trackNames } from '../data/tracks'
import { sortEventsByDate } from '../utils/date'

type TimelineStatus = 'completed' | 'executing' | 'pending' | 'locked'

interface TimelineItem {
  id: string
  timeLabel: string
  title: string
  description: string
  status: TimelineStatus
}

const primaryTitle =
  'КАЛЕНДАРЬ СОБЫТИЙ'
const titleLine2Rotation = [
  'СМОТРИ ПОДРОБНОСТИ',
  'СОЗДАЙ СТРАТЕГИЮ',
  'УСПЕЙ ЗАПИСАТЬСЯ',
] as const
const homeLinkText = 'НА ГЛАВНУЮ >>'
const profileSoonLabel =
  'Открыть профиль пользователя (скоро)'

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
  completed: '[ COMPLETED ]',
  executing: '>> EXECUTING...',
  pending: '[ PENDING ]',
  locked: '[ LOCKED ]',
}

const toTimeLabel = (isoDate: string) =>
  dateTimeShortFormatter.format(new Date(isoDate)).replace(',', '')

export const CalendarPage = () => {
  const { user } = useAuth()
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing')
  const [charCount, setCharCount] = useState(0)

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const sorted = sortEventsByDate(events)
    const nowTime = Date.now()
    const nearestUpcomingIndex = sorted.findIndex(
      (eventItem) => new Date(eventItem.date).getTime() >= nowTime,
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
      }
    })
  }, [])

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

  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="bm-tl-page">
      <div className="bm-tl-container">
        <header className="bm-tl-header">
          <div className="bm-tl-title-group">
            <h1 className="bm-h1 bm-tl-primary-title">{primaryTitle}</h1>
            <h1 className="bm-h1 bm-h1-outline">
              {activeSubtitle.slice(0, charCount)}
            </h1>
          </div>

          <Link to="/home" className="bm-header-schedule mono">
            {homeLinkText}
          </Link>

          <button
            type="button"
            className="bm-user-chip bm-user-chip-button mono"
            aria-label={profileSoonLabel}
            title={profileSoonLabel}
          >
            <div className="bm-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="bm-user-text">USER: {user?.username ?? 'UNKNOWN'}</div>
          </button>
        </header>

        <section className="bm-tl-timeline" aria-label="Timeline">
          {timelineItems.map((item) => {
            const isCurrent = item.status === 'executing'
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
                  {statusLabelMap[item.status]}
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
