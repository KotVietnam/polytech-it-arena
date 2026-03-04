import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const isIgnorableAlterTableError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return (
    message.includes('duplicate column name') ||
    message.includes('already exists') ||
    message.includes('no such table')
  )
}

export const ensureRuntimeSchema = async () => {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN "registrationLink" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  await prisma.$executeRawUnsafe(
    'UPDATE "Event" SET "registrationLink" = ? || "id" WHERE "registrationLink" IS NULL',
    'https://itarena.kotvietnam.kz/register/',
  )
}
