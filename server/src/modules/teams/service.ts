import { Prisma, TeamInviteStatus, TeamMemberRole } from '@prisma/client'
import { prisma } from '../../db.js'

export interface TeamSearchUserDto {
  id: string
  username: string
  displayName: string | null
  fullName: string | null
  email: string | null
}

export interface TeamMemberDto {
  userId: string
  username: string
  displayName: string | null
  fullName: string | null
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

export interface TeamPendingInviteDto {
  id: string
  inviteeUserId: string
  username: string
  displayName: string | null
  fullName: string | null
  createdAt: string
}

export interface TeamDto {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  isOwner: boolean
  members: TeamMemberDto[]
  pendingInvites: TeamPendingInviteDto[]
}

export interface IncomingTeamInviteDto {
  id: string
  teamId: string
  teamName: string
  inviterUserId: string
  inviterUsername: string
  inviterDisplayName: string | null
  inviterFullName: string | null
  createdAt: string
}

export interface UserTeamsSnapshotDto {
  teams: TeamDto[]
  incomingInvites: IncomingTeamInviteDto[]
}

const isUniqueError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

const resolveFullName = (user: {
  firstName: string | null
  lastName: string | null
  displayName: string | null
}) => {
  const value = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (value) {
    return value
  }
  return user.displayName
}

const toTeamDto = (
  team: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    members: Array<{
      userId: string
      role: TeamMemberRole
      createdAt: Date
      user: {
        username: string
        displayName: string | null
        firstName: string | null
        lastName: string | null
      }
    }>
    invites: Array<{
      id: string
      createdAt: Date
      inviteeId: string
      invitee: {
        username: string
        displayName: string | null
        firstName: string | null
        lastName: string | null
      }
    }>
  },
  userId: string,
): TeamDto => {
  const members = [...team.members].sort((a, b) => {
    if (a.role === b.role) {
      return a.createdAt.getTime() - b.createdAt.getTime()
    }
    return a.role === TeamMemberRole.OWNER ? -1 : 1
  })

  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    isOwner: members.some(
      (member) => member.userId === userId && member.role === TeamMemberRole.OWNER,
    ),
    members: members.map((member) => ({
      userId: member.userId,
      username: member.user.username,
      displayName: member.user.displayName,
      fullName: resolveFullName(member.user),
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
    })),
    pendingInvites: team.invites.map((invite) => ({
      id: invite.id,
      inviteeUserId: invite.inviteeId,
      username: invite.invitee.username,
      displayName: invite.invitee.displayName,
      fullName: resolveFullName(invite.invitee),
      createdAt: invite.createdAt.toISOString(),
    })),
  }
}

const getTeamMembership = async (teamId: string, userId: string) =>
  prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: {
      role: true,
    },
  })

export const getUserTeamsSnapshot = async (userId: string): Promise<UserTeamsSnapshotDto> => {
  const [teams, incomingInvites] = await Promise.all([
    prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invites: {
          where: {
            status: TeamInviteStatus.PENDING,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            invitee: {
              select: {
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.teamInvite.findMany({
      where: {
        inviteeId: userId,
        status: TeamInviteStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ])

  return {
    teams: teams.map((team) => toTeamDto(team, userId)),
    incomingInvites: incomingInvites.map((invite) => ({
      id: invite.id,
      teamId: invite.team.id,
      teamName: invite.team.name,
      inviterUserId: invite.inviter.id,
      inviterUsername: invite.inviter.username,
      inviterDisplayName: invite.inviter.displayName,
      inviterFullName: resolveFullName(invite.inviter),
      createdAt: invite.createdAt.toISOString(),
    })),
  }
}

export const createTeam = async (params: {
  ownerUserId: string
  name: string
}): Promise<TeamDto> => {
  const trimmedName = params.name.trim()
  if (trimmedName.length < 2) {
    throw new Error('INVALID_TEAM_NAME')
  }

  const created = await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: trimmedName,
        createdById: params.ownerUserId,
      },
    })

    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: params.ownerUserId,
        role: TeamMemberRole.OWNER,
      },
    })

    return team
  })

  const team = await prisma.team.findUnique({
    where: { id: created.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      invites: {
        where: {
          status: TeamInviteStatus.PENDING,
        },
        include: {
          invitee: {
            select: {
              username: true,
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!team) {
    throw new Error('TEAM_NOT_FOUND')
  }

  return toTeamDto(team, params.ownerUserId)
}

export const searchUsersForTeamInvite = async (params: {
  teamId: string
  actorUserId: string
  query: string
}): Promise<TeamSearchUserDto[]> => {
  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: { id: true },
  })
  if (!team) {
    throw new Error('TEAM_NOT_FOUND')
  }

  const membership = await getTeamMembership(params.teamId, params.actorUserId)
  if (!membership) {
    throw new Error('TEAM_FORBIDDEN')
  }

  const normalizedQuery = params.query.trim()
  if (normalizedQuery.length < 2) {
    return []
  }

  const [members, pendingInvites] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: params.teamId },
      select: { userId: true },
    }),
    prisma.teamInvite.findMany({
      where: {
        teamId: params.teamId,
        status: TeamInviteStatus.PENDING,
      },
      select: { inviteeId: true },
    }),
  ])

  const excludedUserIds = new Set<string>([
    ...members.map((member) => member.userId),
    ...pendingInvites.map((invite) => invite.inviteeId),
  ])

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludedUserIds] },
      OR: [
        { username: { contains: normalizedQuery } },
        { displayName: { contains: normalizedQuery } },
        { firstName: { contains: normalizedQuery } },
        { lastName: { contains: normalizedQuery } },
      ],
    },
    orderBy: {
      username: 'asc',
    },
    take: 12,
    select: {
      id: true,
      username: true,
      displayName: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  })

  return candidates.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    fullName: resolveFullName(user),
    email: user.email,
  }))
}

export const createTeamInvite = async (params: {
  teamId: string
  inviterUserId: string
  inviteeUserId: string
}): Promise<TeamPendingInviteDto> => {
  if (params.inviterUserId === params.inviteeUserId) {
    throw new Error('INVALID_INVITEE')
  }

  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    select: { id: true },
  })
  if (!team) {
    throw new Error('TEAM_NOT_FOUND')
  }

  const inviterMembership = await getTeamMembership(params.teamId, params.inviterUserId)
  if (!inviterMembership) {
    throw new Error('TEAM_FORBIDDEN')
  }
  if (inviterMembership.role !== TeamMemberRole.OWNER) {
    throw new Error('TEAM_OWNER_REQUIRED')
  }

  const [invitee, existingMember] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.inviteeUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: params.inviteeUserId,
        },
      },
      select: { id: true },
    }),
  ])

  if (!invitee) {
    throw new Error('INVITEE_NOT_FOUND')
  }
  if (existingMember) {
    throw new Error('ALREADY_MEMBER')
  }

  const pending = await prisma.teamInvite.findFirst({
    where: {
      teamId: params.teamId,
      inviteeId: params.inviteeUserId,
      status: TeamInviteStatus.PENDING,
    },
    select: { id: true },
  })
  if (pending) {
    throw new Error('INVITE_ALREADY_PENDING')
  }

  try {
    const invite = await prisma.teamInvite.create({
      data: {
        teamId: params.teamId,
        inviterId: params.inviterUserId,
        inviteeId: params.inviteeUserId,
        status: TeamInviteStatus.PENDING,
      },
      include: {
        invitee: {
          select: {
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      id: invite.id,
      inviteeUserId: invite.inviteeId,
      username: invite.invitee.username,
      displayName: invite.invitee.displayName,
      fullName: resolveFullName(invite.invitee),
      createdAt: invite.createdAt.toISOString(),
    }
  } catch (error) {
    if (isUniqueError(error)) {
      throw new Error('INVITE_ALREADY_PENDING')
    }
    throw error
  }
}

export const respondToTeamInvite = async (params: {
  inviteId: string
  userId: string
  action: 'ACCEPT' | 'DECLINE'
}) => {
  const invite = await prisma.teamInvite.findUnique({
    where: { id: params.inviteId },
    select: {
      id: true,
      teamId: true,
      inviteeId: true,
      status: true,
    },
  })

  if (!invite) {
    throw new Error('INVITE_NOT_FOUND')
  }
  if (invite.inviteeId !== params.userId) {
    throw new Error('INVITE_FORBIDDEN')
  }
  if (invite.status !== TeamInviteStatus.PENDING) {
    throw new Error('INVITE_ALREADY_RESOLVED')
  }

  if (params.action === 'ACCEPT') {
    await prisma.$transaction(async (tx) => {
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: {
          status: TeamInviteStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      })

      await tx.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: invite.teamId,
            userId: params.userId,
          },
        },
        update: {},
        create: {
          teamId: invite.teamId,
          userId: params.userId,
          role: TeamMemberRole.MEMBER,
        },
      })
    })
    return {
      status: 'ACCEPTED' as const,
    }
  }

  await prisma.teamInvite.update({
    where: { id: invite.id },
    data: {
      status: TeamInviteStatus.DECLINED,
      respondedAt: new Date(),
    },
  })

  return {
    status: 'DECLINED' as const,
  }
}
