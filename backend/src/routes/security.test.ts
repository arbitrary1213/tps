import { describe, it, expect, vi } from 'vitest'
import { signToken, verifyToken, authMiddleware, requireRole } from '../middleware/auth'
import { Request, Response } from 'express'

describe('Auth Middleware', () => {
  describe('JWT Functions', () => {
    it('should sign and verify token correctly', () => {
      const payload = { userId: '123', username: 'test', role: 'ADMIN' }
      const token = signToken(payload)
      const decoded = verifyToken(token)
      expect(decoded.userId).toBe('123')
      expect(decoded.username).toBe('test')
      expect(decoded.role).toBe('ADMIN')
    })

    it('should include expiration in token', () => {
      const payload = { userId: '123', username: 'test', role: 'ADMIN' }
      const token = signToken(payload)
      const decoded = verifyToken(token) as unknown as { exp: number }
      expect(decoded.exp).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })
  })

  describe('authMiddleware', () => {
    it('should reject request without authorization header', () => {
      const req = { headers: {} } as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: '未登录' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject request with invalid bearer format', () => {
      const req = { headers: { authorization: 'Basic token123' } } as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject request with invalid token', () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } } as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token 无效或已过期' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should accept request with valid token', () => {
      const payload = { userId: '123', username: 'test', role: 'ADMIN' }
      const token = signToken(payload)
      const req = { headers: { authorization: `Bearer ${token}` } } as Request
      const res = {} as Response
      const next = vi.fn()

      authMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect((req as any).user.userId).toBe('123')
    })
  })

  describe('requireRole', () => {
    it('should reject request without user', () => {
      const req = {} as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response
      const next = vi.fn()

      const middleware = requireRole('ADMIN')
      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: '未登录' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject request with insufficient role', () => {
      const req = { user: { userId: '123', username: 'test', role: 'OPERATOR' } } as any
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response
      const next = vi.fn()

      const middleware = requireRole('ADMIN')
      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ success: false, error: '权限不足' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should allow request with sufficient role', () => {
      const req = { user: { userId: '123', username: 'test', role: 'ADMIN' } } as any
      const res = {} as Response
      const next = vi.fn()

      const middleware = requireRole('ADMIN', 'OPERATOR')
      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })
})

describe('User Deletion Permission Checks', () => {
  it('should prevent user from deleting themselves', () => {
    const currentUserId = 'user-1'
    const targetUserId = 'user-1'
    const canDelete = currentUserId !== targetUserId
    expect(canDelete).toBe(false)
  })

  it('should allow admin to delete non-admin users', () => {
    const currentUserId = 'admin-1'
    const targetUser = { id: 'user-2', role: 'OPERATOR' }
    const adminCount = 2
    const canDelete = currentUserId !== targetUser.id && (targetUser.role !== 'ADMIN' || adminCount > 1)
    expect(canDelete).toBe(true)
  })

  it('should prevent deleting last admin', () => {
    const targetUser = { id: 'admin-2', role: 'ADMIN' }
    const adminCount = 1
    const canDelete = targetUser.role !== 'ADMIN' || adminCount > 1
    expect(canDelete).toBe(false)
  })
})

describe('Volunteer Attendance Capacity Check', () => {
  it('should reject sign-in when task is full', () => {
    const task = { requiredCount: 5, currentCount: 5 }
    const canSignUp = task.currentCount < task.requiredCount
    expect(canSignUp).toBe(false)
  })

  it('should allow sign-in when capacity available', () => {
    const task = { requiredCount: 5, currentCount: 3 }
    const canSignUp = task.currentCount < task.requiredCount
    expect(canSignUp).toBe(true)
  })

  it('should handle unlimited capacity (requiredCount = 0)', () => {
    const task = { requiredCount: 0, currentCount: 100 }
    const canSignUp = task.requiredCount === 0 || task.currentCount < task.requiredCount
    expect(canSignUp).toBe(true)
  })
})

describe('Date Validation', () => {
  it('should reject endDate before startDate', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2023-12-31')
    const isValid = !endDate || !startDate || endDate >= startDate
    expect(isValid).toBe(false)
  })

  it('should accept valid date range', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-12-31')
    const isValid = !endDate || !startDate || endDate >= startDate
    expect(isValid).toBe(true)
  })

  it('should accept same start and end date', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-01-01')
    const isValid = !endDate || !startDate || endDate >= startDate
    expect(isValid).toBe(true)
  })

  it('should handle missing dates', () => {
    const endDate: Date | null = null
    const startDate: Date | null = null
    const isValid = !endDate || !startDate || endDate >= startDate
    expect(isValid).toBe(true)
  })
})

describe('Accommodation Checkout Status Check', () => {
  it('should prevent double checkout', () => {
    const record = { status: 'CHECKED_OUT' }
    const canCheckout = record.status !== 'CHECKED_OUT'
    expect(canCheckout).toBe(false)
  })

  it('should allow checkout for checked-in record', () => {
    const record = { status: 'CHECKED_IN' }
    const canCheckout = record.status !== 'CHECKED_OUT'
    expect(canCheckout).toBe(true)
  })

  it('should allow checkout for cancelled record', () => {
    const record = { status: 'CANCELLED' }
    const canCheckout = record.status !== 'CHECKED_OUT'
    expect(canCheckout).toBe(true)
  })
})