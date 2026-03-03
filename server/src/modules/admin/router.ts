import { Role } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../db.js'
import { requireAdmin, requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError } from '../../utils/http-error.js'
import { createArchiveSchema, updateArchiveSchema } from '../archive/schema.js'
import {
  createArchive,
  removeArchive,
  updateArchive,
} from '../archive/service.js'
import { createEventSchema, updateEventSchema } from '../events/schema.js'
import { createEvent, removeEvent, updateEvent } from '../events/service.js'

const roleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
})

const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

adminRouter.post(
  '/events',
  asyncHandler(async (req, res) => {
    const input = createEventSchema.parse(req.body)
    const item = await createEvent(input, req.authUser?.id)
    res.status(201).json({ item })
  }),
)

adminRouter.patch(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const input = updateEventSchema.parse(req.body)
    if (!Object.keys(input).length) {
      throw new HttpError(400, 'No fields for update')
    }

    try {
      const item = await updateEvent(req.params.id, input)
      res.json({ item })
    } catch {
      throw new HttpError(404, 'Event not found')
    }
  }),
)

adminRouter.delete(
  '/events/:id',
  asyncHandler(async (req, res) => {
    try {
      await removeEvent(req.params.id)
      res.status(204).send()
    } catch {
      throw new HttpError(404, 'Event not found')
    }
  }),
)

adminRouter.post(
  '/archives',
  asyncHandler(async (req, res) => {
    const input = createArchiveSchema.parse(req.body)

    try {
      const item = await createArchive(input, req.authUser?.id)
      res.status(201).json({ item })
    } catch {
      throw new HttpError(400, 'Cannot create archive: check eventId and uniqueness')
    }
  }),
)

adminRouter.patch(
  '/archives/:id',
  asyncHandler(async (req, res) => {
    const input = updateArchiveSchema.parse(req.body)
    if (!Object.keys(input).length) {
      throw new HttpError(400, 'No fields for update')
    }

    try {
      const item = await updateArchive(req.params.id, input)
      res.json({ item })
    } catch {
      throw new HttpError(404, 'Archive not found')
    }
  }),
)

adminRouter.delete(
  '/archives/:id',
  asyncHandler(async (req, res) => {
    try {
      await removeArchive(req.params.id)
      res.status(204).send()
    } catch {
      throw new HttpError(404, 'Archive not found')
    }
  }),
)

adminRouter.patch(
  '/users/:id/role',
  asyncHandler(async (req, res) => {
    const { role } = roleUpdateSchema.parse(req.body)

    const currentUser = req.authUser
    if (currentUser && currentUser.id === req.params.id && role !== Role.ADMIN) {
      throw new HttpError(400, 'Admin cannot downgrade itself')
    }

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role },
        select: {
          id: true,
          username: true,
          role: true,
          displayName: true,
          email: true,
        },
      })

      res.json({ user })
    } catch {
      throw new HttpError(404, 'User not found')
    }
  }),
)

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const items = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        role: true,
        displayName: true,
        email: true,
        lastLoginAt: true,
      },
    })

    res.json({ items })
  }),
)

export { adminRouter }
