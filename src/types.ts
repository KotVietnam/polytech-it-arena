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

export interface AuthUser {
  id: string
  username: string
  displayName: string | null
  email: string | null
  role: UserRole
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
