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

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "firstName" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "lastName" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramContact" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "telegramLinkedAt" DATETIME')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramChatId_key" ON "User"("telegramChatId")',
  )

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
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderProvider" TEXT',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderMessageId" TEXT',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "EventRegistration" ADD COLUMN "reminderError" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "reminderSentAt" DATETIME',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventRegistration_reminder_status_sent_idx" ON "EventRegistration"("reminderStatus", "reminderSentAt")',
  )
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "EventRegistration" ADD COLUMN "guestFullName" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "EventRegistration" ADD COLUMN "guestPhone" TEXT')
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventRegistration" ADD COLUMN "guestTelegramTag" TEXT',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }

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
}
