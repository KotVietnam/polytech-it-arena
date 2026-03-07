import { LiveTeam, Role } from '@prisma/client'
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
import {
  addLiveScoreAction,
  drawLiveTeamsForEvent,
  getEventLiveSnapshot,
  updateLiveTimerState,
} from '../live/service.js'
import {
  getUsersPointTotals,
  grantAdminManualPoints,
  listAdminPointRules,
} from '../points/service.js'

const roleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
})

const grantPointsSchema = z.object({
  userId: z.string().uuid(),
  points: z.number().int().min(-500).max(500).refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(180),
  eventId: z.string().uuid().optional().nullable(),
})

const liveScoreSchema = z.object({
  team: z.nativeEnum(LiveTeam),
  points: z.number().int().min(-100).max(100).refine((value) => value !== 0),
  reason: z.string().trim().min(2).max(160),
})

const liveTimerSchema = z.object({
  action: z.enum(['START', 'PAUSE', 'BREAK', 'RESUME', 'RESET']),
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
          lastLoginAt: true,
        },
      })

      const totalsByUserId = await getUsersPointTotals([user.id])

      res.json({
        user: {
          ...user,
          totalPoints: totalsByUserId.get(user.id) ?? 0,
        },
      })
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

    const totalsByUserId = await getUsersPointTotals(items.map((item) => item.id))

    res.json({
      items: items.map((item) => ({
        ...item,
        totalPoints: totalsByUserId.get(item.id) ?? 0,
      })),
    })
  }),
)

adminRouter.get(
  '/points/rules',
  asyncHandler(async (_req, res) => {
    res.json({ items: listAdminPointRules() })
  }),
)

adminRouter.post(
  '/live/:eventId/draw',
  asyncHandler(async (req, res) => {
    const currentUser = req.authUser
    if (!currentUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    try {
      const item = await drawLiveTeamsForEvent({
        eventId: req.params.eventId,
        createdById: currentUser.id,
      })
      res.json({ item })
    } catch (error) {
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
      if (error instanceof Error && error.message === 'NOT_ENOUGH_PARTICIPANTS') {
        throw new HttpError(400, 'At least 2 participants are required for draw')
      }
      throw error
    }
  }),
)

adminRouter.post(
  '/live/:eventId/score',
  asyncHandler(async (req, res) => {
    const currentUser = req.authUser
    if (!currentUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = liveScoreSchema.parse(req.body)

    try {
      const item = await addLiveScoreAction({
        eventId: req.params.eventId,
        createdById: currentUser.id,
        team: input.team,
        points: input.points,
        reason: input.reason,
      })
      res.status(201).json({ item })
    } catch (error) {
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
      if (error instanceof Error && error.message === 'DRAW_REQUIRED') {
        throw new HttpError(400, 'Run team draw before scoring')
      }
      if (error instanceof Error && error.message === 'INVALID_POINTS') {
        throw new HttpError(400, 'Invalid score value')
      }
      if (error instanceof Error && error.message === 'INVALID_REASON') {
        throw new HttpError(400, 'Invalid reason')
      }
      throw error
    }
  }),
)

adminRouter.post(
  '/live/:eventId/timer',
  asyncHandler(async (req, res) => {
    const currentUser = req.authUser
    if (!currentUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = liveTimerSchema.parse(req.body)

    try {
      const item = await updateLiveTimerState({
        eventId: req.params.eventId,
        createdById: currentUser.id,
        action: input.action,
      })
      res.json({ item })
    } catch (error) {
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
      if (error instanceof Error && error.message === 'DRAW_REQUIRED') {
        throw new HttpError(400, 'Run team draw before timer control')
      }
      throw error
    }
  }),
)

adminRouter.get(
  '/live/:eventId',
  asyncHandler(async (req, res) => {
    try {
      const item = await getEventLiveSnapshot(req.params.eventId)
      res.json({ item })
    } catch (error) {
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
      throw error
    }
  }),
)

adminRouter.post(
  '/points/grant',
  asyncHandler(async (req, res) => {
    const currentUser = req.authUser
    if (!currentUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = grantPointsSchema.parse(req.body)

    try {
      const entry = await grantAdminManualPoints({
        adminUserId: currentUser.id,
        userId: input.userId,
        points: input.points,
        reason: input.reason,
        eventId: input.eventId ?? undefined,
      })

      res.status(201).json({
        item: {
          id: entry.id,
          userId: entry.userId,
          points: entry.points,
          reason: entry.reason,
          eventId: entry.eventId,
          actionType: entry.actionType,
          createdAt: entry.createdAt.toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        throw new HttpError(404, 'User not found')
      }
      if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
        throw new HttpError(404, 'Event not found')
      }
      if (error instanceof Error && error.message === 'INVALID_POINTS') {
        throw new HttpError(400, 'Invalid points value')
      }
      if (error instanceof Error && error.message === 'INVALID_REASON') {
        throw new HttpError(400, 'Invalid reason')
      }
      throw error
    }
  }),
)

export { adminRouter }
