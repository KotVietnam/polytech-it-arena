import { Role } from '@prisma/client'
import { Client } from 'ldapts'
import { env } from '../../config/env.js'

export interface AuthIdentity {
  username: string
  displayName: string | null
  email: string | null
  groups: string[]
  roleHint: Role
}

const escapeLdapFilter = (value: string) =>
  value
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .split('\0')
    .join('\\00')

const toStringValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value
  }
  return null
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') {
    return [value]
  }
  return []
}

const resolveRoleFromGroups = (groups: string[]): Role => {
  if (!env.AD_ADMIN_GROUP_DN) {
    return Role.USER
  }
  const adminDn = env.AD_ADMIN_GROUP_DN.toLowerCase()
  return groups.some((group) => group.toLowerCase() === adminDn) ? Role.ADMIN : Role.USER
}

const authenticateByMock = async (
  username: string,
  password: string,
): Promise<AuthIdentity | null> => {
  const normalized = username.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  const isAdminUser = normalized === env.MOCK_ADMIN_USERNAME.toLowerCase()
  const expectedPassword = isAdminUser ? env.MOCK_ADMIN_PASSWORD : env.MOCK_USER_PASSWORD

  if (password !== expectedPassword) {
    return null
  }

  return {
    username: normalized,
    displayName: isAdminUser ? 'Mock Admin' : normalized,
    email: `${normalized}@local.test`,
    groups: isAdminUser && env.AD_ADMIN_GROUP_DN ? [env.AD_ADMIN_GROUP_DN] : [],
    roleHint: isAdminUser ? Role.ADMIN : Role.USER,
  }
}

const authenticateByAd = async (
  username: string,
  password: string,
): Promise<AuthIdentity | null> => {
  if (!env.AD_URL || !env.AD_BASE_DN) {
    return null
  }

  const normalized = username.trim()
  if (!normalized || !password.trim()) {
    return null
  }

  const client = new Client({
    url: env.AD_URL,
    timeout: 10_000,
    connectTimeout: 10_000,
    tlsOptions: env.AD_SKIP_TLS_VERIFY ? { rejectUnauthorized: false } : undefined,
  })

  try {
    if (env.AD_BIND_DN && env.AD_BIND_PASSWORD) {
      await client.bind(env.AD_BIND_DN, env.AD_BIND_PASSWORD)
    }

    const filter = env.AD_USER_FILTER.replaceAll('{{username}}', escapeLdapFilter(normalized))

    const { searchEntries } = await client.search(env.AD_BASE_DN, {
      scope: 'sub',
      filter,
      attributes: ['dn', 'cn', 'displayName', 'mail', 'memberOf', 'sAMAccountName'],
      sizeLimit: 1,
    })

    if (!searchEntries.length) {
      return null
    }

    const firstEntry = searchEntries[0] as Record<string, unknown>
    const userDn = toStringValue(firstEntry.dn)

    if (!userDn) {
      return null
    }

    await client.bind(userDn, password)

    const groups = toStringArray(firstEntry.memberOf)
    const directoryUsername =
      toStringValue(firstEntry.sAMAccountName) ??
      toStringValue(firstEntry.cn) ??
      normalized

    return {
      username: directoryUsername,
      displayName: toStringValue(firstEntry.displayName) ?? toStringValue(firstEntry.cn),
      email: toStringValue(firstEntry.mail),
      groups,
      roleHint: resolveRoleFromGroups(groups),
    }
  } catch {
    return null
  } finally {
    await client.unbind().catch(() => undefined)
  }
}

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<AuthIdentity | null> => {
  if (env.AUTH_MODE === 'mock') {
    return authenticateByMock(username, password)
  }
  return authenticateByAd(username, password)
}
