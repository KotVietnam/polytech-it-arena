import { z } from 'zod'

export const trackIdSchema = z.enum(['cybersecurity', 'networks', 'devops', 'sysadmin'])
export const levelSchema = z.enum(['Junior', 'Middle', 'Senior'])

export const createEventSchema = z.object({
  track: trackIdSchema,
  level: levelSchema,
  title: z.string().min(3).max(160),
  duration: z.string().min(1).max(60),
  location: z.string().min(1).max(120),
  description: z.string().min(5).max(2000),
  registrationLink: z.string().url().max(1200).nullable().optional(),
  date: z.string().datetime(),
})

export const updateEventSchema = createEventSchema.partial()

export const listEventsQuerySchema = z.object({
  track: trackIdSchema.optional(),
  level: levelSchema.optional(),
})
