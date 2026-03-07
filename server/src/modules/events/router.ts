import { Router } from 'express'
import { optionalAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError } from '../../utils/http-error.js'
import { getEventById, listEvents } from './service.js'
import { listEventsQuerySchema } from './schema.js'
import { createGuestEventRegistrationSchema } from '../registrations/schema.js'
import {
  createGuestEventRegistration,
  createEventRegistrationForAuthorizedUser,
} from '../registrations/service.js'
import { getEventLiveSnapshot } from '../live/service.js'
import {
  createGuestTelegramRegistrationLink,
  createTelegramLinkForUser,
} from '../auth/telegram-link.js'

const eventsRouter = Router()

eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters = listEventsQuerySchema.parse({
      track: typeof req.query.track === 'string' ? req.query.track : undefined,
      level: typeof req.query.level === 'string' ? req.query.level : undefined,
    })

    const items = await listEvents(filters)
    res.json({ items })
  }),
)

eventsRouter.get(
  '/:id/live-stats',
  asyncHandler(async (req, res) => {
    try {
      const item = await getEventLiveSnapshot(req.params.id)
      res.json({ item })
    } catch (error) {
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
      throw error
    }
  }),
)

eventsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await getEventById(req.params.id)
    if (!event) {
      throw new HttpError(404, 'Event not found')
    }

    res.json({ item: event })
  }),
)

eventsRouter.post(
  '/:id/register',
  optionalAuth,
  asyncHandler(async (req, res) => {
    try {
      if (req.authUser) {
        try {
          const result = await createEventRegistrationForAuthorizedUser({
            eventId: req.params.id,
            userId: req.authUser.id,
          })

          res.status(result.created ? 201 : 200).json({
            item: result.item,
          })
          return
        } catch (error) {
          if (error instanceof Error && error.message === 'TELEGRAM_NOT_LINKED') {
            try {
              const link = await createTelegramLinkForUser(req.authUser.id)
              res.status(409).json({
                error: 'TELEGRAM_NOT_LINKED',
                telegramLink: link.url,
                expiresAt: link.expiresAt,
              })
              return
            } catch (linkError) {
              if (
                linkError instanceof Error &&
                linkError.message === 'TELEGRAM_BOT_NOT_CONFIGURED'
              ) {
                throw new HttpError(503, 'Telegram bot is not configured')
              }
              if (
                linkError instanceof Error &&
                linkError.message === 'TELEGRAM_BOT_USERNAME_UNAVAILABLE'
              ) {
                throw new HttpError(503, 'Telegram bot username is unavailable')
              }
              throw linkError
            }
          }

          if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
            throw new HttpError(401, 'User not found')
          }

          throw error
        }
      }

      const hasGuestPayload =
        req.body &&
        typeof req.body === 'object' &&
        !Array.isArray(req.body) &&
        Object.keys(req.body as Record<string, unknown>).length > 0

      if (hasGuestPayload) {
        const input = createGuestEventRegistrationSchema.parse(req.body)
        const result = await createGuestEventRegistration({
          eventId: req.params.id,
          fullName: input.fullName,
          phone: input.phone,
          telegramTag: input.telegramTag,
        })

        res.status(result.created ? 201 : 200).json({
          item: result.item,
        })
        return
      }

      const guestLink = await createGuestTelegramRegistrationLink(req.params.id)
      res.status(202).json({
        error: 'GUEST_TELEGRAM_REQUIRED',
        guestTelegramLink: guestLink.url,
        guestQrCodeUrl: guestLink.qrCodeUrl,
        expiresAt: guestLink.expiresAt,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
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

export { eventsRouter }
