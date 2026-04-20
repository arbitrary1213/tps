import { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'

export const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms')

export const requestLog = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }

    if (res.statusCode >= 400) {
      console.error('[REQUEST]', JSON.stringify(log))
    } else {
      console.log('[REQUEST]', JSON.stringify(log))
    }
  })

  next()
}
