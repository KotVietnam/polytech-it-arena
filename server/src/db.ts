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
    CREATE TABLE IF NOT EXISTS "UserPointEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "createdById" TEXT,
      "eventId" TEXT,
      "actionType" TEXT NOT NULL,
      "points" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "dedupeKey" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserPointEntry_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserPointEntry_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "UserPointEntry_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "UserPointEntry_dedupeKey_key" ON "UserPointEntry"("dedupeKey")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "UserPointEntry_userId_createdAt_idx" ON "UserPointEntry"("userId", "createdAt")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "UserPointEntry_actionType_createdAt_idx" ON "UserPointEntry"("actionType", "createdAt")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "UserPointEntry_eventId_createdAt_idx" ON "UserPointEntry"("eventId", "createdAt")',
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventLiveMatch" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "timerStatus" TEXT NOT NULL DEFAULT 'IDLE',
      "timerElapsedSeconds" INTEGER NOT NULL DEFAULT 0,
      "timerLastStartedAt" DATETIME,
      "createdById" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "EventLiveMatch_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "EventLiveMatch_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventLiveMatch" ADD COLUMN "timerStatus" TEXT NOT NULL DEFAULT \'IDLE\'',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventLiveMatch" ADD COLUMN "timerElapsedSeconds" INTEGER NOT NULL DEFAULT 0',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "EventLiveMatch" ADD COLUMN "timerLastStartedAt" DATETIME',
    )
  } catch (error) {
    if (!isIgnorableAlterTableError(error)) {
      throw error
    }
  }
  await prisma.$executeRawUnsafe(
    'UPDATE "EventLiveMatch" SET "timerStatus" = \'IDLE\' WHERE "timerStatus" IS NULL',
  )
  await prisma.$executeRawUnsafe(
    'UPDATE "EventLiveMatch" SET "timerElapsedSeconds" = 0 WHERE "timerElapsedSeconds" IS NULL',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "EventLiveMatch_eventId_key" ON "EventLiveMatch"("eventId")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventLiveMatch_createdAt_idx" ON "EventLiveMatch"("createdAt")',
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventLiveTeamAssignment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "matchId" TEXT NOT NULL,
      "registrationId" TEXT NOT NULL,
      "team" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EventLiveTeamAssignment_matchId_fkey"
        FOREIGN KEY ("matchId") REFERENCES "EventLiveMatch" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "EventLiveTeamAssignment_registrationId_fkey"
        FOREIGN KEY ("registrationId") REFERENCES "EventRegistration" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "EventLiveTeamAssignment_match_registration_key" ON "EventLiveTeamAssignment"("matchId", "registrationId")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventLiveTeamAssignment_match_team_idx" ON "EventLiveTeamAssignment"("matchId", "team")',
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EventLiveScoreEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "matchId" TEXT NOT NULL,
      "createdById" TEXT,
      "team" TEXT NOT NULL,
      "points" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EventLiveScoreEntry_matchId_fkey"
        FOREIGN KEY ("matchId") REFERENCES "EventLiveMatch" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "EventLiveScoreEntry_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventLiveScoreEntry_match_createdAt_idx" ON "EventLiveScoreEntry"("matchId", "createdAt")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "EventLiveScoreEntry_match_team_createdAt_idx" ON "EventLiveScoreEntry"("matchId", "team", "createdAt")',
  )

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

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Team" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Team_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "Team_createdById_createdAt_idx" ON "Team"("createdById", "createdAt")',
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TeamMember" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "teamId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'MEMBER',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TeamMember_teamId_fkey"
        FOREIGN KEY ("teamId") REFERENCES "Team" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "TeamMember_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "TeamMember_userId_createdAt_idx" ON "TeamMember"("userId", "createdAt")',
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TeamInvite" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "teamId" TEXT NOT NULL,
      "inviterId" TEXT NOT NULL,
      "inviteeId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "respondedAt" DATETIME,
      CONSTRAINT "TeamInvite_teamId_fkey"
        FOREIGN KEY ("teamId") REFERENCES "Team" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "TeamInvite_inviterId_fkey"
        FOREIGN KEY ("inviterId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "TeamInvite_inviteeId_fkey"
        FOREIGN KEY ("inviteeId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvite_teamId_inviteeId_status_key" ON "TeamInvite"("teamId", "inviteeId", "status")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "TeamInvite_inviteeId_status_createdAt_idx" ON "TeamInvite"("inviteeId", "status", "createdAt")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "TeamInvite_teamId_status_createdAt_idx" ON "TeamInvite"("teamId", "status", "createdAt")',
  )
}
