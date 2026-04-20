import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  searchVolunteers,
  searchDevotees,
  searchPlaques,
  searchRequests,
  SearchParams
} from '../services/search'

const router = Router()

const parseSearchParams = (req: AuthRequest): SearchParams => {
  const { q, status, type, startDate, endDate, page, pageSize } = req.query

  return {
    q: q as string | undefined,
    status: status as string | undefined,
    type: type as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
    page: page ? Math.max(1, parseInt(page as string, 10)) : 1,
    pageSize: pageSize ? Math.min(100, Math.max(1, parseInt(pageSize as string, 10))) : 20
  }
}

router.get('/volunteers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const params = parseSearchParams(req)
    const result = await searchVolunteers(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Search volunteers error:', error)
    res.status(500).json({ success: false, error: '搜索失败' })
  }
})

router.get('/devotees', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const params = parseSearchParams(req)
    const result = await searchDevotees(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Search devotees error:', error)
    res.status(500).json({ success: false, error: '搜索失败' })
  }
})

router.get('/plaques', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const params = parseSearchParams(req)
    const result = await searchPlaques(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Search plaques error:', error)
    res.status(500).json({ success: false, error: '搜索失败' })
  }
})

router.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const params = parseSearchParams(req)
    const result = await searchRequests(params)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Search requests error:', error)
    res.status(500).json({ success: false, error: '搜索失败' })
  }
})

export default router
