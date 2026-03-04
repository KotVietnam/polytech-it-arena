import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const isIgnorableAlterTableError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return message.includes('duplicate column name') || message.includes('already exists')
}

const main = async () => {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN "registrationLink" TEXT')
    console.log('Schema ensure: added Event.registrationLink')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: Event.registrationLink already exists')
    } else {
      throw error
    }
  }

  await prisma.$executeRawUnsafe(
    'UPDATE "Event" SET "registrationLink" = ? || "id" WHERE "registrationLink" IS NULL',
    'https://itarena.kotvietnam.kz/register/',
  )
  console.log('Schema ensure: normalized default registration links')
}

void main()
  .catch((error) => {
    console.error('Schema ensure failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
