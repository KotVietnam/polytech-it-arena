import { Role } from '@prisma/client'
import type { RequestHandler } from 'express'
import { verifyAuthToken } from '../modules/auth/token.js'

const parseBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = parseBearerToken(req.headers.authorization)

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = verifyAuthToken(token)
    req.authUser = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.authUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.authUser.role !== Role.ADMIN) {
    res.status(403).json({ error: 'Forbidden: admin role required' })
    return
  }

  next()
}
