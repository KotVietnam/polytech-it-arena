import { Link } from 'react-router-dom'
import { UserControls } from '../components/UserControls'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import { useArchives } from '../hooks/useArchives'
import { formatDateTime } from '../utils/date'

const homeLinkText = 'НА ГЛАВНУЮ >>'
const calendarLinkText = 'КАЛЕНДАРЬ >>'
const adminLinkText = 'ADMIN PANEL >>'

export const ArchivePage = () => {
  const { user, isGuest } = useAuth()
  const { archives, loading, error } = useArchives()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="bm-archive-page">
      <div className="bm-archive-wrapper">
        <header className="bm-archive-header">
          <UserControls
            username={user?.username}
            isGuest={isGuest}
            profileAriaLabel="Открыть профиль"
            profileTitle="Открыть профиль"
          />

          <div className="bm-title-stack bm-archive-title-stack">
            <h1 className="bm-h1 bm-h1-no-wrap">АРХИВ</h1>
            <h1 className="bm-h1 bm-h1-outline">ПРОШЕДШИЕ СОБЫТИЯ</h1>
            <p className="bm-archive-subtitle">
              Лента завершенных мероприятий, итогов и материалов по трекам
              CyberSecurity, Networks, DevOps и SysAdmin.
            </p>
          </div>

          <div className="bm-archive-header-links">
            <Link to="/home" className="bm-track-header-link mono">
              {homeLinkText}
            </Link>
            <Link to="/calendar" className="bm-track-header-link mono">
              {calendarLinkText}
            </Link>
            {isAdmin ? (
              <Link to="/admin" className="bm-track-header-link mono">
                {adminLinkText}
              </Link>
            ) : null}
          </div>

        </header>

        <section className="bm-archive-content">
          {loading ? (
            <article className="bm-archive-state-panel">Загрузка архива...</article>
          ) : null}

          {error ? (
            <article className="bm-archive-state-panel bm-archive-state-panel-error">
              Не удалось загрузить архив: {error}
            </article>
          ) : null}

          {!loading && !error && archives.length === 0 ? (
            <article className="bm-archive-state-panel">
              Архив пока пуст. Записи появятся после публикации администратором.
            </article>
          ) : null}

          {!loading && !error && archives.length > 0 ? (
            <div className="bm-archive-grid">
              {archives.map((entry) => (
                <article key={entry.id} className="bm-archive-card">
                  <p className="bm-archive-meta mono">
                    {trackNames[entry.event.track]} / {entry.event.level} /{' '}
                    {formatDateTime(entry.event.date)}
                  </p>

                  <h2 className="bm-archive-title">{entry.event.title}</h2>
                  <p className="bm-archive-desc">{entry.event.description}</p>

                  <div className="bm-archive-inner-grid">
                    <section className="bm-archive-inner-panel">
                      <p className="bm-archive-inner-label mono">ИТОГ</p>
                      <p className="bm-archive-inner-text">{entry.summary}</p>
                    </section>

                    <section className="bm-archive-inner-panel">
                      <p className="bm-archive-inner-label mono">МАТЕРИАЛЫ</p>
                      {entry.materials.length ? (
                        <ul className="bm-archive-materials">
                          {entry.materials.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="bm-archive-inner-text">Без приложенных материалов</p>
                      )}
                    </section>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
