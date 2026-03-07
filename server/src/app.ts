import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { adminRouter } from './modules/admin/router.js'
import { archiveRouter } from './modules/archive/router.js'
import { authRouter } from './modules/auth/router.js'
import { eventsRouter } from './modules/events/router.js'
import { teamsRouter } from './modules/teams/router.js'

const getAllowedOrigins = () => {
  const allowed = new Set<string>()

  const append = (value: string) => {
    try {
      allowed.add(new URL(value).origin)
    } catch {
      // ignore invalid url values
    }
  }

  append(env.FRONTEND_ORIGIN)
  append(env.APP_PUBLIC_URL)
  if (env.FRONTEND_EXTRA_ORIGINS) {
    const extraOrigins = env.FRONTEND_EXTRA_ORIGINS
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    for (const origin of extraOrigins) {
      append(origin)
    }
  }

  try {
    const appUrl = new URL(env.APP_PUBLIC_URL)
    const adminHost = appUrl.hostname.startsWith('admin.')
      ? appUrl.hostname
      : `admin.${appUrl.hostname}`
    append(`${appUrl.protocol}//${adminHost}${appUrl.port ? `:${appUrl.port}` : ''}`)
  } catch {
    // ignore invalid app public url
  }

  return allowed
}

const app = express()
const allowedOrigins = getAllowedOrigins()

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: false,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mode: env.AUTH_MODE,
    now: new Date().toISOString(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/teams', teamsRouter)
app.use('/api/archives', archiveRouter)
app.use('/api/admin', adminRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)

export { app }
