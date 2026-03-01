import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { tracksById } from '../../data/tracks'
import type { Level, TrackId } from '../../types'

interface TrackTemplatePageProps {
  trackId: TrackId
}

const levelOrder: Level[] = ['Junior', 'Middle', 'Senior']
const levelPoints: Record<Level, number> = {
  Junior: 60,
  Middle: 95,
  Senior: 130,
}

const subtitleText =
  'БОЕВОЙ ТРЕК BLUE vs RED'
const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText =
  'СМОТРЕТЬ КАЛЕНДАРЬ >>'
const profileSoonLabel =
  'Открыть профиль пользователя (скоро)'

const resourcesTitle =
  'ПОЛЕЗНАЯ ИНФОРМАЦИЯ'
const newsTitle = 'НОВОСТИ'
const rulesTitle = 'ПРАВИЛА'

const flowTitle = 'КАК ПРОХОДИТ BLUE VS RED'
const flowIntro =
  'Стороны работают только в учебном полигоне с обязательным разбором после сессии.'

const levelsTitle = 'УРОВНИ СЛОЖНОСТИ'
const levelsIntro =
  'Выбирай уровень по опыту и постепенно переходи к более сложным сценариям.'
const goalsLabel = 'ЦЕЛИ'
const tasksLabel = 'ПРИМЕРЫ ЗАДАЧ'
const prepLabel = 'ЧТО ПОДГОТОВИТЬ'

const learnTitle = 'ЧТО ПРОКАЧАЕШЬ'
const learnIntro =
  'Навыки и умения, которые ты заберешь после нескольких ивентов.'

const registerButtonText =
  'РЕГИСТРАЦИЯ НА СОРЕВНОВАНИЕ'
const registeredPrefix =
  'Регистрация подтверждена'

const modalTitlePrefix = 'ПРАВИЛА:'
const closeText = 'ЗАКРЫТЬ'

export const TrackTemplatePage = ({ trackId }: TrackTemplatePageProps) => {
  const { user, registerTrack } = useAuth()
  const track = tracksById[trackId]

  const [registerMessage, setRegisterMessage] = useState('')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isRulesOpen, setIsRulesOpen] = useState(false)

  const handleRegistration = (level: Level) => {
    registerTrack(trackId, level)
    setRegisterMessage(
      `${registeredPrefix}: ${track.name} (${level}) / +${levelPoints[level]} PTS`,
    )
    setIsRegisterOpen(false)
  }

  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || '?'
  const infoPath = `/tracks/${trackId}/info`
  const newsPath = `/tracks/${trackId}/news`

  const rules = [
    'Только учебный полигон и стенд.',
    'Запрет атак в реальную сеть колледжа.',
    'Не использовать DoS по железу и инфраструктуре.',
    'Уважать команды и фиксировать действия в логах.',
    'После ивента обязателен разбор решений.',
  ]

  return (
    <div className="bm-track-page">
      <div className="bm-track-wrapper">
        <header className="bm-track-header">
          <div className="bm-track-headline-row">
            <div className="bm-title-stack bm-track-title-stack">
              <h1 className="bm-h1">{track.name.toUpperCase()}</h1>
              <h1 className="bm-h1 bm-h1-outline">{subtitleText}</h1>
              <p className="bm-track-subtitle">{track.summary}</p>
            </div>
          </div>

          <div className="bm-track-register-top">
            <button
              type="button"
              className="bm-track-register-top-btn mono"
              onClick={() => setIsRegisterOpen((value) => !value)}
              aria-expanded={isRegisterOpen}
              aria-label={registerButtonText}
            >
              {registerButtonText}
            </button>

            {isRegisterOpen ? (
              <div className="bm-track-register-pop">
                {levelOrder.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="bm-track-register-option mono"
                    onClick={() => handleRegistration(level)}
                  >
                    {`${level} (+${levelPoints[level]})`}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="bm-track-header-links">
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
          </div>

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

          {registerMessage ? (
            <p className="bm-track-head-message mono">{registerMessage}</p>
          ) : null}
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
            <article className="bm-track-panel">
              <h3 className="bm-track-panel-title mono">BLUE TEAM</h3>
              <ul className="bm-track-list">
                {track.blueFlow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="bm-track-panel">
              <h3 className="bm-track-panel-title mono">RED TEAM</h3>
              <ul className="bm-track-list">
                {track.redFlow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{levelsTitle}</h2>
          <p className="bm-track-section-intro">{levelsIntro}</p>
          <div className="bm-track-grid bm-track-grid-levels">
            {levelOrder.map((level) => (
              <article key={level} className="bm-track-level-card">
                <div className="bm-track-level-head">
                  <h3 className="bm-track-level-title mono">{level}</h3>
                  <span className="bm-track-level-points mono">
                    +{levelPoints[level]} PTS
                  </span>
                </div>

                <p className="bm-track-level-label mono">{goalsLabel}</p>
                <ul className="bm-track-list">
                  {track.levels[level].goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>

                <p className="bm-track-level-label mono">{tasksLabel}</p>
                <ul className="bm-track-list">
                  {track.levels[level].tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>

                <p className="bm-track-level-label mono">{prepLabel}</p>
                <ul className="bm-track-list">
                  {track.levels[level].preparation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section bm-track-section-last">
          <h2 className="bm-track-section-title mono">{learnTitle}</h2>
          <p className="bm-track-section-intro bm-track-section-intro-center">
            {learnIntro}
          </p>
          <div className="bm-track-grid bm-track-grid-learn bm-track-grid-center">
            {track.whatYouWillLearn.map((item) => (
              <article key={item} className="bm-track-panel bm-track-panel-center">
                {item}
              </article>
            ))}
          </div>
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
