import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'

const app = express()
const PORT = process.env.PORT || 3002

app.set('trust proxy', 1)

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'https://temple.example.com',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(rateLimiter)

import { requestLog } from './middleware/requestLogger'
app.use(requestLog)

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

import authRoutes from './routes/auth'
app.use('/api/auth', authRoutes)

import systemRoutes from './routes/system'
app.use('/api/system', systemRoutes)

import registrationRoutes from './routes/registration'
app.use('/api/registration', registrationRoutes)

import businessRoutes from './routes/business'
app.use('/api', businessRoutes)

import wechatRoutes from './routes/wechat'
app.use('/wechat', wechatRoutes)

import exportRoutes from './routes/export'
app.use('/export', exportRoutes)

import searchRoutes from './routes/search'
app.use('/search', searchRoutes)

import batchRoutes from './routes/batch'
app.use('/api/batch', batchRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Temple OS Backend running on port ${PORT}`)
})
