PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "displayName" TEXT,
  "email" TEXT,
  "phoneNumber" TEXT,
  "telegramContact" TEXT,
  "telegramChatId" TEXT,
  "telegramUsername" TEXT,
  "telegramLinkedAt" DATETIME,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "lastLoginAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "track" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "registrationLink" TEXT,
  "startsAt" DATETIME NOT NULL,
  "createdById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Event_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ArchiveEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "materials" TEXT NOT NULL,
  "publishedAt" DATETIME NOT NULL,
  "createdById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ArchiveEntry_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ArchiveEntry_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EventRegistration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "userId" TEXT,
  "contactType" TEXT NOT NULL,
  "contactValue" TEXT NOT NULL,
  "guestFullName" TEXT,
  "guestPhone" TEXT,
  "guestTelegramTag" TEXT,
  "notificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "notificationProvider" TEXT,
  "providerMessageId" TEXT,
  "notificationError" TEXT,
  "notifiedAt" DATETIME,
  "reminderStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "reminderProvider" TEXT,
  "reminderMessageId" TEXT,
  "reminderError" TEXT,
  "reminderSentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventRegistration_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventRegistration_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

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
);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramChatId_key" ON "User"("telegramChatId");
CREATE INDEX IF NOT EXISTS "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX IF NOT EXISTS "Event_track_level_idx" ON "Event"("track", "level");
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveEntry_eventId_key" ON "ArchiveEntry"("eventId");
CREATE INDEX IF NOT EXISTS "ArchiveEntry_publishedAt_idx" ON "ArchiveEntry"("publishedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventRegistration_event_contact_key" ON "EventRegistration"("eventId", "contactType", "contactValue");
CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_createdAt_idx" ON "EventRegistration"("eventId", "createdAt");
CREATE INDEX IF NOT EXISTS "EventRegistration_userId_createdAt_idx" ON "EventRegistration"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "EventRegistration_reminder_status_sent_idx" ON "EventRegistration"("reminderStatus", "reminderSentAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLinkToken_token_key" ON "TelegramLinkToken"("token");
CREATE INDEX IF NOT EXISTS "TelegramLinkToken_userId_expiresAt_idx" ON "TelegramLinkToken"("userId", "expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_token_key" ON "TelegramGuestRegistrationToken"("token");
CREATE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_chatId_expiresAt_usedAt_idx" ON "TelegramGuestRegistrationToken"("chatId", "expiresAt", "usedAt");
CREATE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_eventId_createdAt_idx" ON "TelegramGuestRegistrationToken"("eventId", "createdAt");
