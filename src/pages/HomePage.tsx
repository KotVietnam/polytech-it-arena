import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { events } from '../data/events'
import { trackNames } from '../data/tracks'
import { formatDateTime, getNearestEvent, sortEventsByDate } from '../utils/date'

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
const fallbackEventDate =
  'ДАТА УТОЧНЯЕТСЯ'

const scheduleLinkText =
  'УЗНАТЬ РАСПИСАНИЕ >>'

const telegramLabel = 'ТЕЛЕГРАМ'
const telegramValue = '@POLYETCH_IT_ARENA'
const emailLabel = 'EMAIL'
const emailValue = 'polytechitarena@aspc.kz'
const addressLabel = 'АДРЕС ПРОВЕДЕНИЯ'
const addressValue =
  'IT Hub, Тастак-1, 1Б'

const profileSoonLabel =
  'Открыть профиль пользователя (скоро)'

export const HomePage = () => {
  const { user } = useAuth()
  const nearestEvent = getNearestEvent(sortEventsByDate(events))

  const [headlineIndex, setHeadlineIndex] = useState(0)
  const [phase, setPhase] = useState<RotationPhase>('typing')
  const [charCount, setCharCount] = useState(0)
  const [line1CharCount, setLine1CharCount] = useState(0)

  const rotatingHeadlines = useMemo<RotatingHeadline[]>(() => {
    const eventLine1 = nearestEvent
      ? `${trackNames[nearestEvent.track].toUpperCase()} ${nearestEvent.level.toUpperCase()}`
      : fallbackEventTitle
    const eventLine2 = nearestEvent
      ? formatDateTime(nearestEvent.date).toUpperCase()
      : fallbackEventDate

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
  }, [nearestEvent])

  const activeHeadline = rotatingHeadlines[headlineIndex]
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

  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="bm-page relative">
      <div className="bm-wrapper relative z-10">
        <header className="bm-header">
          <div className="bm-title-stack">
            <h1
              className={`bm-h1 ${activeHeadline.kind === 'cyber' ? 'bm-h1-no-wrap' : ''}`}
            >
              {visibleLine1}
            </h1>
            <h1 className="bm-h1 bm-h1-outline">{visibleLine2}</h1>
          </div>

          <Link to="/calendar" className="bm-header-schedule mono">
            {scheduleLinkText}
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
