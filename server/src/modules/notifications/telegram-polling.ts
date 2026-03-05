import { env } from '../../config/env.js'
import { prisma } from '../../db.js'
import { parseTelegramStartPayload } from '../auth/telegram-link.js'
import { createGuestEventRegistration } from '../registrations/service.js'
import { sendNotification } from './service.js'

interface TelegramUser {
  id: number
  username?: string
}

interface TelegramChat {
  id: number
}

interface TelegramMessage {
  text?: string
  from?: TelegramUser
  chat: TelegramChat
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

const TELEGRAM_POLL_INTERVAL_MS = 2500
const TELEGRAM_UPDATES_TIMEOUT_SEC = 20
const AUTH_START_PREFIX = 'auth_'
const pendingAuthTokensByChatId = new Map<string, string>()

const buildApiUrl = (method: string, search?: URLSearchParams) => {
  const baseUrl = `${env.TELEGRAM_BOT_API_URL.replace(/\/$/, '')}/bot${env.TELEGRAM_BOT_TOKEN}`
  if (!search) {
    return `${baseUrl}/${method}`
  }

  return `${baseUrl}/${method}?${search.toString()}`
}

const sendBotMessage = async (chatId: string, text: string) => {
  await sendNotification('telegram', chatId, text)
}

const normalizeAuthTokenInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith(AUTH_START_PREFIX)) {
    const token = trimmed.slice(AUTH_START_PREFIX.length).trim()
    return token || null
  }
  return trimmed
}

const parseGuestNameValue = (value: string) =>
  value
    .replace(
      /^\s*(?:\d+[.)-]?\s*)?(?:фио|ф\.?\s*и\.?\s*о\.?|full\s*name|name)\s*[:\-]?\s*/i,
      '',
    )
    .trim()

const parseGuestPhoneValue = (value: string) =>
  value
    .replace(
      /^\s*(?:\d+[.)-]?\s*)?(?:телефон|номер\s*телефона|phone|mobile)\s*[:\-]?\s*/i,
      '',
    )
    .trim()

const parseGuestRegistrationMessage = (text: string) => {
  const normalized = text.replace(/\r/g, '').trim()
  if (!normalized || normalized.startsWith('/')) {
    return null
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  let fullName = ''
  let phoneRaw = ''

  if (lines.length >= 2) {
    fullName = parseGuestNameValue(lines[0])
    phoneRaw = parseGuestPhoneValue(lines[1])
  } else {
    const phoneMatch = normalized.match(/(\+?\d[\d\s().-]{7,})/)
    if (!phoneMatch) {
      return null
    }
    phoneRaw = parseGuestPhoneValue(phoneMatch[1])
    fullName = parseGuestNameValue(normalized.replace(phoneMatch[1], ' '))
  }

  const normalizedName = fullName.replace(/\s+/g, ' ').trim()
  const nameParts = normalizedName.split(/\s+/).filter(Boolean)
  if (normalizedName.length < 5 || normalizedName.length > 160 || nameParts.length < 2) {
    return null
  }

  const phoneDigits = phoneRaw.replace(/\D+/g, '')
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    return null
  }

  return {
    fullName: normalizedName,
    phone: phoneDigits,
  }
}

const getAuthTokenStatus = async (token: string) => {
  const linkToken = await prisma.telegramLinkToken.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  })

  if (!linkToken) {
    return { status: 'invalid' as const, linkToken: null }
  }
  if (linkToken.usedAt) {
    return { status: 'used' as const, linkToken }
  }
  if (linkToken.expiresAt.getTime() < Date.now()) {
    return { status: 'expired' as const, linkToken }
  }

  return { status: 'valid' as const, linkToken }
}

const completeAuthLink = async (params: {
  tokenId: string
  userId: string
  chatId: string
  username: string | null
}) => {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: {
        telegramChatId: params.chatId,
        telegramUsername: params.username,
        telegramLinkedAt: new Date(),
      },
    }),
    prisma.telegramLinkToken.update({
      where: { id: params.tokenId },
      data: { usedAt: new Date() },
    }),
    prisma.telegramLinkToken.updateMany({
      where: {
        userId: params.userId,
        usedAt: null,
        id: { not: params.tokenId },
      },
      data: { usedAt: new Date() },
    }),
  ])

  pendingAuthTokensByChatId.delete(params.chatId)
  await sendBotMessage(
    params.chatId,
    [
      'Авторизация Telegram успешно завершена.',
      'Теперь уведомления о регистрации на соревнования будут приходить сюда автоматически.',
      'Возвращайтесь на сайт и подтверждайте запись.',
    ].join('\n'),
  )
}

const handleAuthStartPayload = async (token: string, chatId: string) => {
  const status = await getAuthTokenStatus(token)
  if (status.status === 'invalid') {
    await sendBotMessage(
      chatId,
      'Ссылка авторизации недействительна. Вернитесь на сайт и начните привязку заново.',
    )
    return
  }
  if (status.status === 'used') {
    await sendBotMessage(
      chatId,
      'Этот код уже был использован. Уведомления уже активированы для вашего аккаунта.',
    )
    return
  }
  if (status.status === 'expired') {
    await sendBotMessage(
      chatId,
      'Срок действия кода истек. Вернитесь на сайт и повторите привязку Telegram.',
    )
    return
  }

  pendingAuthTokensByChatId.set(chatId, token)
  await sendBotMessage(
    chatId,
    [
      'Код авторизации получен.',
      'Для завершения отправьте команду:',
      '/auth',
    ].join('\n'),
  )
}

const handleAuthCommand = async (chatId: string, username: string | null, tokenInput: string | null) => {
  const requestedToken = tokenInput ? normalizeAuthTokenInput(tokenInput) : null
  const token = requestedToken ?? pendingAuthTokensByChatId.get(chatId) ?? null

  if (!token) {
    await sendBotMessage(
      chatId,
      'Код авторизации не найден. Откройте ссылку привязки с сайта и затем отправьте /auth.',
    )
    return
  }

  const status = await getAuthTokenStatus(token)
  if (status.status === 'invalid') {
    pendingAuthTokensByChatId.delete(chatId)
    await sendBotMessage(
      chatId,
      'Код /auth недействителен. Сгенерируйте новую ссылку привязки на сайте.',
    )
    return
  }
  if (status.status === 'used') {
    pendingAuthTokensByChatId.delete(chatId)
    await sendBotMessage(chatId, 'Этот код уже использован. Telegram уже привязан.')
    return
  }
  if (status.status === 'expired') {
    pendingAuthTokensByChatId.delete(chatId)
    await sendBotMessage(chatId, 'Срок действия кода /auth истек. Получите новую ссылку на сайте.')
    return
  }

  await completeAuthLink({
    tokenId: status.linkToken.id,
    userId: status.linkToken.userId,
    chatId,
    username,
  })
}

const handleGuestStartPayload = async (token: string, chatId: string) => {
  const guestToken = await prisma.telegramGuestRegistrationToken.findUnique({
    where: { token },
    select: {
      id: true,
      eventId: true,
      expiresAt: true,
      usedAt: true,
      event: {
        select: {
          title: true,
        },
      },
    },
  })

  if (!guestToken) {
    await sendBotMessage(
      chatId,
      'Ссылка гостевой регистрации недействительна. Вернитесь на сайт и откройте QR заново.',
    )
    return
  }

  if (guestToken.usedAt) {
    await sendBotMessage(chatId, 'Эта ссылка уже использована. Запросите новую на сайте.')
    return
  }

  if (guestToken.expiresAt.getTime() < Date.now()) {
    await sendBotMessage(chatId, 'Срок действия гостевой ссылки истек. Запросите новый QR на сайте.')
    return
  }

  await prisma.telegramGuestRegistrationToken.update({
    where: { id: guestToken.id },
    data: { chatId },
  })

  await sendBotMessage(
    chatId,
    [
      `Привет! Вы открыли регистрацию на событие: ${guestToken.event.title}`,
      'Напиши свои данные в таком порядке:',
      '1. ФИО',
      '2. Номер телефона',
    ].join('\n'),
  )
}

const tryHandleGuestDataMessage = async (
  chatId: string,
  username: string | null,
  text: string,
) => {
  const activeGuestToken = await prisma.telegramGuestRegistrationToken.findFirst({
    where: {
      chatId,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      eventId: true,
      event: {
        select: {
          title: true,
        },
      },
    },
  })

  if (!activeGuestToken) {
    return false
  }

  const parsed = parseGuestRegistrationMessage(text)
  if (!parsed) {
    await sendBotMessage(
      chatId,
      [
        'Не удалось распознать данные.',
        'Отправьте одним сообщением в формате:',
        '1. ФИО',
        '2. Номер телефона',
      ].join('\n'),
    )
    return true
  }

  const telegramTag = username ? `@${username.replace(/^@/, '')}` : chatId

  try {
    const result = await createGuestEventRegistration({
      eventId: activeGuestToken.eventId,
      fullName: parsed.fullName,
      phone: parsed.phone,
      telegramTag,
    })

    await prisma.telegramGuestRegistrationToken.update({
      where: { id: activeGuestToken.id },
      data: { usedAt: new Date() },
    })

    if (!result.created) {
      await sendBotMessage(
        chatId,
        `Вы уже были зарегистрированы на событие "${activeGuestToken.event.title}".`,
      )
      return true
    }

    await sendBotMessage(
      chatId,
      [
        'Готово! Гостевая регистрация подтверждена.',
        `Событие: ${activeGuestToken.event.title}`,
        `ФИО: ${parsed.fullName}`,
        `Телефон: ${parsed.phone}`,
      ].join('\n'),
    )
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'EVENT_NOT_FOUND'
        ? 'Событие не найдено. Откройте регистрацию на сайте заново.'
        : 'Не удалось завершить регистрацию. Повторите попытку через сайт.'
    await sendBotMessage(chatId, message)
  }

  return true
}

const sendDefaultBotHelp = async (chatId: string) => {
  await sendBotMessage(
    chatId,
    [
      'POLYTECH IT ARENA BOT',
      'Для привязки аккаунта откройте ссылку с сайта, затем отправьте /auth.',
      'Для гостевой регистрации откройте QR с сайта и отправьте: ФИО + номер телефона.',
    ].join('\n'),
  )
}

const handleTelegramMessage = async (message: TelegramMessage) => {
  const text = message.text?.trim()
  if (!text) {
    return
  }

  const chatId = String(message.chat.id)
  const username = message.from?.username ?? null

  const startPayload = parseTelegramStartPayload(text)
  if (startPayload) {
    if (startPayload.kind === 'auth') {
      await handleAuthStartPayload(startPayload.token, chatId)
      return
    }
    await handleGuestStartPayload(startPayload.token, chatId)
    return
  }

  const authCommandMatch = /^\/auth(?:@[\w_]+)?(?:\s+(.+))?$/i.exec(text)
  if (authCommandMatch) {
    const tokenInput = authCommandMatch[1]?.trim() ?? null
    await handleAuthCommand(chatId, username, tokenInput)
    return
  }

  const guestHandled = await tryHandleGuestDataMessage(chatId, username, text)
  if (guestHandled) {
    return
  }

  await sendDefaultBotHelp(chatId)
}

const fetchUpdates = async (offset: number): Promise<TelegramUpdate[]> => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return []
  }

  const search = new URLSearchParams({
    offset: String(offset),
    timeout: String(TELEGRAM_UPDATES_TIMEOUT_SEC),
    allowed_updates: JSON.stringify(['message']),
  })

  try {
    const response = await fetch(buildApiUrl('getUpdates', search))
    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as {
      ok?: boolean
      result?: TelegramUpdate[]
    }

    if (!payload.ok || !Array.isArray(payload.result)) {
      return []
    }

    return payload.result
  } catch {
    return []
  }
}

export const startTelegramPolling = () => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return () => undefined
  }

  let offset = 0
  let stopped = false
  let tickTimer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false

  const tick = async () => {
    if (stopped || inFlight) {
      return
    }

    inFlight = true
    try {
      const updates = await fetchUpdates(offset)
      for (const update of updates) {
        offset = Math.max(offset, update.update_id + 1)
        if (update.message) {
          await handleTelegramMessage(update.message)
        }
      }
    } finally {
      inFlight = false
      if (!stopped) {
        tickTimer = setTimeout(() => {
          void tick()
        }, TELEGRAM_POLL_INTERVAL_MS)
      }
    }
  }

  void tick()

  return () => {
    stopped = true
    if (tickTimer) {
      clearTimeout(tickTimer)
    }
  }
}
