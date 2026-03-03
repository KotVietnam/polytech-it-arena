import { Role } from '@prisma/client'
import { prisma } from '../../db.js'
import { authenticateUser } from './provider.js'
import { signAuthToken } from './token.js'

export interface AuthUserDto {
  id: string
  username: string
  displayName: string | null
  email: string | null
  role: Role
}

const toAuthUserDto = (user: {
  id: string
  username: string
  displayName: string | null
  email: string | null
  role: Role
}): AuthUserDto => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  email: user.email,
  role: user.role,
})

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
    identity.roleHint === Role.ADMIN
      ? Role.ADMIN
      : existing?.role === Role.ADMIN
        ? Role.ADMIN
        : Role.USER

  const user = await prisma.user.upsert({
    where: { username: identity.username },
    create: {
      username: identity.username,
      displayName: identity.displayName,
      email: identity.email,
      role: resolvedRole,
      lastLoginAt: new Date(),
    },
    update: {
      displayName: identity.displayName,
      email: identity.email,
      role: resolvedRole,
      lastLoginAt: new Date(),
    },
  })

  const token = signAuthToken({
    sub: user.id,
    username: user.username,
    role: user.role,
  })

  return {
    token,
    user: toAuthUserDto(user),
  }
}

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    return null
  }

  return toAuthUserDto(user)
}
