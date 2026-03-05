import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError } from '../../utils/http-error.js'
import { getUserById, loginWithDirectory } from './service.js'
import { createTelegramLinkForUser } from './telegram-link.js'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const authRouter = Router()

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body)
    const result = await loginWithDirectory(username, password)

    if (!result) {
      throw new HttpError(401, 'Invalid credentials')
    }

    res.json(result)
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const user = await getUserById(authUser.id)
    if (!user) {
      throw new HttpError(401, 'User not found')
    }

    res.json({ user })
  }),
)

authRouter.post(
  '/telegram-link',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    try {
      const result = await createTelegramLinkForUser(authUser.id)
      res.json(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'TELEGRAM_BOT_NOT_CONFIGURED') {
        throw new HttpError(503, 'Telegram bot is not configured')
      }
      if (error instanceof Error && error.message === 'TELEGRAM_BOT_USERNAME_UNAVAILABLE') {
        throw new HttpError(503, 'Telegram bot username is unavailable')
      }
      throw error
    }
  }),
)

export { authRouter }
