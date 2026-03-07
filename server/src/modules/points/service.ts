import { PointActionType, Prisma } from '@prisma/client'
import { prisma } from '../../db.js'

const ALMATY_TIMEZONE = 'Asia/Almaty'

const AUTO_POINT_RULES = {
  LOGIN_DAILY: {
    points: 5,
    reason: 'Ежедневный вход в систему',
  },
  EVENT_REGISTRATION: {
    points: 25,
    reason: 'Подтверждена запись на соревнование',
  },
  TELEGRAM_LINK: {
    points: 15,
    reason: 'Привязка Telegram для уведомлений',
  },
} as const

export interface UserRegistrationPointsDto {
  id: string
  trackId: 'cybersecurity' | 'networks' | 'devops' | 'sysadmin'
  level: 'Junior' | 'Middle' | 'Senior'
  points: number
  date: string
}

export interface UserPointHistoryEntryDto {
  id: string
  actionType: 'adminManual' | 'loginDaily' | 'eventRegistration' | 'telegramLink'
  points: number
  reason: string
  date: string
  eventTitle: string | null
}

export interface UserPointsSnapshotDto {
  totalPoints: number
  registrations: UserRegistrationPointsDto[]
  pointHistory: UserPointHistoryEntryDto[]
}

export interface EventLiveStatsDto {
  participantsCount: number
  totalPointsAwarded: number
  topParticipants: Array<{
    userId: string
    username: string
    points: number
  }>
}

export interface AdminPointRuleDto {
  key: 'LOGIN_DAILY' | 'EVENT_REGISTRATION' | 'TELEGRAM_LINK'
  title: string
  points: number
  description: string
}

const ADMIN_POINT_RULES: AdminPointRuleDto[] = [
  {
    key: 'LOGIN_DAILY',
    title: 'Ежедневный вход',
    points: AUTO_POINT_RULES.LOGIN_DAILY.points,
    description: 'Начисляется один раз в сутки при успешной авторизации.',
  },
  {
    key: 'EVENT_REGISTRATION',
    title: 'Регистрация на событие',
    points: AUTO_POINT_RULES.EVENT_REGISTRATION.points,
    description: 'Начисляется один раз за каждое подтвержденное соревнование.',
  },
  {
    key: 'TELEGRAM_LINK',
    title: 'Привязка Telegram',
    points: AUTO_POINT_RULES.TELEGRAM_LINK.points,
    description: 'Единоразовое начисление после успешной привязки бота.',
  },
]

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ALMATY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

const toActionTypeDto = (
  value: PointActionType,
): UserPointHistoryEntryDto['actionType'] => {
  if (value === PointActionType.LOGIN_DAILY) {
    return 'loginDaily'
  }
  if (value === PointActionType.EVENT_REGISTRATION) {
    return 'eventRegistration'
  }
  if (value === PointActionType.TELEGRAM_LINK) {
    return 'telegramLink'
  }
  return 'adminManual'
}

const buildDailyLoginDedupeKey = (userId: string, date = new Date()) =>
  `login-daily:${userId}:${dateKeyFormatter.format(date)}`

const buildEventRegistrationDedupeKey = (userId: string, eventId: string) =>
  `event-registration:${userId}:${eventId}`

const buildTelegramLinkDedupeKey = (userId: string) => `telegram-link:${userId}`

const createPointEntry = async (params: {
  userId: string
  points: number
  reason: string
  actionType: PointActionType
  createdById?: string
  eventId?: string
  dedupeKey?: string
}) => {
  if (!Number.isInteger(params.points) || params.points === 0) {
    throw new Error('INVALID_POINTS')
  }

  const trimmedReason = params.reason.trim()
  if (!trimmedReason) {
    throw new Error('INVALID_REASON')
  }

  try {
    const entry = await prisma.userPointEntry.create({
      data: {
        userId: params.userId,
        createdById: params.createdById ?? null,
        eventId: params.eventId ?? null,
        actionType: params.actionType,
        points: params.points,
        reason: trimmedReason,
        dedupeKey: params.dedupeKey ?? null,
      },
    })

    return {
      created: true as const,
      entry,
    }
  } catch (error) {
    if (params.dedupeKey && isUniqueConstraintError(error)) {
      return {
        created: false as const,
        entry: null,
      }
    }
    throw error
  }
}

export const listAdminPointRules = () => ADMIN_POINT_RULES

export const grantAdminManualPoints = async (params: {
  adminUserId: string
  userId: string
  points: number
  reason: string
  eventId?: string
}) => {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  if (params.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: { id: true },
    })
    if (!event) {
      throw new Error('EVENT_NOT_FOUND')
    }
  }

  const result = await createPointEntry({
    userId: params.userId,
    createdById: params.adminUserId,
    eventId: params.eventId,
    actionType: PointActionType.ADMIN_MANUAL,
    points: params.points,
    reason: params.reason,
  })

  if (!result.entry) {
    throw new Error('POINT_ENTRY_NOT_CREATED')
  }

  return result.entry
}

export const grantDailyLoginPoints = async (userId: string) =>
  createPointEntry({
    userId,
    actionType: PointActionType.LOGIN_DAILY,
    points: AUTO_POINT_RULES.LOGIN_DAILY.points,
    reason: AUTO_POINT_RULES.LOGIN_DAILY.reason,
    dedupeKey: buildDailyLoginDedupeKey(userId),
  })

export const grantEventRegistrationPoints = async (params: {
  userId: string
  eventId: string
}) =>
  createPointEntry({
    userId: params.userId,
    eventId: params.eventId,
    actionType: PointActionType.EVENT_REGISTRATION,
    points: AUTO_POINT_RULES.EVENT_REGISTRATION.points,
    reason: AUTO_POINT_RULES.EVENT_REGISTRATION.reason,
    dedupeKey: buildEventRegistrationDedupeKey(params.userId, params.eventId),
  })

export const grantTelegramLinkPoints = async (userId: string) =>
  createPointEntry({
    userId,
    actionType: PointActionType.TELEGRAM_LINK,
    points: AUTO_POINT_RULES.TELEGRAM_LINK.points,
    reason: AUTO_POINT_RULES.TELEGRAM_LINK.reason,
    dedupeKey: buildTelegramLinkDedupeKey(userId),
  })

export const getUsersPointTotals = async (userIds?: string[]) => {
  const rows = await prisma.userPointEntry.groupBy({
    by: ['userId'],
    where: userIds?.length ? { userId: { in: userIds } } : undefined,
    _sum: {
      points: true,
    },
  })

  return new Map(
    rows.map((row) => [row.userId, row._sum.points ?? 0] as const),
  )
}

export const getUserPointsSnapshot = async (userId: string): Promise<UserPointsSnapshotDto> => {
  const [total, registrations, pointHistory] = await Promise.all([
    prisma.userPointEntry.aggregate({
      where: { userId },
      _sum: {
        points: true,
      },
    }),
    prisma.eventRegistration.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            track: true,
            level: true,
          },
        },
      },
      take: 30,
    }),
    prisma.userPointEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
      take: 40,
    }),
  ])

  const registrationEventIds = registrations.map((registration) => registration.eventId)

  const registrationPointRows = registrationEventIds.length
    ? await prisma.userPointEntry.findMany({
        where: {
          userId,
          actionType: PointActionType.EVENT_REGISTRATION,
          eventId: { in: registrationEventIds },
        },
        select: {
          eventId: true,
          points: true,
        },
      })
    : []

  const registrationPointsByEvent = registrationPointRows.reduce((accumulator, row) => {
    if (!row.eventId) {
      return accumulator
    }
    accumulator.set(row.eventId, (accumulator.get(row.eventId) ?? 0) + row.points)
    return accumulator
  }, new Map<string, number>())

  return {
    totalPoints: total._sum.points ?? 0,
    registrations: registrations.map((registration) => ({
      id: registration.id,
      trackId: registration.event.track,
      level: registration.event.level,
      points: registrationPointsByEvent.get(registration.eventId) ?? 0,
      date: registration.createdAt.toISOString(),
    })),
    pointHistory: pointHistory.map((entry) => ({
      id: entry.id,
      actionType: toActionTypeDto(entry.actionType),
      points: entry.points,
      reason: entry.reason,
      date: entry.createdAt.toISOString(),
      eventTitle: entry.event?.title ?? null,
    })),
  }
}

export const getEventLiveStats = async (eventId: string): Promise<EventLiveStatsDto> => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  })

  if (!event) {
    throw new Error('EVENT_NOT_FOUND')
  }

  const participantsCount = await prisma.eventRegistration.count({
    where: { eventId },
  })

  const total = await prisma.userPointEntry.aggregate({
    where: { eventId },
    _sum: {
      points: true,
    },
  })

  const grouped = await prisma.userPointEntry.groupBy({
    by: ['userId'],
    where: { eventId },
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: 'desc',
      },
    },
    take: 8,
  })

  const userIds = grouped.map((row) => row.userId)
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
        },
      })
    : []

  const usernameById = new Map(users.map((user) => [user.id, user.username] as const))

  return {
    participantsCount,
    totalPointsAwarded: total._sum.points ?? 0,
    topParticipants: grouped.map((row) => ({
      userId: row.userId,
      username: usernameById.get(row.userId) ?? 'unknown',
      points: row._sum.points ?? 0,
    })),
  }
}
