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
