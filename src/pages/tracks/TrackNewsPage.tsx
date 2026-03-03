import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { events } from '../../data/events'
import { trackNames, tracksById } from '../../data/tracks'
import type { TrackId } from '../../types'
import { formatDateTime, sortEventsByDate } from '../../utils/date'

const newsTitle = 'НОВОСТИ ТРЕКА'
const emptyNewsText =
  'Пока нет новых новостей по этой дисциплине.'

const isTrackId = (value: string): value is TrackId =>
  Object.prototype.hasOwnProperty.call(tracksById, value)

export const TrackNewsPage = () => {
  const { user } = useAuth()
  const { trackId } = useParams<{ trackId: string }>()
  const rawTrackId = trackId ?? ''

  if (!isTrackId(rawTrackId)) {
    return <Navigate to="/home" replace />
  }

  const track = tracksById[rawTrackId]
  const avatarLetter = user?.username?.trim().charAt(0).toUpperCase() || '?'

  const trackEvents = sortEventsByDate(events)
    .filter((eventItem) => eventItem.track === rawTrackId)
    .reverse()

  return (
    <div className="bm-track-page">
      <div className="bm-track-wrapper">
        <header className="bm-track-header bm-track-secondary-header">
          <div className="bm-title-stack bm-track-title-stack">
            <h1 className="bm-h1">{track.name.toUpperCase()}</h1>
            <h1 className="bm-h1 bm-h1-outline">{newsTitle}</h1>
          </div>

          <div className="bm-track-header-links">
            <Link to={`/tracks/${rawTrackId}`} className="bm-track-header-link mono">
              {'К ТРЕКУ >>'}
            </Link>
            <Link to={`/tracks/${rawTrackId}/info`} className="bm-track-header-link mono">
              {'ИНФОРМАЦИЯ >>'}
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

        <section className="bm-track-section bm-track-section-last">
          {trackEvents.length ? (
            <div className="bm-track-grid bm-track-grid-news">
              {trackEvents.map((eventItem) => (
                <article key={eventItem.id} className="bm-track-panel">
                  <p className="bm-track-panel-title mono">
                    {formatDateTime(eventItem.date)} / {trackNames[eventItem.track]} /{' '}
                    {eventItem.level}
                  </p>
                  <h3 className="bm-track-news-title">{eventItem.title}</h3>
                  <p className="bm-track-panel-text">{eventItem.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <article className="bm-track-panel">{emptyNewsText}</article>
          )}
        </section>
      </div>
    </div>
  )
}
