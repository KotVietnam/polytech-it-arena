import { Link, Navigate, useParams } from 'react-router-dom'
import { UserControls } from '../../components/UserControls'
import { useAuth } from '../../context/AuthContext'
import { tracksById } from '../../data/tracks'
import type { Level, TrackId } from '../../types'

const levelOrder: Level[] = ['Junior', 'Middle', 'Senior']

const infoTitle = 'USEFUL INFO & RULES'
const baseTopicsTitle = 'КЛЮЧЕВЫЕ ТЕМЫ ПО ТРЕКУ'
const toolsTitle = 'ИНСТРУМЕНТЫ И ПОДГОТОВКА'
const rulesTitle = 'ПРАВИЛА (ОБЩИЙ РЕГЛАМЕНТ)'
const practiceTitle = 'ЧТО ПОВТОРИТЬ ПЕРЕД ИВЕНТОМ'

const toTrackLinkText = 'К ТРЕКУ >>'
const toCalendarLinkText = 'КАЛЕНДАРЬ >>'
const toNewsLinkText = 'НОВОСТИ >>'

const profileSoonLabel = 'Открыть профиль пользователя'

const commonRules = [
  'Работа только в учебном стенде/полигоне.',
  'Запрещены атаки в реальную сеть и сервисы колледжа.',
  'Запрещены DoS-атаки по железу и инфраструктуре.',
  'Уважительное взаимодействие между командами обязательно.',
  'Все действия фиксируются в логах и проверяются кураторами.',
  'После сессии проводится обязательный разбор решений.',
]

const rulesNote =
  'Этот блок подготовлен как единая точка правил. Позже здесь будет подключен общий регламент клуба.'

const isTrackId = (value: string): value is TrackId =>
  Object.prototype.hasOwnProperty.call(tracksById, value)

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3.5A8.5 8.5 0 1 0 20.5 12 8.5 8.5 0 0 0 12 3.5Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 10.2v5.1m0-8.2h.01" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const ToolIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m7 6 2.8 2.8-4 4L3 10l4-4Zm7.5 1.5 2 2-6.8 6.8-2-2 6.8-6.8Zm2.8 2.8 1.7 1.7-3.8 3.8-1.7-1.7 3.8-3.8Z" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 4 6v6c0 5 3.5 8.7 8 9 4.5-.3 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const ChecklistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 5h12v14H6z" stroke="currentColor" strokeWidth="1.8" />
    <path d="m9 10 1.5 1.5L13 9m-4 6h6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const TrackInfoPage = () => {
  const { user, isGuest } = useAuth()
  const { trackId } = useParams<{ trackId: string }>()
  const rawTrackId = trackId ?? ''

  if (!isTrackId(rawTrackId)) {
    return <Navigate to="/home" replace />
  }

  const track = tracksById[rawTrackId]

  const preparationItems = Array.from(
    new Set(levelOrder.flatMap((level) => track.levels[level].preparation)),
  )

  return (
    <div className="bm-track-page">
      <div className="bm-track-wrapper">
        <header className="bm-track-header bm-track-secondary-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel={profileSoonLabel}
            profileTitle={profileSoonLabel}
          />

          <div className="bm-title-stack bm-track-title-stack">
            <h1 className="bm-h1">{track.name.toUpperCase()}</h1>
            <h1 className="bm-h1 bm-h1-outline">{infoTitle}</h1>
            <p className="bm-track-subtitle">
              Страница с материалами и правилами по дисциплине. Формат рассчитан на быстрый просмотр перед соревнованием.
            </p>
          </div>

          <div className="bm-track-header-links">
            <Link to={`/tracks/${rawTrackId}`} className="bm-track-header-link mono">
              {toTrackLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {toCalendarLinkText}
            </Link>
            <Link to={`/tracks/${rawTrackId}/news`} className="bm-track-header-link mono">
              {toNewsLinkText}
            </Link>
          </div>
        </header>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{baseTopicsTitle}</h2>
          <div className="bm-track-grid bm-track-grid-learn">
            {track.whatYouWillLearn.map((item) => (
              <article key={item} className="bm-track-info-card bm-track-info-card-blue bm-track-hover-card">
                <div className="bm-track-card-head">
                  <span className="bm-track-icon bm-track-icon-blue">
                    <InfoIcon />
                  </span>
                  <h3 className="bm-track-card-title mono">TOPIC</h3>
                </div>
                <p className="bm-track-panel-text">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{toolsTitle}</h2>
          <div className="bm-track-grid bm-track-grid-learn">
            {preparationItems.map((item) => (
              <article key={item} className="bm-track-info-card bm-track-info-card-warning bm-track-hover-card">
                <div className="bm-track-card-head">
                  <span className="bm-track-icon bm-track-icon-middle">
                    <ToolIcon />
                  </span>
                  <h3 className="bm-track-card-title mono">PREP</h3>
                </div>
                <p className="bm-track-panel-text">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="rules-regulation" className="bm-track-section">
          <h2 className="bm-track-section-title mono">{rulesTitle}</h2>
          <article className="bm-track-rules-card bm-track-hover-card">
            <div className="bm-track-card-head">
              <span className="bm-track-icon bm-track-icon-red">
                <ShieldIcon />
              </span>
              <h3 className="bm-track-card-title mono">CLUB REGULATION DRAFT</h3>
            </div>

            <p className="bm-track-rules-note">{rulesNote}</p>

            <ul className="bm-track-list">
              {commonRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="bm-track-section bm-track-section-last">
          <h2 className="bm-track-section-title mono">{practiceTitle}</h2>
          <div className="bm-track-grid bm-track-grid-checklist">
            {track.checklist.map((item) => (
              <article key={item} className="bm-track-info-card bm-track-info-card-green bm-track-hover-card">
                <div className="bm-track-card-head">
                  <span className="bm-track-icon bm-track-icon-junior">
                    <ChecklistIcon />
                  </span>
                  <h3 className="bm-track-card-title mono">CHECK</h3>
                </div>
                <p className="bm-track-panel-text">{item}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}