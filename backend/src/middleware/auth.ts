import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
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
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getSecret()) as JWTPayload
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
