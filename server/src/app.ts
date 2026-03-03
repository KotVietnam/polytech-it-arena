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

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
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
app.use('/api/archives', archiveRouter)
app.use('/api/admin', adminRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)

export { app }
