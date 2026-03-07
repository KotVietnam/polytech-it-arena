/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiGetEventLiveStats, type EventLiveStatsItem } from '../api/client'
import { UserControls } from '../components/UserControls'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import { useEvents } from '../hooks/useEvents'
import {
  getCurrentEvent,
  getNearestEvent,
  sortEventsByDate,
} from '../utils/date'

const cards = [
  {
    id: 'ID: 0x01 / SEC',
    path: '/tracks/cybersecurity',
    title: 'CYBER\nSECURITY',
    desc: 'Защита сервисов, поиск уязвимостей и разбор инцидентов в полигоне.',
  },
  {
    id: 'ID: 0x02 / NET',
    path: '/tracks/networks',
    title: 'CORE\nNETWORKS',
    desc: 'Сегментация, маршрутизация и анализ сетевого трафика под нагрузкой.',
  },
  {
    id: 'ID: 0x03 / DVO',
    path: '/tracks/devops',
    title: 'DEVOPS\nFLOW',
    desc: 'CI/CD, контейнеры и стабильный деплой с мониторингом и логами.',
  },
  {
    id: 'ID: 0x04 / ADM',
    path: '/tracks/sysadmin',
    title: 'SYSTEM\nKERNEL',
    desc: 'Linux-администрирование, резервное копирование и восстановление систем.',
  },
]

type RotationPhase = 'typing' | 'hold' | 'deleting'

interface RotatingHeadline {
  kind: 'cyber' | 'event'
  line1: string
  line2: string
  holdMs: number
}

const TYPE_SPEED_MS = 46
const DELETE_SPEED_MS = 28
const SWITCH_DELAY_MS = 220

const CYBER_HOLD_MS = 2000
const EVENT_HOLD_MS = 5000

const CYBER_LINE_1 = 'POLYTECH IT ARENA'
const CYBER_LINE_2_ROTATION = [
  'СОБЕРИ СВОЮ КОМАНДУ',
  'ЗАЩИЩАЙ ИНФРАСТУКТУРУ',
  'НАХОДИ УЯЗВИМОСТИ',
] as const

const fallbackEventTitle =
  'БЛИЖАЙШЕЕ СОБЫТИЕ'
const fallbackEventDate = 'ДАТА УТОЧНЯЕТСЯ'
const activeEventLabel = 'СЕЙЧАС ИДЁТ'
const liveHeadlineWatchText = 'СМОТРЕТЬ >>'

const scheduleLinkText =
  'УЗНАТЬ РАСПИСАНИЕ >>'
const archiveLinkText = 'АРХИВ ИВЕНТОВ >>'

const telegramLabel = 'ТЕЛЕГРАМ'
const telegramValue = '@POLYETCH_IT_ARENA'
const emailLabel = 'EMAIL'
const emailValue = 'polytechitarena@aspc.kz'
const addressLabel = 'АДРЕС ПРОВЕДЕНИЯ'
const addressValue =
  'IT Hub, Тастак-1, 1Б'

const profileLabel = 'Открыть профиль пользователя'
const liveModeTitle = 'СОРЕВНОВАНИЕ ИДЁТ ПРЯМО СЕЙЧАС'
const liveModeClassicText = 'ПЕРЕЙТИ НА ГЛАВНУЮ >>'
const liveParticipantsLabel = 'УЧАСТНИКОВ'
const liveAwaitingDrawText = 'ОЖИДАЕТСЯ ЖЕРЕБЬЕВКА КОМАНД'
const liveLastActionLabel = 'ПОСЛЕДНЕЕ ДЕЙСТВИЕ'
const liveTimerLabel = 'ТАЙМЕР'
const liveTimerStatusMap: Record<EventLiveStatsItem['timer']['status'], string> = {
  idle: 'НЕ ЗАПУЩЕН',
  running: 'СТАРТ',
  paused: 'ПАУЗА',
  break: 'ПЕРЕРЫВ',
}

const eventHeadlineDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
})

const eventHeadlineTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const formatEventHeadlineDate = (isoDate: string) => {
  const parsed = new Date(isoDate)
  return `${eventHeadlineDateFormatter.format(parsed).toUpperCase()} В ${eventHeadlineTimeFormatter.format(parsed)}`
}

const formatElapsedTimer = (totalSeconds: number) => {
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

  if (snapshot.timer.status !== 'running' || !snapshot.timer.startedAt) {
    return snapshot.timer.elapsedSeconds
  }

  const startedAtMs = new Date(snapshot.timer.startedAt).getTime()
  if (!Number.isFinite(startedAtMs)) {
    return snapshot.timer.elapsedSeconds
  }

  return snapshot.timer.elapsedSeconds + Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
}

export const HomePage = () => {
  const location = useLocation()
  const isClassicCopy = location.pathname === '/live'
  const { user, isGuest } = useAuth()
  const { events } = useEvents()
  const nearestEvent = getNearestEvent(sortEventsByDate(events))
  const [timelineTick, setTimelineTick] = useState(() => Date.now())
  const [liveNowTick, setLiveNowTick] = useState(() => Date.now())
  const currentEvent = useMemo(
    () => getCurrentEvent(events, new Date(timelineTick)),
    [events, timelineTick],
  )
  const [liveStats, setLiveStats] = useState<EventLiveStatsItem | null>(null)

  const [headlineIndex, setHeadlineIndex] = useState(0)
  const [phase, setPhase] = useState<RotationPhase>('typing')
  const [charCount, setCharCount] = useState(0)
  const [line1CharCount, setLine1CharCount] = useState(0)

  const rotatingHeadlines = useMemo<RotatingHeadline[]>(() => {
    let eventLine1 = fallbackEventTitle
    let eventLine2 = fallbackEventDate

    if (currentEvent) {
      eventLine1 = activeEventLabel
      eventLine2 = currentEvent.title.toUpperCase()
    } else if (nearestEvent) {
      eventLine1 = `${trackNames[nearestEvent.track].toUpperCase()} ${nearestEvent.level.toUpperCase()}`
      eventLine2 = formatEventHeadlineDate(nearestEvent.date)
    }

    const cyberItems: RotatingHeadline[] = CYBER_LINE_2_ROTATION.map((line2) => ({
      kind: 'cyber',
      line1: CYBER_LINE_1,
      line2,
      holdMs: CYBER_HOLD_MS,
    }))

    return [
      ...cyberItems,
      {
        kind: 'event',
        line1: eventLine1,
        line2: eventLine2,
        holdMs: EVENT_HOLD_MS,
      },
    ]
  }, [currentEvent, nearestEvent])

  const activeHeadline = rotatingHeadlines[headlineIndex]
  const isEventHeadlineActive = activeHeadline.kind === 'event'
  const shouldShowLiveWatchButton = isEventHeadlineActive && Boolean(currentEvent)
  const shouldTypePrimaryLine =
    activeHeadline.kind === 'cyber' && headlineIndex === 0
  const maxLength =
    activeHeadline.kind === 'cyber'
      ? activeHeadline.line2.length
      : Math.max(activeHeadline.line1.length, activeHeadline.line2.length)
  const visibleLine1 =
    shouldTypePrimaryLine
      ? activeHeadline.line1.slice(0, line1CharCount)
      : activeHeadline.kind === 'cyber'
        ? activeHeadline.line1
        : activeHeadline.line1.slice(0, charCount)
  const visibleLine2 = activeHeadline.line2.slice(0, charCount)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimelineTick(Date.now())
    }, 30_000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNowTick(Date.now())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!currentEvent) {
      setLiveStats(null)
      return
    }

    let cancelled = false
    const loadLiveStats = async () => {
      try {
        const response = await apiGetEventLiveStats(currentEvent.id)
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
    }, 20_000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [currentEvent])

  useEffect(() => {
    setHeadlineIndex(0)
    setPhase('typing')
    setCharCount(0)
  }, [rotatingHeadlines])

  useEffect(() => {
    if (activeHeadline.kind !== 'cyber') {
      setLine1CharCount(activeHeadline.line1.length)
      return
    }

    if (headlineIndex === 0) {
      setLine1CharCount(0)
      return
    }

    setLine1CharCount(activeHeadline.line1.length)
  }, [activeHeadline.kind, activeHeadline.line1.length, headlineIndex])

  useEffect(() => {
    if (!shouldTypePrimaryLine) return
    if (line1CharCount >= activeHeadline.line1.length) return

    const timer = setTimeout(
      () => setLine1CharCount((value) => value + 1),
      TYPE_SPEED_MS,
    )

    return () => clearTimeout(timer)
  }, [
    activeHeadline.line1.length,
    line1CharCount,
    shouldTypePrimaryLine,
  ])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (charCount < maxLength) {
        timer = setTimeout(() => setCharCount((value) => value + 1), TYPE_SPEED_MS)
      } else {
        timer = setTimeout(() => setPhase('hold'), activeHeadline.holdMs)
      }
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('deleting'), 0)
    } else if (charCount > 0) {
      timer = setTimeout(() => setCharCount((value) => value - 1), DELETE_SPEED_MS)
    } else {
      timer = setTimeout(() => {
        setHeadlineIndex((value) => (value + 1) % rotatingHeadlines.length)
        setPhase('typing')
      }, SWITCH_DELAY_MS)
    }

    return () => clearTimeout(timer)
  }, [
    activeHeadline.holdMs,
    charCount,
    maxLength,
    phase,
    rotatingHeadlines.length,
  ])

  const liveTeams = liveStats?.teams ?? [
    {
      id: 'blue' as const,
      name: 'BLUE TEAM',
      score: 0,
      participantsCount: 0,
      participants: [],
    },
    {
      id: 'red' as const,
      name: 'RED TEAM',
      score: 0,
      participantsCount: 0,
      participants: [],
    },
  ]
  const lastLiveAction = liveStats?.recentActions[0] ?? null
  const liveTimerSeconds = resolveLiveElapsedSeconds(liveStats, liveNowTick)
  const liveTimerStatusText = liveStats ? liveTimerStatusMap[liveStats.timer.status] : liveTimerStatusMap.idle

  if (currentEvent && !isClassicCopy) {

    return (
      <div className="bm-page relative">
        <div className="bm-wrapper bm-live-event-shell relative z-10">
          <section className="bm-live-event-hero">
            <h1 className="bm-h1 bm-live-event-title">{liveModeTitle}</h1>
            <h2 className="bm-h1 bm-h1-outline bm-live-event-subtitle">{currentEvent.title}</h2>

            <div className="bm-live-event-actions">
              <Link to="/live" className="bm-live-event-btn mono">
                {liveModeClassicText}
              </Link>
            </div>
          </section>

          <section className="bm-live-event-panel">
            <div className="bm-live-scoreboard" aria-label="Статистика очков события">
              {liveTeams.map((team) => (
                <article key={team.id} className={`bm-live-team-card bm-live-team-card-${team.id}`}>
                  <p className="bm-live-team-name mono">{team.name}</p>
                  <p className="bm-live-team-score mono">{team.score} PTS</p>
                  <p className="bm-live-team-hint mono">
                    {liveParticipantsLabel}: {team.participantsCount}
                  </p>
                  <p className="bm-live-team-hint mono">
                    {team.participants[0]?.name ?? 'СОСТАВ ЕЩЁ НЕ СФОРМИРОВАН'}
                  </p>
                </article>
              ))}
            </div>
            <div className="bm-live-event-log mono">
              {liveStats?.hasDraw ? (
                lastLiveAction ? (
                  `${liveLastActionLabel}: ${lastLiveAction.team.toUpperCase()} ${lastLiveAction.points > 0 ? '+' : ''}${lastLiveAction.points} / ${lastLiveAction.reason}`
                ) : (
                  'СУДЕЙСКИЕ ДЕЙСТВИЯ ПОКА НЕ ЗАФИКСИРОВАНЫ'
                )
              ) : (
                liveAwaitingDrawText
              )}
            </div>
            <div className="bm-live-event-log mono">
              {liveTimerLabel}: {formatElapsedTimer(liveTimerSeconds)} / {liveTimerStatusText}
            </div>

          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="bm-page relative">
      <div className="bm-wrapper relative z-10">
        <header className="bm-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel={profileLabel}
            profileTitle={profileLabel}
          />

          <div className="bm-title-stack">
            <h1
              className={`bm-h1 ${activeHeadline.kind === 'cyber' ? 'bm-h1-no-wrap' : ''}`}
            >
              {visibleLine1}
            </h1>
            <h1 className="bm-h1 bm-h1-outline">{visibleLine2}</h1>
            {shouldShowLiveWatchButton ? (
              <Link to="/home" className="bm-headline-watch mono">
                {liveHeadlineWatchText}
              </Link>
            ) : null}
          </div>

          <div className="bm-header-actions">
            <Link to="/calendar" className="bm-header-action mono">
              {scheduleLinkText}
            </Link>
            <Link to="/archive" className="bm-header-action mono">
              {archiveLinkText}
            </Link>
          </div>

        </header>

        <div className="bm-competencies">
          {cards.map((card) => (
            <Link
              key={card.id}
              to={card.path}
              className="bm-comp-card"
              aria-label={`Открыть компетенцию ${card.title.replace('\n', ' ')}`}
            >
              <div className="bm-comp-id mono">{card.id}</div>
              <h2 className="bm-comp-title">{card.title}</h2>
              <p className="bm-comp-desc">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div id="specs" className="bm-specs mono">
          <div className="bm-spec-item">
            {telegramLabel}:
            <br />
            {telegramValue}
          </div>
          <div className="bm-spec-item">
            {emailLabel}:
            <br />
            {emailValue}
          </div>
          <div className="bm-spec-item bm-spec-item-accent">
            {addressLabel}:
            <br />
            {addressValue}
          </div>
        </div>
      </div>
    </div>
  )
}
