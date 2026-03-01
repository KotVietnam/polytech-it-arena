import { Card } from '../components/Card'
import { SectionTitle } from '../components/SectionTitle'

const setupItems = ['Linux VM / WSL', 'Git', 'SSH client', 'Wireshark']

const glossary = [
  {
    term: 'VLAN',
    definition:
      'Логическое разделение сети на сегменты для изоляции трафика и контроля доступа.',
  },
  {
    term: 'Порт',
    definition:
      'Точка сетевого взаимодействия сервиса. Номер порта определяет тип подключения.',
  },
  {
    term: 'Firewall',
    definition:
      'Правила фильтрации трафика, которые разрешают или блокируют соединения.',
  },
  {
    term: 'Контейнер',
    definition:
      'Изолированная среда запуска приложения с предсказуемыми зависимостями.',
  },
  {
    term: 'Лог',
    definition:
      'Журнал событий системы или приложения, необходимый для анализа и расследований.',
  },
  {
    term: 'Сервис',
    definition:
      'Фоновый процесс, который предоставляет функциональность в сети или на хосте.',
  },
]

const firstEventChecklist = [
  'Поставь Linux VM или WSL и проверь работу терминала.',
  'Установи Git, создай учебный репозиторий и сделай первый commit.',
  'Проверь доступ по SSH в тестовую машину.',
  'Установи Wireshark и открой тестовый pcap-файл.',
  'Прочитай правила клуба до первого Junior-ивента.',
]

export const NewcomersPage = () => (
  <div className="space-y-6">
    <SectionTitle
      eyebrow="Новичкам"
      title="Быстрый старт для Junior"
      description="Минимальный набор инструментов и знаний перед первым мероприятием."
    />

    <Card className="space-y-4">
      <h3 className="font-heading text-xl font-semibold text-text">Что поставить</h3>
      <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2">
        {setupItems.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-line/20 bg-surface/60 px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </Card>

    <Card className="space-y-4">
      <h3 className="font-heading text-xl font-semibold text-text">Мини-глоссарий</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {glossary.map((entry) => (
          <div
            key={entry.term}
            className="rounded-xl border border-line/20 bg-surface/60 p-3"
          >
            <p className="font-semibold text-text">{entry.term}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {entry.definition}
            </p>
          </div>
        ))}
      </div>
    </Card>

    <Card className="space-y-4">
      <h3 className="font-heading text-xl font-semibold text-text">
        Чеклист перед первым Junior-ивентом
      </h3>
      <ul className="space-y-2 text-sm text-muted">
        {firstEventChecklist.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-line/20 bg-surface/60 px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </Card>
  </div>
)
