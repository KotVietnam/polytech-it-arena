import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError } from '../../utils/http-error.js'
import { getArchiveById, listArchives } from './service.js'

const archiveRouter = Router()

archiveRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await listArchives()
    res.json({ items })
  }),
)

archiveRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await getArchiveById(req.params.id)
    if (!item) {
      throw new HttpError(404, 'Archive not found')
    }

    res.json({ item })
  }),
)

export { archiveRouter }
