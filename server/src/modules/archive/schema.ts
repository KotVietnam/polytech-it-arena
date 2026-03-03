import { z } from 'zod'

export const materialsSchema = z.array(z.string().min(1)).max(30)

export const createArchiveSchema = z.object({
  eventId: z.string().uuid(),
  summary: z.string().min(10).max(5000),
  materials: materialsSchema.default([]),
  publishedAt: z.string().datetime(),
})

export const updateArchiveSchema = createArchiveSchema.partial()
