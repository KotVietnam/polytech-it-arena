import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(64),
})

export const searchTeamUsersQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
})

export const createTeamInviteSchema = z.object({
  inviteeUserId: z.string().uuid(),
})

export const respondTeamInviteSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
})
