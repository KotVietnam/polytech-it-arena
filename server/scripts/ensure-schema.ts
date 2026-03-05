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

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT')
    console.log('Schema ensure: added User.telegramChatId')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.telegramChatId already exists')
    } else {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "firstName" TEXT')
    console.log('Schema ensure: added User.firstName')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.firstName already exists')
    } else {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "lastName" TEXT')
    console.log('Schema ensure: added User.lastName')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.lastName already exists')
    } else {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT')
    console.log('Schema ensure: added User.phoneNumber')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.phoneNumber already exists')
    } else {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramContact" TEXT')
    console.log('Schema ensure: added User.telegramContact')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.telegramContact already exists')
    } else {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT')
    console.log('Schema ensure: added User.telegramUsername')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.telegramUsername already exists')
    } else {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramLinkedAt" DATETIME')
    console.log('Schema ensure: added User.telegramLinkedAt')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: User.telegramLinkedAt already exists')
    } else {
      throw error
    }
  }

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramChatId_key" ON "User"("telegramChatId")',
  )
  console.log('Schema ensure: User telegram index ready')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventRegistration" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "userId" TEXT,
      "contactType" TEXT NOT NULL,
      "contactValue" TEXT NOT NULL,
      "notificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "notificationProvider" TEXT,
      "providerMessageId" TEXT,
      "notificationError" TEXT,
      "notifiedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EventRegistration_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "EventRegistration_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_event_contact_key" ON "EventRegistration"("eventId", "contactType", "contactValue")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_createdAt_idx" ON "EventRegistration"("eventId", "createdAt")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventRegistration_userId_createdAt_idx" ON "EventRegistration"("userId", "createdAt")',
  )
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderStatus" TEXT NOT NULL DEFAULT \'PENDING\'',
    )
    console.log('Schema ensure: added EventRegistration.reminderStatus')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.reminderStatus already exists')
    } else {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderProvider" TEXT',
    )
    console.log('Schema ensure: added EventRegistration.reminderProvider')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.reminderProvider already exists')
    } else {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderMessageId" TEXT',
    )
    console.log('Schema ensure: added EventRegistration.reminderMessageId')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.reminderMessageId already exists')
    } else {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderError" TEXT',
    )
    console.log('Schema ensure: added EventRegistration.reminderError')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.reminderError already exists')
    } else {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderSentAt" DATETIME',
    )
    console.log('Schema ensure: added EventRegistration.reminderSentAt')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.reminderSentAt already exists')
    } else {
      throw error
    }
  }
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventRegistration_reminder_status_sent_idx" ON "EventRegistration"("reminderStatus", "reminderSentAt")',
  )
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "guestFullName" TEXT',
    )
    console.log('Schema ensure: added EventRegistration.guestFullName')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.guestFullName already exists')
    } else {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "EventRegistration" ADD COLUMN "guestPhone" TEXT')
    console.log('Schema ensure: added EventRegistration.guestPhone')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.guestPhone already exists')
    } else {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "guestTelegramTag" TEXT',
    )
    console.log('Schema ensure: added EventRegistration.guestTelegramTag')
  } catch (error) {
    if (isIgnorableAlterTableError(error)) {
      console.log('Schema ensure: EventRegistration.guestTelegramTag already exists')
    } else {
      throw error
    }
  }
  console.log('Schema ensure: EventRegistration table/indexes ready')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TelegramLinkToken" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "token" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "usedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TelegramLinkToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLinkToken_token_key" ON "TelegramLinkToken"("token")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "TelegramLinkToken_userId_expiresAt_idx" ON "TelegramLinkToken"("userId", "expiresAt")',
  )
  console.log('Schema ensure: TelegramLinkToken table/indexes ready')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TelegramGuestRegistrationToken" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "token" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "chatId" TEXT,
      "expiresAt" DATETIME NOT NULL,
      "usedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TelegramGuestRegistrationToken_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_token_key" ON "TelegramGuestRegistrationToken"("token")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_chatId_expiresAt_usedAt_idx" ON "TelegramGuestRegistrationToken"("chatId", "expiresAt", "usedAt")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_eventId_createdAt_idx" ON "TelegramGuestRegistrationToken"("eventId", "createdAt")',
  )
  console.log('Schema ensure: TelegramGuestRegistrationToken table/indexes ready')
}

void main()
  .catch((error) => {
    console.error('Schema ensure failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
