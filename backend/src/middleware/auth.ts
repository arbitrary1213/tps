import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export interface JWTPayload {
  userId: string
  username: string
  email?: string
  role: string
}

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const cookieHeader = req.headers.cookie || ''
  const cookieToken = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('temple_token='))
    ?.split('=')
    .slice(1)
    .join('=')

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (cookieToken ? decodeURIComponent(cookieToken) : '')

  if (!token) {
    return res.status(401).json({ success: false, error: '未登录' })
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' })
  }
}

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未登录' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: '权限不足' })
    }

    next()
  }
}
