import express from 'express'

const app = express()
app.use(express.json())
const PORT = process.env.PORT || 3001

// 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// 打印收据
app.post('/print/receipt', (req, res) => {
  const { title, items, total, date, operator } = req.body
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>收据</title>
  <style>
    body { font-family: 'SimSun', serif; padding: 20px; margin: 0; }
    .receipt { max-width: 300px; margin: 0 auto; border: 1px solid #000; padding: 20px; }
    .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
    .row { display: flex; justify-content: space-between; margin: 8px 0; }
    .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="title">${title || '仙顶寺功德收据'}</div>
    <div class="row"><span>日期:</span><span>${date || new Date().toLocaleDateString('zh-CN')}</span></div>
    <div class="row"><span>操作员:</span><span>${operator || '-'}</span></div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
    ${(items || []).map(item => `<div class="row"><span>${item.name}:</span><span>¥${item.amount}</span></div>`).join('')}
    <div class="row total"><span>合计:</span><span>¥${total || 0}</span></div>
  </div>
  <script>window.print();window.close();</script>
</body>
</html>`
  console.log('=== 收据打印 ===', { title, items, total, date, operator })
  res.send(html)
})

// 打印功德牌
app.post('/print/merit-badge', (req, res) => {
  const { name, type, date } = req.body
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>功德牌</title>
  <style>
    body { font-family: 'SimSun', serif; padding: 20px; margin: 0; text-align: center; }
    .badge { display: inline-block; border: 2px solid #8B0000; padding: 40px 60px; margin-top: 20px; }
    .name { font-size: 28px; margin-bottom: 20px; }
    .type { font-size: 16px; color: #666; }
    .date { font-size: 14px; color: #999; margin-top: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="badge">
    <div class="name">${name || '功德主'}</div>
    <div class="type">${type || '功德牌'}</div>
    <div class="date">${date || new Date().toLocaleDateString('zh-CN')}</div>
  </div>
  <script>window.print();window.close();</script>
</body>
</html>`
  console.log('=== 功德牌打印 ===', { name, type, date })
  res.send(html)
})

// 打印祈福卡
app.post('/print/blessing-card', (req, res) => {
  const { holderName, blessingType, startDate, endDate } = req.body
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>祈福卡</title>
  <style>
    body { font-family: 'SimSun', serif; padding: 20px; margin: 0; text-align: center; }
    .card { display: inline-block; border: 2px solid #DAA520; padding: 40px; margin-top: 20px; background: #FFF8DC; }
    .title { font-size: 24px; color: #8B0000; margin-bottom: 20px; }
    .name { font-size: 32px; margin: 20px 0; }
    .type { font-size: 18px; color: #666; }
    .dates { font-size: 14px; color: #999; margin-top: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">祈福卡</div>
    <div class="name">${holderName || '供奉者'}</div>
    <div class="type">${blessingType || '祈福'}</div>
    <div class="dates">${startDate || ''} - ${endDate || ''}</div>
  </div>
  <script>window.print();window.close();</script>
</body>
</html>`
  console.log('=== 祈福卡打印 ===', { holderName, blessingType, startDate, endDate })
  res.send(html)
})

app.listen(PORT, () => {
  console.log(`Print service running on port ${PORT}`)
})
