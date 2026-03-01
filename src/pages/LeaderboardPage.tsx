import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'
import { useAuth } from '../context/AuthContext'
import { baseLeaderboard } from '../data/leaderboard'
import { trackNames } from '../data/tracks'

interface LeaderRow {
  username: string
  points: number
  lastTrack: string
  isCurrentUser?: boolean
}

export const LeaderboardPage = () => {
  const { user } = useAuth()

  const rows: LeaderRow[] = [...baseLeaderboard]

  if (user) {
    rows.push({
      username: user.username,
      points: user.totalPoints,
      lastTrack: user.registrations[0]
        ? trackNames[user.registrations[0].trackId]
        : 'NO DATA',
      isCurrentUser: true,
    })
  }

  const sortedRows = rows.sort((a, b) => b.points - a.points)

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Leaderboard"
        title="Таблица лидеров"
        description="Рейтинг участников по сумме баллов. Баллы начисляются за регистрации и участие в треках."
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="mono border-b border-red-700 bg-red-700/10 text-xs text-red-300">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Last Competency</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => (
              <tr
                key={`${row.username}-${index}`}
                style={{ animationDelay: `${index * 70}ms` }}
                className={
                  row.isCurrentUser
                    ? 'motion-safe:animate-reveal-up border-b border-zinc-800 bg-red-700/15'
                    : 'motion-safe:animate-reveal-up border-b border-zinc-800'
                }
              >
                <td className="mono px-4 py-3 text-xs text-zinc-300">#{index + 1}</td>
                <td className="px-4 py-3 text-sm text-white">
                  {row.username}
                  {row.isCurrentUser ? (
                    <span className="mono ml-2 text-[11px] text-red-400">YOU</span>
                  ) : null}
                </td>
                <td className="mono px-4 py-3 text-xs text-red-300">{row.points}</td>
                <td className="mono px-4 py-3 text-xs text-zinc-300">{row.lastTrack}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
