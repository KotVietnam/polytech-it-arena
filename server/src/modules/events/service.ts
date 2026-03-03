import { prisma } from '../../db.js'
import type { createEventSchema, updateEventSchema } from './schema.js'

type EventCreateInput = import('zod').infer<typeof createEventSchema>
type EventUpdateInput = import('zod').infer<typeof updateEventSchema>

const toEventDto = (event: {
  id: string
  track: 'cybersecurity' | 'networks' | 'devops' | 'sysadmin'
  level: 'Junior' | 'Middle' | 'Senior'
  title: string
  duration: string
  location: string
  description: string
  startsAt: Date
  createdAt: Date
  updatedAt: Date
}) => ({
  id: event.id,
  track: event.track,
  level: event.level,
  title: event.title,
  duration: event.duration,
  location: event.location,
  description: event.description,
  date: event.startsAt.toISOString(),
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString(),
})

export const listEvents = async (filters?: {
  track?: 'cybersecurity' | 'networks' | 'devops' | 'sysadmin'
  level?: 'Junior' | 'Middle' | 'Senior'
}) => {
  const events = await prisma.event.findMany({
    where: {
      track: filters?.track,
      level: filters?.level,
    },
    orderBy: {
      startsAt: 'asc',
    },
  })

  return events.map(toEventDto)
}

export const getEventById = async (id: string) => {
  const event = await prisma.event.findUnique({ where: { id } })
  return event ? toEventDto(event) : null
}

export const createEvent = async (input: EventCreateInput, createdById?: string) => {
  const event = await prisma.event.create({
    data: {
      track: input.track,
      level: input.level,
      title: input.title,
      duration: input.duration,
      location: input.location,
      description: input.description,
      startsAt: new Date(input.date),
      createdById,
    },
  })

  return toEventDto(event)
}

export const updateEvent = async (
  id: string,
  input: EventUpdateInput,
) => {
  const event = await prisma.event.update({
    where: { id },
    data: {
      track: input.track,
      level: input.level,
      title: input.title,
      duration: input.duration,
      location: input.location,
      description: input.description,
      startsAt: input.date ? new Date(input.date) : undefined,
    },
  })

  return toEventDto(event)
}

export const removeEvent = async (id: string) => {
  await prisma.event.delete({ where: { id } })
}
