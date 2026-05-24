import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

const CSRF_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-csrf' : 'csrf'
const CSRF_HEADER = 'x-csrf-token'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function getCookie(req: Request, name: string): string | undefined {
  const h = req.headers.cookie || ''
  return h.split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='))?.split('=').slice(1).join('=')
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    if (!getCookie(req, CSRF_COOKIE)) {
      const token = crypto.randomBytes(32).toString('hex')
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
    }
    return next()
  }

  const cookieToken = getCookie(req, CSRF_COOKIE)
  const headerToken = req.headers[CSRF_HEADER]

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing or invalid',
    })
  }

  next()
}
