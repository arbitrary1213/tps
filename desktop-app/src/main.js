const { app, BrowserWindow, ipcMain, session, Menu, screen } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')
const { createFrontendRuntime } = require('./main/frontendRuntime')
const { registerIpcHandlers } = require('./main/ipc')
const { createWindowManager } = require('./main/windows')
const { listAllPrinters, listWindowsPrinterPaperSizes } = require('./main/printers')
const {
  closeLocalDb,
  enqueueOfflineOperation,
  getLocalDb,
  getStore,
  listLocalEntities,
  upsertLocalEntity,
} = require('./main/localStore')
const FRONTEND_PORT = 3911

const APP_MODE = (() => {
  if (process.env.TEMPLE_MODE === 'standalone') return 'standalone'
  if (process.env.TEMPLE_MODE === 'networked') return 'networked'
  try { return require('./app-mode.js') } catch (_) { return 'networked' }
})()
console.log('[TempleOS] App mode:', APP_MODE)

function sendStatus(message, progress, level = 'info') {
  const mainWindow = windowManager?.getMainWindow?.()
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('desktop:status', { message, progress, level })
}

function showStartupError(error) {
  console.error(error)
  sendStatus(error.message || '启动失败', 100, 'error')
}

const frontendRuntime = createFrontendRuntime({
  session,
  processRef: process,
  projectRoot: path.resolve(__dirname, '..', '..'),
  frontendPort: FRONTEND_PORT,
  sendStatus,
  appMode: APP_MODE,
})
let windowManager

async function loadAdmin() {
  await session.defaultSession.clearCache().catch(() => {})
  await windowManager.loadAdmin(sendStatus)
}

async function seedStandaloneData() {
  const db = getLocalDb(app, Database)
  const existing = db.prepare('SELECT COUNT(*) as c FROM local_entities WHERE entity_type = ?').get('plaques')
  if (existing && existing.c > 0) return
  const now = new Date().toISOString()
  const samples = [
    { entity: 'plaques', rows: [
      { id: 'sample_blessing_1', plaqueType: 'LONGEVITY', holderName: '张三', yangShang: '张三', age: '四十八岁', zodiac: '属龙', birthDate: '1978年正月初三', address: '本市东街一号', message: '消灾延寿 福慧增长', status: 'ACTIVE', size: '中', updatedAt: now },
      { id: 'sample_blessing_2', plaqueType: 'LONGEVITY', holderName: '谢释迦摩尼佛', yangShang: '王五', address: '本市南街二号', message: '身体康泰 所求如意', status: 'ACTIVE', size: '中', updatedAt: now },
      { id: 'sample_deliverance_1', plaqueType: 'DELIVERANCE', dedicationType: '地基主', yangShang: '陈氏家人', address: '本市东街一号', status: 'ACTIVE', size: '大', updatedAt: now },
      { id: 'sample_deliverance_2', plaqueType: 'DELIVERANCE', dedicationType: 'custom', customDedicationType: '冤亲债主', deceasedName: '李四', yinGeng: '戊午年正月初三日建生', birthDate: '1978-01-15', deathDate: '2020-03-15', yangShang: '李四家人', message: '蒙佛接引 莲品增上', address: '本市南街五号', status: 'ACTIVE', size: '大', updatedAt: now },
    ]},
    { entity: 'devotees', rows: [
      { id: 'sample_devotee_1', name: '张三', phone: '13800001111', updatedAt: now },
      { id: 'sample_devotee_2', name: '王五', phone: '13800002222', updatedAt: now },
    ]},
    { entity: 'rituals', rows: [
      { id: 'sample_ritual_1', name: '2026年水陆法会', startDate: '2026-06-01', endDate: '2026-06-07', updatedAt: now },
    ]},
  ]
  for (const { entity, rows } of samples) {
    for (const row of rows) upsertLocalEntity(app, Database, entity, row, { remoteId: row.id, dirty: false })
  }
  console.log('[TempleOS] Seeded', samples.reduce((s, x) => s + x.rows.length, 0), 'sample records')
}

windowManager = createWindowManager({
  BrowserWindow,
  Menu,
  screen,
  frontendPort: FRONTEND_PORT,
  getStore,
  frontendRuntime,
  showStartupError,
  loadSetupRef: () => windowManager.loadSetup(),
  appMode: APP_MODE,
  seedStandaloneData: APP_MODE === 'standalone' ? seedStandaloneData : undefined,
})

app.whenReady().then(() => {
  windowManager.createMainWindow(loadAdmin)
  loadAdmin().catch((error) => {
    console.error('[TempleOS] loadAdmin failed:', error.message || error)
    if (APP_MODE === 'standalone') {
      // In standalone mode, never fall back to setup — retry once then show error
      sendStatus('启动失败，正在重试...', 50, 'error')
      setTimeout(() => {
        loadAdmin().catch((e) => {
          console.error('[TempleOS] Retry also failed:', e.message || e)
          sendStatus('启动失败：' + (e.message || '未知错误'), 100, 'error')
        })
      }, 3000)
    } else {
      windowManager.loadSetup()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createMainWindow(loadAdmin)
      loadAdmin().catch(() => {
        if (APP_MODE !== 'standalone') windowManager.loadSetup()
      })
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  closeLocalDb()
  frontendRuntime.stopFrontend()
})

registerIpcHandlers({
  app,
  BrowserWindow,
  Database,
  FRONTEND_PORT,
  ipcMain,
  frontendRuntime,
  getLocalDb,
  getStore,
  listAllPrinters,
  listLocalEntities,
  listWindowsPrinterPaperSizes,
  loadAdmin,
  upsertLocalEntity,
  enqueueOfflineOperation,
  openTemplateDesigner: () => windowManager.openTemplateDesigner(),
  openWebAdmin: () => windowManager.openWebAdmin(),
  loadSetup: () => windowManager.loadSetup(),
  appMode: APP_MODE,
})
