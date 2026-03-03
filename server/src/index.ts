import { env } from './config/env.js'
import { prisma } from './db.js'
import { app } from './app.js'

const server = app.listen(env.PORT, '127.0.0.1', () => {
  console.log(`API listening on http://127.0.0.1:${env.PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown()
})

process.on('SIGTERM', () => {
  void shutdown()
})
