import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.stack || err.message)

  if (res.headersSent) {
    return next(err)
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  })
}
