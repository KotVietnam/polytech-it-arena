import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { UserControls } from '../../components/UserControls'
import { useAuth } from '../../context/AuthContext'
import { tracksById } from '../../data/tracks'
import { useEvents } from '../../hooks/useEvents'
import type { Level, TrackId } from '../../types'
import { formatDateTime, getNearestEvent, sortEventsByDate } from '../../utils/date'

interface TrackTemplatePageProps {
  trackId: TrackId
}

interface LevelMeta {
  cardClass: string
  iconClass: string
  icon: ReactNode
}

interface EventStep {
  id: string
  title: string
  description: string
}

const levelOrder: Level[] = ['Junior', 'Middle', 'Senior']

const subtitleText = 'BLUE VS RED CYBER RANGE'
const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText = 'СМОТРЕТЬ КАЛЕНДАРЬ >>'
const profileSoonLabel = 'Открыть профиль пользователя'

const resourcesTitle = 'ПОЛЕЗНАЯ ИНФОРМАЦИЯ'
const newsTitle = 'НОВОСТИ'
const rulesTitle = 'ПРАВИЛА'

const flowTitle = 'HOW BLUE VS RED WORKS'
const flowIntro =
  'Blue Team и Red Team работают в одном учебном полигоне. Все действия фиксируются и разбираются после сессии.'

const timelineTitle = 'HOW THE EVENT WORKS'
const timelineIntro =
  'Структурированный цикл помогает пройти ивент без хаоса и с понятным результатом.'
const eventSteps: EventStep[] = [
  {
    id: '01',
    title: 'Briefing',
    description: 'Разбор цели, ролей и правил перед стартом сессии.',
  },
  {
    id: '02',
    title: 'Infrastructure Prep',
    description: 'Подготовка стенда, сервисов и контрольных точек мониторинга.',
  },
  {
    id: '03',
    title: 'Attack Phase',
    description: 'Практическая фаза Blue vs Red в рамках учебного полигона.',
  },
  {
    id: '04',
    title: 'Log Analysis',
    description: 'Анализ артефактов и журналов для восстановления картины событий.',
  },
  {
    id: '05',
    title: 'Debrief',
    description: 'Пост-ивент разбор решений, ошибок и улучшений на следующий раунд.',
  },
]

const levelsTitle = 'DIFFICULTY LEVELS'
const levelsIntro =
  'Выбирай уровень по опыту: от базовых сценариев до продвинутой командной тактики.'
const goalsLabel = 'GOALS'
const tasksLabel = 'TASK EXAMPLES'
const prepLabel = 'WHAT TO PREPARE'

const learnTitle = 'WHAT YOU WILL LEARN'
const learnIntro =
  'Практические навыки, которые можно сразу применять в учебных и реальных задачах.'

const ctaKicker = 'NEXT EVENT'
const ctaFallbackTitle = 'Cyber Training Session'
const ctaFallbackMeta = 'Дата и время будут опубликованы в календаре'
const ctaButtonText = 'JOIN THE EVENT'

const modalTitlePrefix = 'ПРАВИЛА:'
const closeText = 'ЗАКРЫТЬ'

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 4 6v6c0 5 3.5 8.7 8 9 4.5-.3 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const SwordIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m15 4 5 5-8.8 8.8-2.2.6.6-2.2L15 4Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="m8 20 3-3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const CapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m3 9 9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M19 12a7.7 7.7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-1.8-1l-.3-2.6h-4l-.3 2.6a7.7 7.7 0 0 0-1.8 1l-2.4-1-2 3.4L5.1 11a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 1.8 1l.3 2.6h4l.3-2.6a7.7 7.7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 4.5a3 3 0 0 0-3 3v.6A2.8 2.8 0 0 0 4 11v1a2.8 2.8 0 0 0 2 2.7V16a3 3 0 0 0 3 3h1V4.5H9Zm6 0a3 3 0 0 1 3 3v.6A2.8 2.8 0 0 1 20 11v1a2.8 2.8 0 0 1-2 2.7V16a3 3 0 0 1-3 3h-1V4.5h1Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 8.5H8m2 3H7.5m6-3H16m-2.5 3H16" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const levelMeta: Record<Level, LevelMeta> = {
  Junior: {
    cardClass: 'bm-track-level-card-junior',
    iconClass: 'bm-track-icon-junior',
    icon: <CapIcon />,
  },
  Middle: {
    cardClass: 'bm-track-level-card-middle',
    iconClass: 'bm-track-icon-middle',
    icon: <GearIcon />,
  },
  Senior: {
    cardClass: 'bm-track-level-card-senior',
    iconClass: 'bm-track-icon-senior',
    icon: <BrainIcon />,
  },
}

export const TrackTemplatePage = ({ trackId }: TrackTemplatePageProps) => {
  const { user, isGuest } = useAuth()
  const { events } = useEvents({ track: trackId })
  const track = tracksById[trackId]

  const [isRulesOpen, setIsRulesOpen] = useState(false)

  const nearestEvent = getNearestEvent(sortEventsByDate(events))
  const nextEventTitle = nearestEvent?.title ?? ctaFallbackTitle
  const nextEventMeta = nearestEvent
    ? `${formatDateTime(nearestEvent.date)} · ${nearestEvent.location}`
    : ctaFallbackMeta

  const infoPath = `/tracks/${trackId}/info`
  const newsPath = `/tracks/${trackId}/news`

  const rules = [
    'Только учебный полигон и стенд.',
    'Запрет атак в реальную сеть колледжа.',
    'Нельзя использовать DoS по инфраструктуре и оборудованию.',
    'Уважай команды, все действия фиксируются в логах.',
    'После ивента обязателен совместный разбор решений.',
  ]

  return (
    <div className="bm-track-page">
      <div className="bm-track-wrapper">
        <header className="bm-track-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel={profileSoonLabel}
            profileTitle={profileSoonLabel}
          />

          <div className="bm-track-headline-row">
            <div className="bm-title-stack bm-track-title-stack">
              <h1 className="bm-h1">{track.name.toUpperCase()}</h1>
              <h1 className="bm-h1 bm-h1-outline">{subtitleText}</h1>
              <p className="bm-track-subtitle">{track.summary}</p>
            </div>
          </div>

          <div className="bm-track-header-links">
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
          </div>
        </header>

        <div className="bm-track-resource-bar mono">
          <Link to={infoPath} className="bm-track-resource-link">
            {resourcesTitle}
          </Link>
          <Link to={newsPath} className="bm-track-resource-link">
            {newsTitle}
          </Link>
          <button
            type="button"
            className="bm-track-resource-btn"
            onClick={() => setIsRulesOpen(true)}
          >
            {rulesTitle}
          </button>
        </div>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{flowTitle}</h2>
          <p className="bm-track-section-intro">{flowIntro}</p>
          <div className="bm-track-grid bm-track-grid-flow">
            <article className="bm-track-competition-card bm-track-competition-card-blue bm-track-hover-card">
              <div className="bm-track-card-head">
                <span className="bm-track-icon bm-track-icon-blue">
                  <ShieldIcon />
                </span>
                <h3 className="bm-track-card-title mono">BLUE TEAM</h3>
              </div>
              <ul className="bm-track-list">
                {track.blueFlow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="bm-track-competition-card bm-track-competition-card-red bm-track-hover-card">
              <div className="bm-track-card-head">
                <span className="bm-track-icon bm-track-icon-red">
                  <SwordIcon />
                </span>
                <h3 className="bm-track-card-title mono">RED TEAM</h3>
              </div>
              <ul className="bm-track-list">
                {track.redFlow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{timelineTitle}</h2>
          <p className="bm-track-section-intro">{timelineIntro}</p>
          <div className="bm-track-grid bm-track-grid-steps">
            {eventSteps.map((step) => (
              <article key={step.id} className="bm-track-step-card bm-track-hover-card">
                <p className="bm-track-step-id mono">{step.id}</p>
                <h3 className="bm-track-step-title">{step.title}</h3>
                <p className="bm-track-step-text">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{levelsTitle}</h2>
          <p className="bm-track-section-intro">{levelsIntro}</p>
          <div className="bm-track-grid bm-track-grid-levels">
            {levelOrder.map((level) => (
              <article
                key={level}
                className={`bm-track-level-card bm-track-hover-card ${levelMeta[level].cardClass}`}
              >
                <div className="bm-track-level-head">
                  <span className={`bm-track-icon ${levelMeta[level].iconClass}`}>
                    {levelMeta[level].icon}
                  </span>
                  <h3 className="bm-track-level-title mono">{level}</h3>
                </div>

                <p className="bm-track-subsection-label mono">{goalsLabel}</p>
                <ul className="bm-track-list">
                  {track.levels[level].goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>

                <p className="bm-track-subsection-label mono">{tasksLabel}</p>
                <ul className="bm-track-list">
                  {track.levels[level].tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>

                <p className="bm-track-subsection-label mono">{prepLabel}</p>
                <ul className="bm-track-list">
                  {track.levels[level].preparation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{learnTitle}</h2>
          <p className="bm-track-section-intro bm-track-section-intro-center">{learnIntro}</p>
          <div className="bm-track-grid bm-track-grid-learn">
            {track.whatYouWillLearn.map((item) => (
              <article key={item} className="bm-track-learn-card bm-track-hover-card">
                {item}
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section bm-track-section-last">
          <article className="bm-track-cta-card bm-track-hover-card">
            <p className="bm-track-cta-kicker mono">{ctaKicker}</p>
            <h3 className="bm-track-cta-title">{nextEventTitle}</h3>
            <p className="bm-track-cta-meta">{nextEventMeta}</p>
            <Link to="/calendar" className="bm-track-cta-btn mono">
              {ctaButtonText}
            </Link>
          </article>
        </section>

        {isRulesOpen ? (
          <div
            className="bm-track-modal-backdrop"
            role="presentation"
            onClick={() => setIsRulesOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bm-track-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="bm-track-modal-head">
                <p className="bm-track-modal-title mono">
                  {`${modalTitlePrefix} ${track.name.toUpperCase()}`}
                </p>
                <button
                  type="button"
                  className="bm-track-modal-close mono"
                  onClick={() => setIsRulesOpen(false)}
                >
                  {closeText}
                </button>
              </div>
              <ul className="bm-track-list">
                {rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}