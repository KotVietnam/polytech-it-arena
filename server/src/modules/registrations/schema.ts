import { z } from 'zod'

const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/

export const createGuestEventRegistrationSchema = z
  .object({
    fullName: z.string().min(3).max(160),
    phone: z.string().min(8).max(40),
    telegramTag: z.string().min(3).max(64),
  })
  .superRefine((value, ctx) => {
    const phoneDigits = value.phone.trim().replace(/\D+/g, '')
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Номер телефона должен быть в международном формате',
      })
    }

    const telegramTag = value.telegramTag.trim()
    if (!telegramRegex.test(telegramTag)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['telegramTag'],
        message: 'Telegram должен быть в формате @username',
      })
    }
  })
