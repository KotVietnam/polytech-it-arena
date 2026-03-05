import { Role } from '@prisma/client'
import { Client } from 'ldapts'
import { env } from '../../config/env.js'

export interface AuthIdentity {
  username: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  telegramContact: string | null
  groups: string[]
  roleHint: Role
}

interface KeycloakEndpointSet {
  tokenUrl: string
  userInfoUrl: string
}

const KEYCLOAK_ENDPOINT_CACHE_TTL_MS = 5 * 60 * 1000
let keycloakEndpointCache:
  | {
      expiresAt: number
      endpoints: KeycloakEndpointSet[]
    }
  | null = null

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

const toNullableTrimmedString = (value: string | null) => {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const toFirstString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return toNullableTrimmedString(value)
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') {
        const normalized = toNullableTrimmedString(item)
        if (normalized) {
          return normalized
        }
      }
    }
  }
  return null
}

const getClaimValue = (claims: Record<string, unknown>, candidates: string[]) => {
  for (const candidate of candidates) {
    const directValue = toFirstString(claims[candidate])
    if (directValue) {
      return directValue
    }
  }

  const attributes = toRecord(claims.attributes)
  if (!attributes) {
    return null
  }

  for (const candidate of candidates) {
    const attributeValue = toFirstString(attributes[candidate])
    if (attributeValue) {
      return attributeValue
    }
  }

  return null
}

const normalizePhoneNumber = (value: string | null) => {
  const normalized = toNullableTrimmedString(value)
  if (!normalized) {
    return null
  }
  return normalized
}

const normalizeTelegramContact = (value: string | null) => {
  const normalized = toNullableTrimmedString(value)
  if (!normalized) {
    return null
  }

  if (/^-?\d+$/.test(normalized)) {
    return normalized
  }

  return normalized.startsWith('@') ? normalized : `@${normalized}`
}

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : normalized + '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(padded, 'base64').toString('utf-8')
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(parts[1]))
    return toRecord(parsed)
  } catch {
    return null
  }
}

const resolveRoleFromGroups = (groups: string[]): Role => {
  if (!env.AD_ADMIN_GROUP_DN) {
    return Role.USER
  }
  const adminDn = env.AD_ADMIN_GROUP_DN.toLowerCase()
  return groups.some((group) => group.toLowerCase() === adminDn) ? Role.ADMIN : Role.USER
}

const resolveRoleFromKeycloakRoles = (roles: string[]): Role => {
  const adminRole = env.KEYCLOAK_ADMIN_ROLE.trim().toLowerCase()
  if (!adminRole) {
    return Role.USER
  }

  return roles.some((role) => role.toLowerCase() === adminRole) ? Role.ADMIN : Role.USER
}

const extractKeycloakRoles = (claims: Record<string, unknown>): string[] => {
  const realmAccess = toRecord(claims.realm_access)
  const realmRoles = toStringArray(realmAccess?.roles)

  const resourceAccess = toRecord(claims.resource_access)
  const clientAccess = toRecord(
    resourceAccess ? resourceAccess[env.KEYCLOAK_CLIENT_ID ?? ''] : undefined,
  )
  const clientRoles = toStringArray(clientAccess?.roles)

  return Array.from(new Set([...realmRoles, ...clientRoles]))
}

const normalizeUrl = (value: string) => value.trim().replace(/\/$/, '')

const buildKeycloakIssuerCandidates = (): string[] => {
  const candidates: string[] = []

  const addCandidate = (value: string | null | undefined) => {
    if (!value) {
      return
    }
    const normalized = normalizeUrl(value)
    if (normalized) {
      candidates.push(normalized)
    }
  }

  addCandidate(env.KEYCLOAK_ISSUER_URL)

  const realm = encodeURIComponent(env.KEYCLOAK_REALM.trim() || 'master')
  const baseCandidates = [env.KEYCLOAK_BASE_URL, env.FRONTEND_ORIGIN]

  for (const baseCandidate of baseCandidates) {
    if (!baseCandidate) {
      continue
    }
    const baseUrl = normalizeUrl(baseCandidate)
    addCandidate(`${baseUrl}/realms/${realm}`)
    addCandidate(`${baseUrl}/auth/realms/${realm}`)
  }

  return Array.from(new Set(candidates))
}

const fetchOpenIdConfiguration = async (
  issuer: string,
): Promise<Record<string, unknown> | null> => {
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`
  try {
    const response = await fetch(discoveryUrl)
    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('json')) {
      return null
    }

    const payload = (await response.json()) as Record<string, unknown>
    return payload
  } catch {
    return null
  }
}

const resolveKeycloakEndpoints = async (): Promise<KeycloakEndpointSet[]> => {
  const now = Date.now()
  if (keycloakEndpointCache && keycloakEndpointCache.expiresAt > now) {
    return keycloakEndpointCache.endpoints
  }

  const issuerCandidates = buildKeycloakIssuerCandidates()
  const discoveredEndpoints: KeycloakEndpointSet[] = []

  for (const issuer of issuerCandidates) {
    const openIdConfig = await fetchOpenIdConfiguration(issuer)
    if (!openIdConfig) {
      continue
    }

    const tokenUrl = toStringValue(openIdConfig.token_endpoint)
    const userInfoUrl = toStringValue(openIdConfig.userinfo_endpoint)
    if (!tokenUrl || !userInfoUrl) {
      continue
    }

    discoveredEndpoints.push({
      tokenUrl,
      userInfoUrl,
    })
  }

  const endpoints =
    discoveredEndpoints.length > 0
      ? discoveredEndpoints
      : issuerCandidates.map((issuer) => ({
          tokenUrl: `${issuer}/protocol/openid-connect/token`,
          userInfoUrl: `${issuer}/protocol/openid-connect/userinfo`,
        }))

  keycloakEndpointCache = {
    expiresAt: now + KEYCLOAK_ENDPOINT_CACHE_TTL_MS,
    endpoints,
  }

  return endpoints
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
    firstName: isAdminUser ? 'Mock' : null,
    lastName: isAdminUser ? 'Admin' : null,
    displayName: isAdminUser ? 'Mock Admin' : normalized,
    email: `${normalized}@local.test`,
    phoneNumber: null,
    telegramContact: null,
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
      attributes: [
        'dn',
        'cn',
        'displayName',
        'mail',
        'memberOf',
        'sAMAccountName',
        'givenName',
        'sn',
        'telephoneNumber',
      ],
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
      firstName: toStringValue(firstEntry.givenName),
      lastName: toStringValue(firstEntry.sn),
      displayName: toStringValue(firstEntry.displayName) ?? toStringValue(firstEntry.cn),
      email: toStringValue(firstEntry.mail),
      phoneNumber: toStringValue(firstEntry.telephoneNumber),
      telegramContact: null,
      groups,
      roleHint: resolveRoleFromGroups(groups),
    }
  } catch {
    return null
  } finally {
    await client.unbind().catch(() => undefined)
  }
}

const authenticateByKeycloak = async (
  username: string,
  password: string,
): Promise<AuthIdentity | null> => {
  if (
    (!env.KEYCLOAK_ISSUER_URL && !env.KEYCLOAK_BASE_URL) ||
    !env.KEYCLOAK_CLIENT_ID ||
    !env.KEYCLOAK_CLIENT_SECRET
  ) {
    return null
  }

  const normalized = username.trim()
  if (!normalized || !password.trim()) {
    return null
  }

  const endpoints = await resolveKeycloakEndpoints()

  try {
    for (const endpoint of endpoints) {
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: env.KEYCLOAK_CLIENT_ID,
        client_secret: env.KEYCLOAK_CLIENT_SECRET,
        username: normalized,
        password,
        scope: 'openid profile email',
      })

      let tokenResponse: Response
      try {
        tokenResponse = await fetch(endpoint.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        })
      } catch {
        continue
      }

      if (!tokenResponse.ok) {
        continue
      }

      const tokenResponseType = tokenResponse.headers.get('content-type') ?? ''
      if (!tokenResponseType.toLowerCase().includes('json')) {
        continue
      }

      let tokenPayload: Record<string, unknown>
      try {
        tokenPayload = (await tokenResponse.json()) as Record<string, unknown>
      } catch {
        continue
      }

      const accessToken = toStringValue(tokenPayload.access_token)
      if (!accessToken) {
        continue
      }

      let claims = decodeJwtPayload(accessToken) ?? {}

      try {
        const userInfoResponse = await fetch(endpoint.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (userInfoResponse.ok) {
          const userInfo = (await userInfoResponse.json()) as Record<string, unknown>
          claims = {
            ...claims,
            ...userInfo,
          }
        }
      } catch {
        // ignore userinfo errors and fallback to token claims
      }

      const keycloakUsername =
        toStringValue(claims.preferred_username) ??
        toStringValue(claims.username) ??
        toStringValue(claims.sub)

      if (!keycloakUsername) {
        continue
      }

      const groups = toStringArray(claims.groups)
      const roles = extractKeycloakRoles(claims)
      const firstName =
        getClaimValue(claims, ['given_name', 'firstName', 'first_name']) ?? null
      const lastName =
        getClaimValue(claims, ['family_name', 'lastName', 'last_name']) ?? null
      const phoneNumber = normalizePhoneNumber(
        getClaimValue(claims, [
          'phone_number',
          'phoneNumber',
          'phone',
          'mobile_phone',
          'mobilePhone',
          'telephone_number',
          'telephoneNumber',
        ]),
      )
      const telegramContact = normalizeTelegramContact(
        getClaimValue(claims, [
          'telegram',
          'telegram_username',
          'telegramUsername',
          'telegram_account',
          'telegramAccount',
          'tg',
          'tg_username',
          'tgUsername',
        ]),
      )
      const fullNameFromParts = [firstName, lastName].filter(Boolean).join(' ').trim()
      const displayName =
        toNullableTrimmedString(toStringValue(claims.name)) ??
        (fullNameFromParts || null) ??
        toNullableTrimmedString(toStringValue(claims.given_name)) ??
        keycloakUsername

      return {
        username: keycloakUsername,
        firstName,
        lastName,
        displayName,
        email: toStringValue(claims.email),
        phoneNumber,
        telegramContact,
        groups: Array.from(new Set([...groups, ...roles])),
        roleHint: resolveRoleFromKeycloakRoles(roles),
      }
    }

    return null
  } catch {
    return null
  }
}

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<AuthIdentity | null> => {
  if (env.AUTH_MODE === 'mock') {
    return authenticateByMock(username, password)
  }
  if (env.AUTH_MODE === 'keycloak') {
    return authenticateByKeycloak(username, password)
  }
  return authenticateByAd(username, password)
}
