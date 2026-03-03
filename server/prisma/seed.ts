import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedEvents = [
  {
    id: '9ed4dc84-bfab-4b11-a1f4-c47d4b17e8b1',
    track: 'cybersecurity',
    level: 'Junior',
    title: 'CyberSecurity Day: логи и базовая защита',
    duration: '2 ч 30 мин',
    location: 'Lab B-204',
    description:
      'Вводный формат Blue vs Red: анализ событий, базовый hardening и короткий разбор.',
    startsAt: '2026-03-04T16:00:00+05:00',
  },
  {
    id: 'bd0db4c4-8f0b-4742-a357-f96396a85d4b',
    track: 'cybersecurity',
    level: 'Middle',
    title: 'CyberSecurity Practice: incident triage',
    duration: '3 ч',
    location: 'Lab B-204',
    description:
      'Middle-сценарий: корреляция логов, изоляция инцидента и оформленный отчет.',
    startsAt: '2026-03-06T16:30:00+05:00',
  },
  {
    id: '740ca5ee-45b4-4d98-9f05-adf03ad084f8',
    track: 'networks',
    level: 'Junior',
    title: 'Network Day: VLAN и базовая диагностика',
    duration: '2 ч',
    location: 'Lab N-101',
    description:
      'Старт в сетевом треке: связность, маршруты, доступ между сегментами.',
    startsAt: '2026-03-11T16:00:00+05:00',
  },
  {
    id: '47953f26-bb4f-44a7-a281-14bef2fd2870',
    track: 'networks',
    level: 'Senior',
    title: 'Network Stress Lab: отказоустойчивая схема',
    duration: '3 ч 30 мин',
    location: 'Lab N-101',
    description:
      'Старший уровень: сложный инцидент маршрутизации и восстановление сервиса.',
    startsAt: '2026-03-13T17:00:00+05:00',
  },
  {
    id: 'e30f0ca0-4bfa-4f60-b32a-99d244de0304',
    track: 'devops',
    level: 'Middle',
    title: 'DevOps Day: CI/CD и мониторинг',
    duration: '2 ч 45 мин',
    location: 'Lab D-302',
    description:
      'Практика по пайплайнам: автоматические проверки, наблюдаемость и rollback.',
    startsAt: '2026-03-18T16:00:00+05:00',
  },
  {
    id: '48be3446-472a-47bf-b15d-8abfaed6df05',
    track: 'devops',
    level: 'Senior',
    title: 'DevOps Senior Lab: resilient deploy',
    duration: '3 ч 30 мин',
    location: 'Lab D-302',
    description:
      'Старший трек: безопасный релиз нескольких сервисов и пост-инцидентный разбор.',
    startsAt: '2026-03-20T16:30:00+05:00',
  },
  {
    id: '0ca34052-d099-4ece-9b01-98cfa2da7b67',
    track: 'sysadmin',
    level: 'Junior',
    title: 'SysAdmin Day: сервисы и логи',
    duration: '2 ч 15 мин',
    location: 'Lab S-112',
    description:
      'Junior-сценарий: базовое администрирование хоста, troubleshooting и отчеты.',
    startsAt: '2026-03-25T16:00:00+05:00',
  },
  {
    id: 'c2de984b-fd67-495c-975b-73457cb7632f',
    track: 'sysadmin',
    level: 'Middle',
    title: 'SysAdmin Operations: backup/restore',
    duration: '3 ч',
    location: 'Lab S-112',
    description:
      'Проверка стратегии резервирования и восстановление сервиса после сбоя.',
    startsAt: '2026-03-27T16:30:00+05:00',
  },
  {
    id: 'a82f3e15-89dc-4ea4-b4b2-91c8a4ca2c65',
    track: 'cybersecurity',
    level: 'Senior',
    title: 'CyberSecurity Senior: threat modeling sprint',
    duration: '3 ч',
    location: 'Lab B-204',
    description:
      'Продвинутый раунд Blue vs Red с multi-stage сценарием в учебном полигоне.',
    startsAt: '2026-04-01T16:00:00+05:00',
  },
  {
    id: 'ffc7cb8d-8c91-4b85-9ff3-2c1975ddf2f4',
    track: 'networks',
    level: 'Middle',
    title: 'Network Day: routing under pressure',
    duration: '2 ч 45 мин',
    location: 'Lab N-101',
    description:
      'Промежуточный уровень: анализ деградации каналов и сетевой hardening.',
    startsAt: '2026-04-08T16:00:00+05:00',
  },
  {
    id: '0c42d05a-6f8d-41fa-b55f-890ea0f86e8a',
    track: 'devops',
    level: 'Junior',
    title: 'DevOps Day: from commit to deploy',
    duration: '2 ч 30 мин',
    location: 'Lab D-302',
    description:
      'Первый шаг в DevOps: контейнеризация, простой pipeline и контроль качества.',
    startsAt: '2026-04-15T16:00:00+05:00',
  },
  {
    id: '5cbe53b0-9910-4a47-8b2f-0cb46f4db66b',
    track: 'sysadmin',
    level: 'Senior',
    title: 'SysAdmin Senior: availability challenge',
    duration: '3 ч 15 мин',
    location: 'Lab S-112',
    description:
      'Комплексный сценарий отказа сервиса, восстановление и итоговый разбор.',
    startsAt: '2026-04-22T17:00:00+05:00',
  },
] as const

const main = async () => {
  await prisma.archiveEntry.deleteMany()
  await prisma.event.deleteMany()

  for (const item of seedEvents) {
    await prisma.event.create({
      data: {
        id: item.id,
        track: item.track,
        level: item.level,
        title: item.title,
        duration: item.duration,
        location: item.location,
        description: item.description,
        startsAt: new Date(item.startsAt),
      },
    })
  }

  console.log(`Seed complete: ${seedEvents.length} events`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
