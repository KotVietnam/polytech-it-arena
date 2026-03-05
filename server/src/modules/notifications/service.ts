import { Role } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../db.js'

export type NotificationChannel = 'telegram' | 'whatsapp'
export type NotificationSendStatus = 'sent' | 'failed' | 'skipped'

export interface NotificationSendResult {
  status: NotificationSendStatus
  provider: 'telegram' | 'whatsapp'
  providerMessageId: string | null
  error: string | null
}

const parseAdminTelegramRecipients = () =>
  (env.TELEGRAM_ADMIN_CHAT_IDS ?? '')
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const loadAdminRecipientsFromDatabase = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: Role.ADMIN,
      telegramChatId: {
        not: null,
      },
    },
    select: {
      telegramChatId: true,
    },
  })

  return admins
    .map((item) => item.telegramChatId)
    .filter((value): value is string => Boolean(value))
}

const normalizeTelegramRecipient = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^-?\d+$/.test(trimmed)) {
    return trimmed
  }

  const withPrefix = trimmed.startsWith('@') ? trimmed : `@${trimmed}`
  if (!/^@[a-zA-Z0-9_]{5,32}$/.test(withPrefix)) {
    return null
  }

  return withPrefix
}

const normalizeWhatsappPhone = (value: string) => {
  const digits = value.replace(/\D+/g, '')
  if (digits.length < 8 || digits.length > 15) {
    return null
  }
  return digits
}

const sendViaTelegram = async (
  recipient: string,
  message: string,
): Promise<NotificationSendResult> => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return {
      status: 'skipped',
      provider: 'telegram',
      providerMessageId: null,
      error: 'Telegram bot token is not configured',
    }
  }

  const chatId = normalizeTelegramRecipient(recipient)
  if (!chatId) {
    return {
      status: 'failed',
      provider: 'telegram',
      providerMessageId: null,
      error: 'Invalid Telegram recipient. Use @username or numeric chat id.',
    }
  }

  const url = `${env.TELEGRAM_BOT_API_URL.replace(/\/$/, '')}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: boolean
          description?: string
          result?: { message_id?: number | string }
        }
      | null

    if (!response.ok || !payload?.ok) {
      return {
        status: 'failed',
        provider: 'telegram',
        providerMessageId: null,
        error: payload?.description ?? `Telegram send failed with HTTP ${response.status}`,
      }
    }

    return {
      status: 'sent',
      provider: 'telegram',
      providerMessageId:
        payload.result?.message_id !== undefined ? String(payload.result.message_id) : null,
      error: null,
    }
  } catch (error) {
    return {
      status: 'failed',
      provider: 'telegram',
      providerMessageId: null,
      error: error instanceof Error ? error.message : 'Telegram request failed',
    }
  }
}

const sendViaWhatsapp = async (
  phone: string,
  message: string,
): Promise<NotificationSendResult> => {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      status: 'skipped',
      provider: 'whatsapp',
      providerMessageId: null,
      error: 'WhatsApp Cloud API is not configured',
    }
  }

  const normalizedPhone = normalizeWhatsappPhone(phone)
  if (!normalizedPhone) {
    return {
      status: 'failed',
      provider: 'whatsapp',
      providerMessageId: null,
      error: 'Invalid WhatsApp phone. Use full international number.',
    }
  }

  const endpoint = `${env.WHATSAPP_API_BASE_URL.replace(/\/$/, '')}/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: {
          body: message,
        },
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: { message?: string }
          messages?: Array<{ id?: string }>
        }
      | null

    if (!response.ok) {
      return {
        status: 'failed',
        provider: 'whatsapp',
        providerMessageId: null,
        error:
          payload?.error?.message ?? `WhatsApp send failed with HTTP ${response.status}`,
      }
    }

    return {
      status: 'sent',
      provider: 'whatsapp',
      providerMessageId: payload?.messages?.[0]?.id ?? null,
      error: null,
    }
  } catch (error) {
    return {
      status: 'failed',
      provider: 'whatsapp',
      providerMessageId: null,
      error: error instanceof Error ? error.message : 'WhatsApp request failed',
    }
  }
}

export const sendNotification = async (
  channel: NotificationChannel,
  recipient: string,
  message: string,
): Promise<NotificationSendResult> => {
  if (channel === 'telegram') {
    return sendViaTelegram(recipient, message)
  }

  return sendViaWhatsapp(recipient, message)
}

export const sendAdminTelegramAlert = async (
  message: string,
): Promise<NotificationSendResult> => {
  const envRecipients = parseAdminTelegramRecipients()
  let dbRecipients: string[] = []
  let dbRecipientsError: string | null = null
  try {
    dbRecipients = await loadAdminRecipientsFromDatabase()
  } catch (error) {
    dbRecipientsError =
      error instanceof Error ? error.message : 'Failed to load admin recipients from database'
  }
  const recipients = Array.from(new Set([...envRecipients, ...dbRecipients]))

  if (!recipients.length) {
    return {
      status: 'skipped' as const,
      provider: 'telegram' as const,
      providerMessageId: null,
      error: dbRecipientsError
        ? `No admin Telegram recipients configured or linked (${dbRecipientsError})`
        : 'No admin Telegram recipients configured or linked',
    }
  }

  let firstSuccess: NotificationSendResult | null = null
  const errors: string[] = []

  for (const recipient of recipients) {
    const result = await sendViaTelegram(recipient, message)
    if (result.status === 'sent' && !firstSuccess) {
      firstSuccess = result
    }
    if (result.status !== 'sent' && result.error) {
      errors.push(`${recipient}: ${result.error}`)
    }
  }

  if (firstSuccess) {
    return firstSuccess
  }

  if (errors.length) {
    return {
      status: 'failed',
      provider: 'telegram',
      providerMessageId: null,
      error: errors.join(' | '),
    }
  }

  return {
    status: 'skipped',
    provider: 'telegram',
    providerMessageId: null,
    error: 'No delivery attempts completed',
  }
}

// Backward-compatible alias for older imports.
export const sendGuestRegistrationAlertToAdmins = sendAdminTelegramAlert
