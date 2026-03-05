import {
  NotificationDeliveryStatus,
  RegistrationContactType,
} from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../db.js'
import {
  type NotificationChannel,
  sendNotification,
  sendAdminTelegramAlert,
} from '../notifications/service.js'

const trackNameMap = {
  cybersecurity: 'CyberSecurity',
  networks: 'Networks',
  devops: 'DevOps',
  sysadmin: 'SysAdmin',
} as const

const levelNameMap = {
  Junior: 'Junior',
  Middle: 'Middle',
  Senior: 'Senior',
} as const

const formatEventDate = (value: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Almaty',
  }).format(value)

const toContactType = (value: 'telegram' | 'whatsapp') =>
  value === 'telegram' ? RegistrationContactType.TELEGRAM : RegistrationContactType.WHATSAPP

const toNotificationStatus = (value: 'sent' | 'failed' | 'skipped') => {
  if (value === 'sent') {
    return NotificationDeliveryStatus.SENT
  }
  if (value === 'skipped') {
    return NotificationDeliveryStatus.SKIPPED
  }
  return NotificationDeliveryStatus.FAILED
}

const formatContactValue = (type: 'telegram' | 'whatsapp', contact: string) => {
  const trimmed = contact.trim()
  if (type === 'telegram') {
    if (/^-?\d+$/.test(trimmed)) {
      return trimmed
    }
    return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
  }
  return trimmed.replace(/\D+/g, '')
}

const normalizeGuestPhone = (phone: string) => phone.trim().replace(/\D+/g, '')

const normalizeGuestTelegramTag = (value: string) => {
  const trimmed = value.trim()
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

const toNotificationResultDto = (registration: {
  notificationStatus: NotificationDeliveryStatus
  notificationError: string | null
}) => ({
  status:
    registration.notificationStatus === NotificationDeliveryStatus.SENT
      ? ('sent' as const)
      : registration.notificationStatus === NotificationDeliveryStatus.SKIPPED
        ? ('skipped' as const)
        : ('failed' as const),
  error: registration.notificationError,
})

const toRegistrationDto = (registration: {
  id: string
  eventId: string
  userId: string | null
  contactType: RegistrationContactType
  contactValue: string
  guestFullName: string | null
  guestPhone: string | null
  guestTelegramTag: string | null
  notificationStatus: NotificationDeliveryStatus
  notificationError: string | null
  createdAt: Date
}) => ({
  id: registration.id,
  eventId: registration.eventId,
  userId: registration.userId,
  contactType:
    registration.contactType === RegistrationContactType.TELEGRAM
      ? ('telegram' as const)
      : ('whatsapp' as const),
  contactValue: registration.contactValue,
  guestFullName: registration.guestFullName,
  guestPhone: registration.guestPhone,
  guestTelegramTag: registration.guestTelegramTag,
  notification: toNotificationResultDto(registration),
  createdAt: registration.createdAt.toISOString(),
})

const buildRegistrationMessage = (params: {
  eventTitle: string
  eventDate: Date
  track: keyof typeof trackNameMap
  level: keyof typeof levelNameMap
  eventLink: string
}) =>
  [
    'POLYTECH IT ARENA',
    '',
    'Вы успешно зарегистрированы на событие.',
    `Соревнование: ${params.eventTitle}`,
    `Трек: ${trackNameMap[params.track]} / ${levelNameMap[params.level]}`,
    `Дата: ${formatEventDate(params.eventDate)}`,
    `Детали: ${params.eventLink}`,
  ].join('\n')

const buildGuestRegistrationAdminMessage = (params: {
  eventTitle: string
  eventDate: Date
  track: keyof typeof trackNameMap
  level: keyof typeof levelNameMap
  fullName: string
  phone: string
  telegramTag: string
}) =>
  [
    'НОВАЯ РЕГИСТРАЦИЯ ГОСТЯ',
    '',
    `Соревнование: ${params.eventTitle}`,
    `Трек: ${trackNameMap[params.track]} / ${levelNameMap[params.level]}`,
    `Дата события: ${formatEventDate(params.eventDate)}`,
    '',
    `ФИО: ${params.fullName}`,
    `Телефон: ${params.phone}`,
    `Telegram: ${params.telegramTag}`,
  ].join('\n')

const buildAuthorizedRegistrationAdminMessage = (params: {
  eventTitle: string
  eventDate: Date
  track: keyof typeof trackNameMap
  level: keyof typeof levelNameMap
  username: string
  displayName: string | null
  email: string | null
  telegramUsername: string | null
  telegramChatId: string
}) =>
  [
    'НОВАЯ РЕГИСТРАЦИЯ УЧАСТНИКА',
    '',
    `Соревнование: ${params.eventTitle}`,
    `Трек: ${trackNameMap[params.track]} / ${levelNameMap[params.level]}`,
    `Дата события: ${formatEventDate(params.eventDate)}`,
    '',
    'Тип участника: Авторизованный',
    `Логин: ${params.username}`,
    `ФИО: ${params.displayName ?? '-'}`,
    `Email: ${params.email ?? '-'}`,
    `Telegram username: ${params.telegramUsername ? `@${params.telegramUsername.replace(/^@/, '')}` : '-'}`,
    `Telegram chat id: ${params.telegramChatId}`,
  ].join('\n')

const notifyAdminsAboutRegistration = async (message: string) => {
  const result = await sendAdminTelegramAlert(message)
  if (result.status !== 'sent') {
    console.error('[admin-notify] failed to deliver participant alert:', result.error)
  }
}

export const createEventRegistration = async (params: {
  eventId: string
  userId?: string
  contactType: 'telegram' | 'whatsapp'
  contact: string
  participantInfo?: {
    username: string
    displayName: string | null
    email: string | null
    telegramUsername: string | null
  }
}) => {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      title: true,
      track: true,
      level: true,
      startsAt: true,
      registrationLink: true,
    },
  })

  if (!event) {
    throw new Error('EVENT_NOT_FOUND')
  }

  const contactType = toContactType(params.contactType)
  const contactValue = formatContactValue(params.contactType, params.contact)

  const existing = await prisma.eventRegistration.findFirst({
    where: params.userId
      ? {
          eventId: params.eventId,
          userId: params.userId,
        }
      : {
          eventId: params.eventId,
          contactType,
          contactValue,
        },
  })

  if (existing) {
    return {
      created: false,
      item: toRegistrationDto(existing),
    }
  }

  const createdRegistration = await prisma.eventRegistration.create({
    data: {
      eventId: params.eventId,
      userId: params.userId ?? null,
      contactType,
      contactValue,
      guestFullName: null,
      guestPhone: null,
      guestTelegramTag: null,
      notificationStatus: NotificationDeliveryStatus.PENDING,
    },
  })

  const channel: NotificationChannel = params.contactType
  const eventLink =
    event.registrationLink?.trim() ||
    `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/calendar?register=${encodeURIComponent(event.id)}`

  const message = buildRegistrationMessage({
    eventTitle: event.title,
    eventDate: event.startsAt,
    track: event.track,
    level: event.level,
    eventLink,
  })

  const notificationResult = await sendNotification(channel, contactValue, message)

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: createdRegistration.id },
    data: {
      notificationStatus: toNotificationStatus(notificationResult.status),
      notificationProvider: notificationResult.provider,
      providerMessageId: notificationResult.providerMessageId,
      notificationError: notificationResult.error,
      notifiedAt: new Date(),
    },
  })

  if (params.participantInfo && params.userId) {
    const adminMessage = buildAuthorizedRegistrationAdminMessage({
      eventTitle: event.title,
      eventDate: event.startsAt,
      track: event.track,
      level: event.level,
      username: params.participantInfo.username,
      displayName: params.participantInfo.displayName,
      email: params.participantInfo.email,
      telegramUsername: params.participantInfo.telegramUsername,
      telegramChatId: contactValue,
    })
    await notifyAdminsAboutRegistration(adminMessage)
  }

  return {
    created: true,
    item: toRegistrationDto(updatedRegistration),
  }
}

export const createGuestEventRegistration = async (params: {
  eventId: string
  fullName: string
  phone: string
  telegramTag: string
}) => {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      title: true,
      track: true,
      level: true,
      startsAt: true,
    },
  })

  if (!event) {
    throw new Error('EVENT_NOT_FOUND')
  }

  const fullName = params.fullName.trim()
  const phone = normalizeGuestPhone(params.phone)
  const telegramTag = normalizeGuestTelegramTag(params.telegramTag)

  const existing = await prisma.eventRegistration.findFirst({
    where: {
      eventId: params.eventId,
      contactType: RegistrationContactType.WHATSAPP,
      contactValue: phone,
    },
  })

  if (existing) {
    return {
      created: false,
      item: toRegistrationDto(existing),
    }
  }

  const createdRegistration = await prisma.eventRegistration.create({
    data: {
      eventId: params.eventId,
      userId: null,
      contactType: RegistrationContactType.WHATSAPP,
      contactValue: phone,
      guestFullName: fullName,
      guestPhone: phone,
      guestTelegramTag: telegramTag,
      notificationStatus: NotificationDeliveryStatus.PENDING,
    },
  })

  const adminMessage = buildGuestRegistrationAdminMessage({
    eventTitle: event.title,
    eventDate: event.startsAt,
    track: event.track,
    level: event.level,
    fullName,
    phone,
    telegramTag,
  })

  const adminNotification = await sendAdminTelegramAlert(adminMessage)

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: createdRegistration.id },
    data: {
      notificationStatus: toNotificationStatus(adminNotification.status),
      notificationProvider: adminNotification.provider,
      providerMessageId: adminNotification.providerMessageId,
      notificationError: adminNotification.error,
      notifiedAt: new Date(),
    },
  })

  return {
    created: true,
    item: toRegistrationDto(updatedRegistration),
  }
}

export const createEventRegistrationForAuthorizedUser = async (params: {
  eventId: string
  userId: string
}) => {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      username: true,
      displayName: true,
      email: true,
      telegramUsername: true,
      telegramChatId: true,
    },
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  if (!user.telegramChatId) {
    throw new Error('TELEGRAM_NOT_LINKED')
  }

  return createEventRegistration({
    eventId: params.eventId,
    userId: params.userId,
    contactType: 'telegram',
    contact: user.telegramChatId,
    participantInfo: {
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      telegramUsername: user.telegramUsername,
    },
  })
}
