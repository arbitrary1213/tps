import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const PORT = process.env.PORT || 3001
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.join(__dirname, '..', 'frontend', 'public', 'print-api')
const pdfjsDir = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build')

app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))
app.use('/vendor/pdfjs', express.static(pdfjsDir, {
  maxAge: '7d',
}))

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'tablet-print', version: '1.0.0' })
})

app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: 0,
  etag: false,
}))

app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.sendFile(path.join(publicDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Tablet print service running on port ${PORT}`)
})
