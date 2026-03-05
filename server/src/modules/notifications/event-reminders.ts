import {
  NotificationDeliveryStatus,
  RegistrationContactType,
  type TrackId,
  type Level,
} from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../db.js'
import { sendNotification } from './service.js'

const REMINDER_LOOKAHEAD_MS = 24 * 60 * 60 * 1000
const REMINDER_BATCH_SIZE = 200

const trackNameMap: Record<TrackId, string> = {
  cybersecurity: 'CyberSecurity',
  networks: 'Networks',
  devops: 'DevOps',
  sysadmin: 'SysAdmin',
}

const levelNameMap: Record<Level, string> = {
  Junior: 'Junior',
  Middle: 'Middle',
  Senior: 'Senior',
}

const toNotificationStatus = (value: 'sent' | 'failed' | 'skipped') => {
  if (value === 'sent') {
    return NotificationDeliveryStatus.SENT
  }
  if (value === 'skipped') {
    return NotificationDeliveryStatus.SKIPPED
  }
  return NotificationDeliveryStatus.FAILED
}

const formatReminderDateTime = (value: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Almaty',
  }).format(value)

const buildReminderMessage = (params: {
  title: string
  track: TrackId
  level: Level
  startsAt: Date
  detailsUrl: string
}) =>
  [
    'POLYTECH IT ARENA',
    '',
    'Напоминание: до начала соревнования осталось меньше суток.',
    `Соревнование: ${params.title}`,
    `Трек: ${trackNameMap[params.track]} / ${levelNameMap[params.level]}`,
    `Старт: ${formatReminderDateTime(params.startsAt)}`,
    'Успей подготовиться.',
    `Детали: ${params.detailsUrl}`,
  ].join('\n')

const getReminderCandidates = async () => {
  const now = new Date()
  const lookahead = new Date(now.getTime() + REMINDER_LOOKAHEAD_MS)

  return prisma.eventRegistration.findMany({
    where: {
      contactType: RegistrationContactType.TELEGRAM,
      reminderSentAt: null,
      event: {
        startsAt: {
          gt: now,
          lte: lookahead,
        },
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          track: true,
          level: true,
          startsAt: true,
          registrationLink: true,
        },
      },
    },
    orderBy: {
      event: {
        startsAt: 'asc',
      },
    },
    take: REMINDER_BATCH_SIZE,
  })
}

export const processEventReminders = async () => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return
  }

  const candidates = await getReminderCandidates()
  for (const registration of candidates) {
    const detailsUrl =
      registration.event.registrationLink?.trim() ||
      `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/calendar?register=${encodeURIComponent(registration.event.id)}`

    const message = buildReminderMessage({
      title: registration.event.title,
      track: registration.event.track,
      level: registration.event.level,
      startsAt: registration.event.startsAt,
      detailsUrl,
    })

    const result = await sendNotification('telegram', registration.contactValue, message)

    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        reminderStatus: toNotificationStatus(result.status),
        reminderProvider: result.provider,
        reminderMessageId: result.providerMessageId,
        reminderError: result.error,
        reminderSentAt: new Date(),
      },
    })
  }
}

export const startEventReminderWorker = () => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return () => undefined
  }

  let stopped = false
  let inFlight = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = async () => {
    if (stopped || inFlight) {
      return
    }

    inFlight = true
    try {
      await processEventReminders()
    } finally {
      inFlight = false
      if (!stopped) {
        timer = setTimeout(() => {
          void tick()
        }, env.EVENT_REMINDER_INTERVAL_MS)
      }
    }
  }

  void tick()

  return () => {
    stopped = true
    if (timer) {
      clearTimeout(timer)
    }
  }
}

