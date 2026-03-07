import { LiveTeam, LiveTimerStatus } from '@prisma/client'
import { prisma } from '../../db.js'

export interface LiveTeamParticipantDto {
  registrationId: string
  userId: string | null
  name: string
}

export interface LiveScoreActionDto {
  id: string
  team: 'blue' | 'red'
  points: number
  reason: string
  judgeUsername: string | null
  createdAt: string
}

export type LiveTimerStatusDto = 'idle' | 'running' | 'paused' | 'break'

export interface EventLiveSnapshotDto {
  eventId: string
  hasDraw: boolean
  participantsCount: number
  timer: {
    status: LiveTimerStatusDto
    elapsedSeconds: number
    startedAt: string | null
  }
  teams: Array<{
    id: 'blue' | 'red'
    name: string
    score: number
    participantsCount: number
    participants: LiveTeamParticipantDto[]
  }>
  recentActions: LiveScoreActionDto[]
}

export type LiveTimerAction = 'START' | 'PAUSE' | 'BREAK' | 'RESUME' | 'RESET'

const normalizeParticipantName = (participant: {
  userId: string | null
  guestFullName: string | null
  guestTelegramTag: string | null
  contactValue: string
  user: {
    username: string
    displayName: string | null
  } | null
}) => {
  if (participant.user) {
    return participant.user.displayName?.trim() || participant.user.username
  }

  return (
    participant.guestFullName?.trim() ||
    participant.guestTelegramTag?.trim() ||
    participant.contactValue
  )
}

const toTeamDtoId = (team: LiveTeam): 'blue' | 'red' =>
  team === LiveTeam.BLUE ? 'blue' : 'red'

const toTimerStatusDto = (status: LiveTimerStatus): LiveTimerStatusDto => {
  switch (status) {
    case LiveTimerStatus.RUNNING:
      return 'running'
    case LiveTimerStatus.PAUSED:
      return 'paused'
    case LiveTimerStatus.BREAK:
      return 'break'
    case LiveTimerStatus.IDLE:
    default:
      return 'idle'
  }
}

const shuffle = <T,>(items: T[]) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temp = copy[index]
    copy[index] = copy[randomIndex]
    copy[randomIndex] = temp
  }
  return copy
}

const ensureEventExists = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  })

  if (!event) {
    throw new Error('EVENT_NOT_FOUND')
  }
}

const getOrCreateLiveMatch = async (eventId: string, createdById?: string) =>
  prisma.eventLiveMatch.upsert({
    where: { eventId },
    update: {},
    create: {
      eventId,
      createdById: createdById ?? null,
    },
    select: {
      id: true,
      eventId: true,
      timerStatus: true,
      timerElapsedSeconds: true,
      timerLastStartedAt: true,
    },
  })

const calculateElapsedSeconds = (
  match: {
    timerStatus: LiveTimerStatus
    timerElapsedSeconds: number
    timerLastStartedAt: Date | null
  },
  now: Date,
) => {
  if (match.timerStatus !== LiveTimerStatus.RUNNING || !match.timerLastStartedAt) {
    return Math.max(0, match.timerElapsedSeconds)
  }

  const deltaSeconds = Math.max(
    0,
    Math.floor((now.getTime() - match.timerLastStartedAt.getTime()) / 1000),
  )
  return Math.max(0, match.timerElapsedSeconds + deltaSeconds)
}

export const getEventLiveSnapshot = async (eventId: string): Promise<EventLiveSnapshotDto> => {
  await ensureEventExists(eventId)

  const participantsCount = await prisma.eventRegistration.count({
    where: { eventId },
  })

  const match = await prisma.eventLiveMatch.findUnique({
    where: { eventId },
    select: {
      id: true,
      timerStatus: true,
      timerElapsedSeconds: true,
      timerLastStartedAt: true,
      assignments: {
        include: {
          registration: {
            select: {
              id: true,
              userId: true,
              guestFullName: true,
              guestTelegramTag: true,
              contactValue: true,
              user: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      },
      scoreEntries: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 16,
        select: {
          id: true,
          team: true,
          points: true,
          reason: true,
          createdAt: true,
          createdBy: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  })

  const blueParticipants: LiveTeamParticipantDto[] = []
  const redParticipants: LiveTeamParticipantDto[] = []
  let blueScore = 0
  let redScore = 0

  for (const assignment of match?.assignments ?? []) {
    const participant: LiveTeamParticipantDto = {
      registrationId: assignment.registration.id,
      userId: assignment.registration.userId,
      name: normalizeParticipantName(assignment.registration),
    }

    if (assignment.team === LiveTeam.BLUE) {
      blueParticipants.push(participant)
    } else {
      redParticipants.push(participant)
    }
  }

  for (const action of match?.scoreEntries ?? []) {
    if (action.team === LiveTeam.BLUE) {
      blueScore += action.points
    } else {
      redScore += action.points
    }
  }

  const now = new Date()
  const timerElapsedSeconds = match
    ? calculateElapsedSeconds(
        {
          timerStatus: match.timerStatus,
          timerElapsedSeconds: match.timerElapsedSeconds,
          timerLastStartedAt: match.timerLastStartedAt,
        },
        now,
      )
    : 0
  const timerStatus = match ? toTimerStatusDto(match.timerStatus) : 'idle'
  const timerStartedAt =
    match?.timerStatus === LiveTimerStatus.RUNNING && match.timerLastStartedAt
      ? match.timerLastStartedAt.toISOString()
      : null

  return {
    eventId,
    hasDraw: Boolean(match?.assignments.length),
    participantsCount,
    timer: {
      status: timerStatus,
      elapsedSeconds: timerElapsedSeconds,
      startedAt: timerStartedAt,
    },
    teams: [
      {
        id: 'blue',
        name: 'BLUE TEAM',
        score: blueScore,
        participantsCount: blueParticipants.length,
        participants: blueParticipants,
      },
      {
        id: 'red',
        name: 'RED TEAM',
        score: redScore,
        participantsCount: redParticipants.length,
        participants: redParticipants,
      },
    ],
    recentActions: (match?.scoreEntries ?? []).map((entry) => ({
      id: entry.id,
      team: toTeamDtoId(entry.team),
      points: entry.points,
      reason: entry.reason,
      judgeUsername: entry.createdBy?.username ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  }
}

export const drawLiveTeamsForEvent = async (params: {
  eventId: string
  createdById: string
}) => {
  await ensureEventExists(params.eventId)

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: params.eventId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  if (registrations.length < 2) {
    throw new Error('NOT_ENOUGH_PARTICIPANTS')
  }

  const match = await getOrCreateLiveMatch(params.eventId, params.createdById)
  const shuffled = shuffle(registrations)

  await prisma.$transaction([
    prisma.eventLiveMatch.update({
      where: { id: match.id },
      data: {
        timerStatus: LiveTimerStatus.IDLE,
        timerElapsedSeconds: 0,
        timerLastStartedAt: null,
      },
    }),
    prisma.eventLiveScoreEntry.deleteMany({
      where: { matchId: match.id },
    }),
    prisma.eventLiveTeamAssignment.deleteMany({
      where: { matchId: match.id },
    }),
    prisma.eventLiveTeamAssignment.createMany({
      data: shuffled.map((registration, index) => ({
        matchId: match.id,
        registrationId: registration.id,
        team: index % 2 === 0 ? LiveTeam.BLUE : LiveTeam.RED,
      })),
    }),
  ])

  return getEventLiveSnapshot(params.eventId)
}

export const addLiveScoreAction = async (params: {
  eventId: string
  createdById: string
  team: LiveTeam
  points: number
  reason: string
}) => {
  await ensureEventExists(params.eventId)

  const match = await getOrCreateLiveMatch(params.eventId, params.createdById)
  const assignmentCount = await prisma.eventLiveTeamAssignment.count({
    where: { matchId: match.id },
  })
  if (!assignmentCount) {
    throw new Error('DRAW_REQUIRED')
  }

  const normalizedReason = params.reason.trim()
  if (!normalizedReason) {
    throw new Error('INVALID_REASON')
  }

  if (!Number.isInteger(params.points) || params.points === 0) {
    throw new Error('INVALID_POINTS')
  }

  await prisma.eventLiveScoreEntry.create({
    data: {
      matchId: match.id,
      createdById: params.createdById,
      team: params.team,
      points: params.points,
      reason: normalizedReason,
    },
  })

  return getEventLiveSnapshot(params.eventId)
}

export const updateLiveTimerState = async (params: {
  eventId: string
  createdById: string
  action: LiveTimerAction
}) => {
  await ensureEventExists(params.eventId)

  const now = new Date()
  await prisma.$transaction(async (transaction) => {
    const match = await transaction.eventLiveMatch.upsert({
      where: { eventId: params.eventId },
      update: {},
      create: {
        eventId: params.eventId,
        createdById: params.createdById,
      },
      select: {
        id: true,
        timerStatus: true,
        timerElapsedSeconds: true,
        timerLastStartedAt: true,
      },
    })

    const assignmentCount = await transaction.eventLiveTeamAssignment.count({
      where: { matchId: match.id },
    })
    const requiresDraw =
      params.action === 'START' ||
      params.action === 'RESUME' ||
      params.action === 'PAUSE' ||
      params.action === 'BREAK'
    if (requiresDraw && assignmentCount < 2) {
      throw new Error('DRAW_REQUIRED')
    }

    const elapsedSeconds = calculateElapsedSeconds(match, now)
    if (params.action === 'RESET') {
      await transaction.eventLiveMatch.update({
        where: { id: match.id },
        data: {
          timerStatus: LiveTimerStatus.IDLE,
          timerElapsedSeconds: 0,
          timerLastStartedAt: null,
        },
      })
      return
    }

    if (params.action === 'START' || params.action === 'RESUME') {
      if (match.timerStatus === LiveTimerStatus.RUNNING) {
        return
      }

      await transaction.eventLiveMatch.update({
        where: { id: match.id },
        data: {
          timerStatus: LiveTimerStatus.RUNNING,
          timerElapsedSeconds: elapsedSeconds,
          timerLastStartedAt: now,
        },
      })
      return
    }

    if (params.action === 'PAUSE') {
      await transaction.eventLiveMatch.update({
        where: { id: match.id },
        data: {
          timerStatus: LiveTimerStatus.PAUSED,
          timerElapsedSeconds: elapsedSeconds,
          timerLastStartedAt: null,
        },
      })
      return
    }

    if (params.action === 'BREAK') {
      await transaction.eventLiveMatch.update({
        where: { id: match.id },
        data: {
          timerStatus: LiveTimerStatus.BREAK,
          timerElapsedSeconds: elapsedSeconds,
          timerLastStartedAt: null,
        },
      })
    }
  })

  return getEventLiveSnapshot(params.eventId)
}
