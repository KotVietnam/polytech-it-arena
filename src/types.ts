export type TrackId = 'cybersecurity' | 'networks' | 'devops' | 'sysadmin'

export type Level = 'Junior' | 'Middle' | 'Senior'

export interface EventItem {
  id: string
  date: string
  track: TrackId
  level: Level
  title: string
  duration: string
  location: string
  description: string
  registrationLink?: string | null
  createdAt?: string
  updatedAt?: string
}

export type UserRole = 'USER' | 'ADMIN'
export type RegistrationContactType = 'telegram' | 'whatsapp'
export type NotificationSendStatus = 'sent' | 'failed' | 'skipped'
export type PointActionType =
  | 'adminManual'
  | 'loginDaily'
  | 'eventRegistration'
  | 'telegramLink'

export interface UserRegistrationStat {
  id: string
  trackId: TrackId
  level: Level
  points: number
  date: string
}

export interface UserPointHistoryItem {
  id: string
  actionType: PointActionType
  points: number
  reason: string
  date: string
  eventTitle: string | null
}

export interface AuthUser {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  telegramContact: string | null
  telegramLinked: boolean
  telegramUsername: string | null
  role: UserRole
  totalPoints: number
  registrations: UserRegistrationStat[]
  pointHistory: UserPointHistoryItem[]
}

export type TeamMemberRole = 'OWNER' | 'MEMBER'

export interface TeamMemberItem {
  userId: string
  username: string
  displayName: string | null
  fullName: string | null
  role: TeamMemberRole
  joinedAt: string
}

export interface TeamPendingInviteItem {
  id: string
  inviteeUserId: string
  username: string
  displayName: string | null
  fullName: string | null
  createdAt: string
}

export interface TeamItem {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  isOwner: boolean
  members: TeamMemberItem[]
  pendingInvites: TeamPendingInviteItem[]
}

export interface IncomingTeamInviteItem {
  id: string
  teamId: string
  teamName: string
  inviterUserId: string
  inviterUsername: string
  inviterDisplayName: string | null
  inviterFullName: string | null
  createdAt: string
}

export interface TeamSearchUserItem {
  id: string
  username: string
  displayName: string | null
  fullName: string | null
  email: string | null
}

export interface ArchiveItem {
  id: string
  eventId: string
  summary: string
  materials: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
  event: EventItem
}

export interface EventRegistrationItem {
  id: string
  eventId: string
  userId: string | null
  contactType: RegistrationContactType
  contactValue: string
  guestFullName?: string | null
  guestPhone?: string | null
  guestTelegramTag?: string | null
  notification: {
    status: NotificationSendStatus
    error: string | null
  }
  createdAt: string
}

export interface TrackLevelConfig {
  goals: string[]
  tasks: string[]
  preparation: string[]
}

export interface TrackData {
  id: TrackId
  name: string
  summary: string
  whatYouWillLearn: string[]
  blueFlow: string[]
  redFlow: string[]
  levels: Record<Level, TrackLevelConfig>
  checklist: string[]
  accentClass: string
}

export interface TrackCard {
  id: TrackId
  title: string
  summary: string
  accentClass: string
}
