import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError } from '../../utils/http-error.js'
import { getEventById, listEvents } from './service.js'
import { listEventsQuerySchema } from './schema.js'

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
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await getEventById(req.params.id)
    if (!event) {
      throw new HttpError(404, 'Event not found')
    }

    res.json({ item: event })
  }),
)

export { eventsRouter }
