import { Role } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../db.js'
import {
  getUserPointsSnapshot,
  grantDailyLoginPoints,
  type UserPointHistoryEntryDto,
  type UserRegistrationPointsDto,
} from '../points/service.js'
import { authenticateUser } from './provider.js'
import { signAuthToken } from './token.js'

export interface AuthUserDto {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  telegramContact: string | null
  telegramLinked: boolean
  telegramUsername: string | null
  role: Role
  totalPoints: number
  registrations: UserRegistrationPointsDto[]
  pointHistory: UserPointHistoryEntryDto[]
}

const toAuthUserDto = async (user: {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  telegramContact: string | null
  telegramChatId: string | null
  telegramUsername: string | null
  role: Role
}): Promise<AuthUserDto> => {
  const pointsSnapshot = await getUserPointsSnapshot(user.id)

  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    telegramContact: user.telegramContact,
    telegramLinked: Boolean(user.telegramChatId),
    telegramUsername: user.telegramUsername,
    role: user.role,
    totalPoints: pointsSnapshot.totalPoints,
    registrations: pointsSnapshot.registrations,
    pointHistory: pointsSnapshot.pointHistory,
  }
}

export const loginWithDirectory = async (username: string, password: string) => {
  const identity = await authenticateUser(username, password)

  if (!identity) {
    return null
  }

  const existing = await prisma.user.findUnique({
    where: { username: identity.username },
    select: { role: true },
  })

  const resolvedRole =
    env.AUTH_MODE === 'keycloak'
      ? identity.roleHint === Role.ADMIN
        ? Role.ADMIN
        : Role.USER
      : identity.roleHint === Role.ADMIN
        ? Role.ADMIN
        : existing?.role === Role.ADMIN
          ? Role.ADMIN
          : Role.USER

  const user = await prisma.user.upsert({
    where: { username: identity.username },
    create: {
      username: identity.username,
      firstName: identity.firstName,
      lastName: identity.lastName,
      displayName: identity.displayName,
      email: identity.email,
      phoneNumber: identity.phoneNumber,
      telegramContact: identity.telegramContact,
      role: resolvedRole,
      lastLoginAt: new Date(),
    },
    update: {
      firstName: identity.firstName,
      lastName: identity.lastName,
      displayName: identity.displayName,
      email: identity.email,
      phoneNumber: identity.phoneNumber,
      telegramContact: identity.telegramContact,
      role: resolvedRole,
      lastLoginAt: new Date(),
    },
  })

  await grantDailyLoginPoints(user.id).catch((error) => {
    console.error('[points] failed to grant daily login points:', error)
  })

  const authUser = await toAuthUserDto(user)

  const token = signAuthToken({
    sub: user.id,
    username: user.username,
    role: user.role,
  })

  return {
    token,
    user: authUser,
  }
}

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      displayName: true,
      email: true,
      phoneNumber: true,
      telegramContact: true,
      telegramChatId: true,
      telegramUsername: true,
      role: true,
    },
  })

  if (!user) {
    return null
  }

  return toAuthUserDto(user)
}
