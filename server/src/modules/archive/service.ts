import { prisma } from '../../db.js'
import type { createArchiveSchema, updateArchiveSchema } from './schema.js'

type ArchiveCreateInput = import('zod').infer<typeof createArchiveSchema>
type ArchiveUpdateInput = import('zod').infer<typeof updateArchiveSchema>

const toArchiveDto = (entry: {
  id: string
  eventId: string
  summary: string
  materials: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
  event: {
    id: string
    track: 'cybersecurity' | 'networks' | 'devops' | 'sysadmin'
    level: 'Junior' | 'Middle' | 'Senior'
    title: string
    duration: string
    location: string
    description: string
    startsAt: Date
  }
}) => ({
  id: entry.id,
  eventId: entry.eventId,
  summary: entry.summary,
  materials: (() => {
    try {
      const parsed = JSON.parse(entry.materials) as unknown
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : []
    } catch {
      return []
    }
  })(),
  publishedAt: entry.publishedAt.toISOString(),
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString(),
  event: {
    id: entry.event.id,
    track: entry.event.track,
    level: entry.event.level,
    title: entry.event.title,
    duration: entry.event.duration,
    location: entry.event.location,
    description: entry.event.description,
    date: entry.event.startsAt.toISOString(),
  },
})

export const listArchives = async () => {
  const items = await prisma.archiveEntry.findMany({
    include: {
      event: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  })

  return items.map(toArchiveDto)
}

export const getArchiveById = async (id: string) => {
  const item = await prisma.archiveEntry.findUnique({
    where: { id },
    include: { event: true },
  })

  return item ? toArchiveDto(item) : null
}

export const createArchive = async (
  input: ArchiveCreateInput,
  createdById?: string,
) => {
  const item = await prisma.archiveEntry.create({
    data: {
      eventId: input.eventId,
      summary: input.summary,
      materials: JSON.stringify(input.materials),
      publishedAt: new Date(input.publishedAt),
      createdById,
    },
    include: { event: true },
  })

  return toArchiveDto(item)
}

export const updateArchive = async (
  id: string,
  input: ArchiveUpdateInput,
) => {
  const item = await prisma.archiveEntry.update({
    where: { id },
    data: {
      eventId: input.eventId,
      summary: input.summary,
      materials: input.materials ? JSON.stringify(input.materials) : undefined,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
    },
    include: { event: true },
  })

  return toArchiveDto(item)
}

export const removeArchive = async (id: string) => {
  await prisma.archiveEntry.delete({ where: { id } })
}
