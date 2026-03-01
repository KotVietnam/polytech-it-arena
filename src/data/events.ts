import type { EventItem } from '../types'

export const eventsArePlaceholders = true

export const events: EventItem[] = [
  {
    id: 'event-2026-03-04-cyber-jr',
    date: '2026-03-04T16:00:00+05:00',
    track: 'cybersecurity',
    level: 'Junior',
    title: 'CyberSecurity Day: логи и базовая защита',
    duration: '2 ч 30 мин',
    location: 'Lab B-204',
    description:
      'Вводный формат Blue vs Red: анализ событий, базовый hardening и короткий разбор.',
  },
  {
    id: 'event-2026-03-06-cyber-mid',
    date: '2026-03-06T16:30:00+05:00',
    track: 'cybersecurity',
    level: 'Middle',
    title: 'CyberSecurity Practice: incident triage',
    duration: '3 ч',
    location: 'Lab B-204',
    description:
      'Middle-сценарий: корреляция логов, изоляция инцидента и оформленный отчет.',
  },
  {
    id: 'event-2026-03-11-network-jr',
    date: '2026-03-11T16:00:00+05:00',
    track: 'networks',
    level: 'Junior',
    title: 'Network Day: VLAN и базовая диагностика',
    duration: '2 ч',
    location: 'Lab N-101',
    description:
      'Старт в сетевом треке: связность, маршруты, доступ между сегментами.',
  },
  {
    id: 'event-2026-03-13-network-sr',
    date: '2026-03-13T17:00:00+05:00',
    track: 'networks',
    level: 'Senior',
    title: 'Network Stress Lab: отказоустойчивая схема',
    duration: '3 ч 30 мин',
    location: 'Lab N-101',
    description:
      'Старший уровень: сложный инцидент маршрутизации и восстановление сервиса.',
  },
  {
    id: 'event-2026-03-18-devops-mid',
    date: '2026-03-18T16:00:00+05:00',
    track: 'devops',
    level: 'Middle',
    title: 'DevOps Day: CI/CD и мониторинг',
    duration: '2 ч 45 мин',
    location: 'Lab D-302',
    description:
      'Практика по пайплайнам: автоматические проверки, наблюдаемость и rollback.',
  },
  {
    id: 'event-2026-03-20-devops-sr',
    date: '2026-03-20T16:30:00+05:00',
    track: 'devops',
    level: 'Senior',
    title: 'DevOps Senior Lab: resilient deploy',
    duration: '3 ч 30 мин',
    location: 'Lab D-302',
    description:
      'Старший трек: безопасный релиз нескольких сервисов и пост-инцидентный разбор.',
  },
  {
    id: 'event-2026-03-25-sysadmin-jr',
    date: '2026-03-25T16:00:00+05:00',
    track: 'sysadmin',
    level: 'Junior',
    title: 'SysAdmin Day: сервисы и логи',
    duration: '2 ч 15 мин',
    location: 'Lab S-112',
    description:
      'Junior-сценарий: базовое администрирование хоста, troubleshooting и отчеты.',
  },
  {
    id: 'event-2026-03-27-sysadmin-mid',
    date: '2026-03-27T16:30:00+05:00',
    track: 'sysadmin',
    level: 'Middle',
    title: 'SysAdmin Operations: backup/restore',
    duration: '3 ч',
    location: 'Lab S-112',
    description:
      'Проверка стратегии резервирования и восстановление сервиса после сбоя.',
  },
  {
    id: 'event-2026-04-01-cyber-sr',
    date: '2026-04-01T16:00:00+05:00',
    track: 'cybersecurity',
    level: 'Senior',
    title: 'CyberSecurity Senior: threat modeling sprint',
    duration: '3 ч',
    location: 'Lab B-204',
    description:
      'Продвинутый раунд Blue vs Red с multi-stage сценарием в учебном полигоне.',
  },
  {
    id: 'event-2026-04-08-network-mid',
    date: '2026-04-08T16:00:00+05:00',
    track: 'networks',
    level: 'Middle',
    title: 'Network Day: routing under pressure',
    duration: '2 ч 45 мин',
    location: 'Lab N-101',
    description:
      'Промежуточный уровень: анализ деградации каналов и сетевой hardening.',
  },
  {
    id: 'event-2026-04-15-devops-jr',
    date: '2026-04-15T16:00:00+05:00',
    track: 'devops',
    level: 'Junior',
    title: 'DevOps Day: from commit to deploy',
    duration: '2 ч 30 мин',
    location: 'Lab D-302',
    description:
      'Первый шаг в DevOps: контейнеризация, простой pipeline и контроль качества.',
  },
  {
    id: 'event-2026-04-22-sysadmin-sr',
    date: '2026-04-22T17:00:00+05:00',
    track: 'sysadmin',
    level: 'Senior',
    title: 'SysAdmin Senior: availability challenge',
    duration: '3 ч 15 мин',
    location: 'Lab S-112',
    description:
      'Комплексный сценарий отказа сервиса, восстановление и итоговый разбор.',
  },
]
