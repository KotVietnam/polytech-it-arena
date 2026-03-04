import { Link, Navigate, useParams } from 'react-router-dom'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useAuth } from '../../context/AuthContext'
import { tracksById } from '../../data/tracks'
import type { Level, TrackId } from '../../types'

const levelOrder: Level[] = ['Junior', 'Middle', 'Senior']

const infoTitle =
  'ПОЛЕЗНАЯ ИНФОРМАЦИЯ'
const baseTopicsTitle =
  'БАЗОВЫЕ ТЕМЫ ДЛЯ СТАРТА'
const toolsTitle =
  'ЧТО ПОДГОТОВИТЬ ПЕРЕД ИВЕНТОМ'
const practiceTitle =
  'ЧТО ПОЧИТАТЬ / ПОПРАКТИКОВАТЬ'

const isTrackId = (value: string): value is TrackId =>
  Object.prototype.hasOwnProperty.call(tracksById, value)

export const TrackInfoPage = () => {
  const { user } = useAuth()
  const { trackId } = useParams<{ trackId: string }>()
  const rawTrackId = trackId ?? ''

  if (!isTrackId(rawTrackId)) {
    return <Navigate to="/home" replace />
  }

  const track = tracksById[rawTrackId]
  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || '?'

  const preparationItems = Array.from(
    new Set(levelOrder.flatMap((level) => track.levels[level].preparation)),
  )

  return (
    <div className="bm-track-page">
      <div className="bm-track-wrapper">
        <header className="bm-track-header bm-track-secondary-header">
          <ThemeToggle />

          <div className="bm-title-stack bm-track-title-stack">
            <h1 className="bm-h1">{track.name.toUpperCase()}</h1>
            <h1 className="bm-h1 bm-h1-outline">{infoTitle}</h1>
          </div>

          <div className="bm-track-header-links">
            <Link to={`/tracks/${rawTrackId}`} className="bm-track-header-link mono">
              {'К ТРЕКУ >>'}
            </Link>
            <Link to={`/tracks/${rawTrackId}/news`} className="bm-track-header-link mono">
              {'НОВОСТИ >>'}
            </Link>
          </div>

          <Link
            to="/profile"
            className="bm-user-chip bm-user-chip-button mono"
            aria-label="Open profile"
            title="Open profile"
          >
            <div className="bm-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="bm-user-text">USER: {user?.username ?? 'UNKNOWN'}</div>
          </Link>
        </header>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{baseTopicsTitle}</h2>
          <div className="bm-track-grid bm-track-grid-learn">
            {track.whatYouWillLearn.map((item) => (
              <article key={item} className="bm-track-panel">
                {item}
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section">
          <h2 className="bm-track-section-title mono">{toolsTitle}</h2>
          <div className="bm-track-grid bm-track-grid-learn">
            {preparationItems.map((item) => (
              <article key={item} className="bm-track-panel">
                {item}
              </article>
            ))}
          </div>
        </section>

        <section className="bm-track-section bm-track-section-last">
          <h2 className="bm-track-section-title mono">{practiceTitle}</h2>
          <div className="bm-track-grid bm-track-grid-checklist">
            {track.checklist.map((item) => (
              <article key={item} className="bm-track-panel">
                {item}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
