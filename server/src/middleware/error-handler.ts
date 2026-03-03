import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  void next
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error)
  }

  res.status(500).json({ error: 'Internal server error' })
}
