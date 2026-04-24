import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { signToken, authMiddleware, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

const loginAttempts = new Map<string, { count: number; lockUntil: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

const getClientIP = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

const isLocked = (ip: string): boolean => {
  const entry = loginAttempts.get(ip)
  if (!entry) return false
  if (Date.now() > entry.lockUntil) {
    loginAttempts.delete(ip)
    return false
  }
  return true
}

const recordFailedAttempt = (ip: string): void => {
  const entry = loginAttempts.get(ip)
  if (entry) {
    entry.count++
    entry.lockUntil = Date.now() + LOCK_DURATION_MS
  } else {
    loginAttempts.set(ip, { count: 1, lockUntil: Date.now() + LOCK_DURATION_MS })
  }
}

const clearFailedAttempts = (ip: string): void => {
  loginAttempts.delete(ip)
}

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const clientIP = getClientIP(req)

    if (isLocked(clientIP)) {
      const entry = loginAttempts.get(clientIP)
      const waitMinutes = Math.ceil((entry!.lockUntil - Date.now()) / 60000)
      return res.status(429).json({
        success: false,
        error: `登录失败次数过多，请${waitMinutes}分钟后再试`
      })
    }

    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      }
    })

    if (!user) {
      recordFailedAttempt(clientIP)
      return res.status(401).json({ success: false, error: '账号或密码错误' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      recordFailedAttempt(clientIP)
      return res.status(401).json({ success: false, error: '账号或密码错误' })
    }

    clearFailedAttempts(clientIP)

    const token = signToken({
      userId: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 注册
// 注册（仅管理员可创建用户，普通用户注册需管理员在后端操作）
router.post('/register', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { username, password, email, name } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码至少6位' })
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    })

    if (existing) {
      return res.status(400).json({ success: false, error: '用户名或邮箱已存在' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        name: name || null,
        role: 'OPERATOR'
      }
    })

    const token = signToken({
      userId: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role
    })

    res.json({
      success: true,
      data: { token, user: { id: user.id, username, email, name, role: user.role } }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 获取当前用户
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true, name: true, role: true, phone: true }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 修改密码
router.put('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: '请填写所有字段' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: '两次输入的密码不一致' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码至少6位' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return res.status(400).json({ success: false, error: '当前密码错误' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router
