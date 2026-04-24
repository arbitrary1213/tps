import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// 获取系统设置（公开）
router.get('/settings', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' }
    })

    // 如果没有则创建默认设置
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'system', templeName: '仙顶寺' }
      })
    }

    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 更新系统设置（需认证）
router.put('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { templeName, templeAddress, templePhone, templeEmail, templeLogo, landingLogo, landingBg, wechatQrcode, dedicationTypes } = req.body

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'system' },
      update: {
        templeName,
        templeAddress,
        templePhone,
        templeEmail,
        templeLogo,
        landingLogo,
        landingBg,
        wechatQrcode,
        dedicationTypes
      },
      create: {
        id: 'system',
        templeName: templeName || '仙顶寺',
        templeAddress,
        templePhone,
        templeEmail,
        templeLogo,
        landingLogo,
        landingBg,
        wechatQrcode,
        dedicationTypes
      }
    })

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'UPDATE',
        targetType: 'system_settings',
        targetId: 'system',
        afterValue: settings
      }
    })

    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router
