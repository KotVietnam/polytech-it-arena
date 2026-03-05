import type { EventItem } from '../types'

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const longDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
})

export const formatDateTime = (isoDate: string) =>
  dateTimeFormatter.format(new Date(isoDate))

export const formatLongDate = (isoDate: string) =>
  longDateFormatter.format(new Date(isoDate))

export const formatShortDate = (isoDate: string) =>
  shortDateFormatter.format(new Date(isoDate))

export const sortEventsByDate = (items: EventItem[]) =>
  [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

export const getNearestEvent = (
  items: EventItem[],
  referenceDate = new Date(),
): EventItem | null => {
  if (!items.length) {
    return null
  }

  const sorted = sortEventsByDate(items)
  const referenceTime = referenceDate.getTime()
  const upcoming = sorted.find(
    (item) => new Date(item.date).getTime() >= referenceTime,
  )

  return upcoming ?? sorted[0]
}

const DEFAULT_EVENT_DURATION_MINUTES = 120

export const parseEventDurationToMinutes = (value: string): number => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return DEFAULT_EVENT_DURATION_MINUTES
  }

  const hhmmMatch = /^(\d{1,2}):(\d{1,2})$/.exec(normalized)
  if (hhmmMatch) {
    const hours = Number(hhmmMatch[1])
    const minutes = Number(hhmmMatch[2])
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const total = hours * 60 + minutes
      return total > 0 ? total : DEFAULT_EVENT_DURATION_MINUTES
    }
  }

  let minutes = 0

  const hoursMatch = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:ч|час|часа|часов|h|hr|hrs|hour|hours)\b/,
  )
  if (hoursMatch) {
    const hours = Number(hoursMatch[1].replace(',', '.'))
    if (Number.isFinite(hours) && hours > 0) {
      minutes += Math.round(hours * 60)
    }
  }

  const minutesMatch = normalized.match(/(\d+)\s*(?:м|мин|min|minute|minutes)\b/)
  if (minutesMatch) {
    const mins = Number(minutesMatch[1])
    if (Number.isFinite(mins) && mins > 0) {
      minutes += mins
    }
  }

  if (minutes > 0) {
    return minutes
  }

  const numberOnlyMatch = normalized.match(/^(\d{1,3})$/)
  if (numberOnlyMatch) {
    const valueAsNumber = Number(numberOnlyMatch[1])
    if (Number.isFinite(valueAsNumber) && valueAsNumber > 0) {
      return valueAsNumber
    }
  }

  return DEFAULT_EVENT_DURATION_MINUTES
}

export const getEventEndDate = (event: EventItem) => {
  const startsAtMs = new Date(event.date).getTime()
  const durationMinutes = parseEventDurationToMinutes(event.duration)
  return new Date(startsAtMs + durationMinutes * 60_000)
}

export const getCurrentEvent = (
  items: EventItem[],
  referenceDate = new Date(),
): EventItem | null => {
  if (!items.length) {
    return null
  }

  const now = referenceDate.getTime()
  const sorted = sortEventsByDate(items)

  const active = sorted
    .filter((item) => {
      const startsAt = new Date(item.date).getTime()
      const endsAt = getEventEndDate(item).getTime()
      return startsAt <= now && endsAt > now
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return active[0] ?? null
}
