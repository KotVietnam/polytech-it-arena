import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'

const coreRules = [
  'Работа только в учебном стенде/полигоне, выделенном для мероприятия.',
  'Запрещено трогать реальную сеть и сервисы колледжа.',
  'Запрещены DoS-атаки по железу и любые действия, которые вредят инфраструктуре.',
  'Команды уважают друг друга: без токсичного поведения и саботажа.',
  'Все действия фиксируются в логах и учитываются при разборе.',
  'После мероприятия публикуется разбор решений и ошибок.',
]

const processRules = [
  'Перед стартом подтверждается зона ответственности и границы полигона.',
  'Blue и Red команды обязаны документировать ключевые шаги.',
  'При спорной ситуации решение принимает ментор смены.',
  'Материалы соревнования остаются внутри учебного процесса клуба.',
]

export const RulesPage = () => (
  <div className="space-y-6">
    <SectionTitle
      eyebrow="Правила"
      title="Этика и безопасность клуба"
      description="Правила короткие, но обязательные для каждого участника."
    />

    <Card className="space-y-4">
      <h3 className="font-heading text-xl font-semibold text-text">Базовые правила</h3>
      <ul className="space-y-2 text-sm leading-relaxed text-muted">
        {coreRules.map((rule) => (
          <li
            key={rule}
            className="rounded-xl border border-line/20 bg-surface/60 px-3 py-2"
          >
            {rule}
          </li>
        ))}
      </ul>
    </Card>

    <Card className="space-y-4">
      <h3 className="font-heading text-xl font-semibold text-text">
        Как проходит мероприятие
      </h3>
      <ul className="space-y-2 text-sm leading-relaxed text-muted">
        {processRules.map((rule) => (
          <li
            key={rule}
            className="rounded-xl border border-line/20 bg-surface/60 px-3 py-2"
          >
            {rule}
          </li>
        ))}
      </ul>
    </Card>

    <Card className="border border-rose-300/30 bg-rose-300/10 text-sm text-rose-100">
      Любые атаки вне полигона, попытки затронуть реальную сеть колледжа и
      действия, создающие риск для инфраструктуры, строго запрещены.
    </Card>
  </div>
)
