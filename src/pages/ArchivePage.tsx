import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'
import { trackNames } from '../data/tracks'
import { useArchives } from '../hooks/useArchives'
import { formatDateTime } from '../utils/date'

export const ArchivePage = () => {
  const { archives, loading, error } = useArchives()

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Архив"
        title="Архив соревнований"
        description="Прошедшие мероприятия, итоги и прикрепленные материалы."
      />

      {loading ? <Card>Загрузка архива...</Card> : null}

      {error ? (
        <Card className="border border-red-700/80 bg-red-700/10 text-red-200">
          Не удалось загрузить архив: {error}
        </Card>
      ) : null}

      {!loading && !error && archives.length === 0 ? (
        <Card className="border border-zinc-700 bg-black/70 text-zinc-300">
          Архив пока пуст. Записи появятся после публикации администратором.
        </Card>
      ) : null}

      {!loading && !error && archives.length > 0 ? (
        <div className="grid gap-4">
          {archives.map((entry) => (
            <Card key={entry.id} className="space-y-3">
              <p className="mono text-xs text-red-400">
                {trackNames[entry.event.track]} / {entry.event.level} /{' '}
                {formatDateTime(entry.event.date)}
              </p>

              <h3 className="text-xl font-semibold text-white">{entry.event.title}</h3>
              <p className="text-sm text-zinc-400">{entry.event.description}</p>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-none border border-zinc-800 bg-black/55 p-3">
                  <p className="mono text-[11px] text-red-300">Summary</p>
                  <p className="mt-2 text-zinc-200">{entry.summary}</p>
                </div>
                <div className="rounded-none border border-zinc-800 bg-black/55 p-3">
                  <p className="mono text-[11px] text-red-300">Materials</p>
                  {entry.materials.length ? (
                    <ul className="mt-2 space-y-1 text-zinc-200">
                      {entry.materials.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-zinc-400">Без приложенных материалов</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
