import { Link, Navigate, useParams } from 'react-router-dom'
import { UserControls } from '../../components/UserControls'
import { useAuth } from '../../context/AuthContext'
import { trackNames, tracksById } from '../../data/tracks'
import { useEvents } from '../../hooks/useEvents'
import type { TrackId } from '../../types'
import { formatDateTime } from '../../utils/date'

const newsTitle = 'НОВОСТИ ТРЕКА'
const emptyNewsText =
  'Пока нет новых новостей по этой дисциплине.'

const isTrackId = (value: string): value is TrackId =>
  Object.prototype.hasOwnProperty.call(tracksById, value)

export const TrackNewsPage = () => {
  const { user, isGuest } = useAuth()
  const { trackId } = useParams<{ trackId: string }>()
  const rawTrackId = trackId ?? ''
  const validTrack = isTrackId(rawTrackId) ? rawTrackId : undefined
  const { events } = useEvents(validTrack ? { track: validTrack } : undefined)

  if (!isTrackId(rawTrackId)) {
    return <Navigate to="/home" replace />
  }

  const track = tracksById[rawTrackId]

  const trackEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <div className="bm-track-page">
      <div className="bm-track-wrapper">
        <header className="bm-track-header bm-track-secondary-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel="Open profile"
            profileTitle="Open profile"
          />

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
