import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  exportVolunteers,
  exportDonations,
  exportPlaques,
  exportLampOfferings,
  exportRegistrationRequests,
  ExportFormat
} from '../services/export'

const router = Router()

const handleExport = async (
  res: Response,
  exportFn: (options: any) => Promise<{ buffer: Buffer; filename: string }>,
  options: { format?: string; startDate?: string; endDate?: string }
) => {
  try {
    const format: ExportFormat = (options.format as ExportFormat) || 'xlsx'
    if (!['xlsx', 'csv'].includes(format)) {
      return res.status(400).json({ success: false, error: '无效的格式，请使用 xlsx 或 csv' })
    }

    const result = await exportFn({
      startDate: options.startDate,
      endDate: options.endDate,
      format
    })

    const contentType = format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`)
    res.send(result.buffer)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ success: false, error: '导出失败' })
  }
}

router.get('/volunteers', authMiddleware, async (req: AuthRequest, res: Response) => {
  await handleExport(res, exportVolunteers, {
    format: req.query.format as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  })
})

router.get('/donations', authMiddleware, async (req: AuthRequest, res: Response) => {
  await handleExport(res, exportDonations, {
    format: req.query.format as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  })
})

router.get('/plaques', authMiddleware, async (req: AuthRequest, res: Response) => {
  await handleExport(res, exportPlaques, {
    format: req.query.format as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  })
})

router.get('/lamp-offerings', authMiddleware, async (req: AuthRequest, res: Response) => {
  await handleExport(res, exportLampOfferings, {
    format: req.query.format as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  })
})

router.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  await handleExport(res, exportRegistrationRequests, {
    format: req.query.format as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  })
})

export default router
