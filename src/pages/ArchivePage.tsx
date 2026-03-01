import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'
import { archiveRecordShape, archiveSections } from '../data/archive'

export const ArchivePage = () => (
  <div className="space-y-6">
    <SectionTitle
      eyebrow="Архив"
      title="Скоро здесь появятся материалы"
      description="Страница подготовлена заранее: структура уже есть, данные добавим после первых прошедших ивентов."
    />

    <Card className="border border-red-700/80 bg-red-700/10">
      <p className="text-lg font-semibold text-text">
        Архив пока пуст, но формат уже определен.
      </p>
      <p className="mt-2 text-sm text-muted">
        После каждого завершенного мероприятия будут публиковаться результаты,
        разборы и материалы.
      </p>
    </Card>

    <div className="grid gap-4 md:grid-cols-3">
      {archiveSections.map((section) => (
        <Card key={section.title} className="space-y-2">
          <h3 className="font-heading text-lg font-semibold text-text">
            {section.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted">{section.description}</p>
        </Card>
      ))}
    </div>

    <Card className="space-y-3">
      <h3 className="font-heading text-lg font-semibold text-text">
        Пример структуры записи
      </h3>
      <pre className="overflow-x-auto rounded-xl border border-line/20 bg-surface/65 p-3 text-xs text-muted">
        {JSON.stringify(archiveRecordShape, null, 2)}
      </pre>
    </Card>
  </div>
)
