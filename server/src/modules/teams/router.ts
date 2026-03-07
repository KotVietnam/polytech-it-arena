import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError } from '../../utils/http-error.js'
import {
  createTeamSchema,
  createTeamInviteSchema,
  respondTeamInviteSchema,
  searchTeamUsersQuerySchema,
} from './schema.js'
import {
  createTeam,
  createTeamInvite,
  getUserTeamsSnapshot,
  respondToTeamInvite,
  searchUsersForTeamInvite,
} from './service.js'

const toHttpError = (error: unknown): never => {
  if (!(error instanceof Error)) {
    throw error
  }

  if (error.message === 'INVALID_TEAM_NAME') {
    throw new HttpError(400, 'Invalid team name')
  }
  if (error.message === 'TEAM_NOT_FOUND') {
    throw new HttpError(404, 'Team not found')
  }
  if (error.message === 'TEAM_FORBIDDEN') {
    throw new HttpError(403, 'Forbidden')
  }
  if (error.message === 'TEAM_OWNER_REQUIRED') {
    throw new HttpError(403, 'Only team owner can invite users')
  }
  if (error.message === 'INVALID_INVITEE') {
    throw new HttpError(400, 'Invalid invite target')
  }
  if (error.message === 'INVITEE_NOT_FOUND') {
    throw new HttpError(404, 'Invitee user not found')
  }
  if (error.message === 'ALREADY_MEMBER') {
    throw new HttpError(409, 'User is already in the team')
  }
  if (error.message === 'INVITE_ALREADY_PENDING') {
    throw new HttpError(409, 'Invite is already pending')
  }
  if (error.message === 'INVITE_NOT_FOUND') {
    throw new HttpError(404, 'Invite not found')
  }
  if (error.message === 'INVITE_FORBIDDEN') {
    throw new HttpError(403, 'Forbidden')
  }
  if (error.message === 'INVITE_ALREADY_RESOLVED') {
    throw new HttpError(409, 'Invite already resolved')
  }

  throw error
}

const teamsRouter = Router()

teamsRouter.use(requireAuth)

teamsRouter.get(
  '/my',
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const result = await getUserTeamsSnapshot(authUser.id)
    res.json(result)
  }),
)

teamsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = createTeamSchema.parse(req.body)

    try {
      const item = await createTeam({
        ownerUserId: authUser.id,
        name: input.name,
      })
      res.status(201).json({ item })
    } catch (error) {
      toHttpError(error)
    }
  }),
)

teamsRouter.get(
  '/:teamId/search-users',
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = searchTeamUsersQuerySchema.parse({
      q: typeof req.query.q === 'string' ? req.query.q : '',
    })

    try {
      const items = await searchUsersForTeamInvite({
        teamId: req.params.teamId,
        actorUserId: authUser.id,
        query: input.q,
      })
      res.json({ items })
    } catch (error) {
      toHttpError(error)
    }
  }),
)

teamsRouter.post(
  '/:teamId/invites',
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = createTeamInviteSchema.parse(req.body)

    try {
      const item = await createTeamInvite({
        teamId: req.params.teamId,
        inviterUserId: authUser.id,
        inviteeUserId: input.inviteeUserId,
      })
      res.status(201).json({ item })
    } catch (error) {
      toHttpError(error)
    }
  }),
)

teamsRouter.post(
  '/invites/:inviteId/respond',
  asyncHandler(async (req, res) => {
    const authUser = req.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const input = respondTeamInviteSchema.parse(req.body)

    try {
      const item = await respondToTeamInvite({
        inviteId: req.params.inviteId,
        userId: authUser.id,
        action: input.action,
      })
      res.json({ item })
    } catch (error) {
      toHttpError(error)
    }
  }),
)

export { teamsRouter }
