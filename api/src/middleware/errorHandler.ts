import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || err.statusCode || 500
  const isProd = process.env.NODE_ENV === 'production'

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    status,
  })

  if (res.headersSent) {
    return next(err)
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' })
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists.' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  res.status(status).json({
    error: isProd ? 'Something went wrong. Please try again.' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  })
}
