export interface ArchiveSection {
  title: string
  description: string
}

export const archiveSections: ArchiveSection[] = [
  {
    title: 'Прошедшие ивенты',
    description:
      'Дата, направление, уровень, участники и итоговые результаты команд.',
  },
  {
    title: 'Разборы',
    description:
      'После каждого мероприятия публикуется разбор решений Blue и Red Team.',
  },
  {
    title: 'Материалы',
    description:
      'Чеклисты, полезные ссылки, сниппеты конфигураций и краткие гайды.',
  },
]

export const archiveRecordShape = {
  id: 'archive-2026-03-cyber-jr',
  eventId: 'event-2026-03-04-cyber-jr',
  summary: 'Краткий итог мероприятия',
  materials: ['slides.pdf', 'pcap-lab.zip', 'writeup.md'],
}
