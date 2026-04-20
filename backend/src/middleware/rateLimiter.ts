import { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown'
  const now = Date.now()

  let entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + WINDOW_MS }
    store.set(key, entry)
  }

  entry.count++

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString())
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - entry.count).toString())

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMITED'
    })
  }

  next()
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, WINDOW_MS)
