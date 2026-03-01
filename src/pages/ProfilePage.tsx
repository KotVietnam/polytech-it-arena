import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'
import { useAuth } from '../context/AuthContext'
import { trackNames } from '../data/tracks'
import { formatDateTime } from '../utils/date'

export const ProfilePage = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="User Profile"
        title={`Профиль: ${user.username}`}
        description="Личный прогресс в соревнованиях и последние регистрации по компетенциям."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2 motion-safe:animate-reveal-up">
          <p className="mono text-xs text-red-400">TOTAL POINTS</p>
          <p className="text-4xl font-bold text-white">{user.totalPoints}</p>
        </Card>

        <Card className="space-y-2 motion-safe:animate-reveal-up [animation-delay:80ms]">
          <p className="mono text-xs text-red-400">TOTAL REGISTRATIONS</p>
          <p className="text-4xl font-bold text-white">{user.registrations.length}</p>
        </Card>

        <Card className="space-y-2 motion-safe:animate-reveal-up [animation-delay:160ms]">
          <p className="mono text-xs text-red-400">LAST TRACK</p>
          <p className="text-xl font-semibold text-white">
            {user.registrations[0]
              ? trackNames[user.registrations[0].trackId]
              : 'NO DATA'}
          </p>
        </Card>
      </div>

      <Card className="space-y-4 motion-safe:animate-reveal-up [animation-delay:220ms]">
        <h3 className="mono text-lg font-bold text-white">Последние компетенции</h3>

        {user.registrations.length ? (
          <div className="space-y-3">
            {user.registrations.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="track">{trackNames[entry.trackId]}</Badge>
                  <Badge variant="neutral">{entry.level}</Badge>
                </div>
                <p className="mono text-xs text-zinc-300">{formatDateTime(entry.date)}</p>
                <p className="mono text-xs text-red-400">+{entry.points} PTS</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Пока нет регистраций. Откройте нужную компетенцию и нажмите регистрацию.
          </p>
        )}
      </Card>
    </div>
  )
}
