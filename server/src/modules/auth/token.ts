import type { Role } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'

export interface AuthTokenPayload {
  sub: string
  username: string
  role: Role
}

const jwtSecret = env.JWT_SECRET as jwt.Secret
const expiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']

export const signAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, jwtSecret, { expiresIn })

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, jwtSecret) as AuthTokenPayload
