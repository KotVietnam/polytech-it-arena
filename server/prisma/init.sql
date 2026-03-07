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
);

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
);

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
);

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

CREATE TABLE IF NOT EXISTS "Team" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Team_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

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
);

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
CREATE UNIQUE INDEX IF NOT EXISTS "UserPointEntry_dedupeKey_key" ON "UserPointEntry"("dedupeKey");
CREATE INDEX IF NOT EXISTS "UserPointEntry_userId_createdAt_idx" ON "UserPointEntry"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "UserPointEntry_actionType_createdAt_idx" ON "UserPointEntry"("actionType", "createdAt");
CREATE INDEX IF NOT EXISTS "UserPointEntry_eventId_createdAt_idx" ON "UserPointEntry"("eventId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EventLiveMatch_eventId_key" ON "EventLiveMatch"("eventId");
CREATE INDEX IF NOT EXISTS "EventLiveMatch_createdAt_idx" ON "EventLiveMatch"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EventLiveTeamAssignment_match_registration_key" ON "EventLiveTeamAssignment"("matchId", "registrationId");
CREATE INDEX IF NOT EXISTS "EventLiveTeamAssignment_match_team_idx" ON "EventLiveTeamAssignment"("matchId", "team");
CREATE INDEX IF NOT EXISTS "EventLiveScoreEntry_match_createdAt_idx" ON "EventLiveScoreEntry"("matchId", "createdAt");
CREATE INDEX IF NOT EXISTS "EventLiveScoreEntry_match_team_createdAt_idx" ON "EventLiveScoreEntry"("matchId", "team", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLinkToken_token_key" ON "TelegramLinkToken"("token");
CREATE INDEX IF NOT EXISTS "TelegramLinkToken_userId_expiresAt_idx" ON "TelegramLinkToken"("userId", "expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_token_key" ON "TelegramGuestRegistrationToken"("token");
CREATE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_chatId_expiresAt_usedAt_idx" ON "TelegramGuestRegistrationToken"("chatId", "expiresAt", "usedAt");
CREATE INDEX IF NOT EXISTS "TelegramGuestRegistrationToken_eventId_createdAt_idx" ON "TelegramGuestRegistrationToken"("eventId", "createdAt");
CREATE INDEX IF NOT EXISTS "Team_createdById_createdAt_idx" ON "Team"("createdById", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_createdAt_idx" ON "TeamMember"("userId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvite_teamId_inviteeId_status_key" ON "TeamInvite"("teamId", "inviteeId", "status");
CREATE INDEX IF NOT EXISTS "TeamInvite_inviteeId_status_createdAt_idx" ON "TeamInvite"("inviteeId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "TeamInvite_teamId_status_createdAt_idx" ON "TeamInvite"("teamId", "status", "createdAt");
