const { app, BrowserWindow, ipcMain, session, Menu, screen } = require('electron')
const { execFile, spawn } = require('child_process')
const path = require('path')
const http = require('http')
const https = require('https')
const Database = require('better-sqlite3')

let Store
let store
let localDb = null
let frontendProcess = null
let mainWindow = null
let templateWindow = null
let printPreviewWindow = null
let adminWindow = null
const FRONTEND_PORT = 3900
let apiRedirectInstalled = false

function listWindowsPrinters() {
  if (process.platform !== 'win32') return Promise.resolve([])

  const command = [
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;',
    '$OutputEncoding = [System.Text.Encoding]::UTF8;',
    'Get-Printer',
    '|',
    'Select-Object Name,DriverName,PortName,PrinterStatus',
    '|',
    'ConvertTo-Json -Depth 3',
  ].join(' ')

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 10000, encoding: 'utf8' },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([])
          return
        }

        try {
          const parsed = JSON.parse(stdout)
          const rows = Array.isArray(parsed) ? parsed : [parsed]
          resolve(rows.filter((row) => row?.Name).map((row) => ({
            name: row.Name,
            displayName: row.Name,
            description: row.DriverName || '',
            status: row.PrinterStatus,
            isDefault: false,
            options: {
              driverName: row.DriverName || '',
              portName: row.PortName || '',
              source: 'windows',
            },
          })))
        } catch {
          resolve([])
        }
      }
    )
  })
}

function powershellString(value) {
  return `'${String(value || '').replace(/'/g, "''")}'`
}

function listWindowsPrinterPaperSizes(printerName) {
  if (process.platform !== 'win32' || !printerName) return Promise.resolve([])

  const command = [
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;',
    '$OutputEncoding = [System.Text.Encoding]::UTF8;',
    'Add-Type -AssemblyName System.Drawing;',
    '$printer = New-Object System.Drawing.Printing.PrinterSettings;',
    `$printer.PrinterName = ${powershellString(printerName)};`,
    'if (-not $printer.IsValid) { @() | ConvertTo-Json; exit 0 }',
    '$printer.PaperSizes',
    '|',
    'ForEach-Object { [PSCustomObject]@{',
    'name = $_.PaperName;',
    'kind = $_.Kind.ToString();',
    'rawKind = $_.RawKind;',
    'widthInch100 = $_.Width;',
    'heightInch100 = $_.Height;',
    'widthMm = [Math]::Round($_.Width * 0.254, 2);',
    'heightMm = [Math]::Round($_.Height * 0.254, 2)',
    '} }',
    '|',
    'ConvertTo-Json -Depth 3',
  ].join(' ')

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 10000, encoding: 'utf8' },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([])
          return
        }

        try {
          const parsed = JSON.parse(stdout)
          const rows = Array.isArray(parsed) ? parsed : [parsed]
          resolve(rows.filter((row) => row?.name).map((row) => ({
            name: row.name,
            kind: row.kind || '',
            rawKind: row.rawKind,
            widthMm: Number(row.widthMm) || 0,
            heightMm: Number(row.heightMm) || 0,
            widthInch100: Number(row.widthInch100) || 0,
            heightInch100: Number(row.heightInch100) || 0,
          })))
        } catch {
          resolve([])
        }
      }
    )
  })
}

async function listAllPrinters(event) {
  const chromiumPrinters = await event.sender.getPrintersAsync().catch(() => [])
  const windowsPrinters = await listWindowsPrinters()
  const byName = new Map()

  for (const printer of [...chromiumPrinters, ...windowsPrinters]) {
    if (!printer?.name) continue
    const existing = byName.get(printer.name) || {}
    byName.set(printer.name, {
      ...printer,
      ...existing,
      name: printer.name,
      displayName: existing.displayName || printer.displayName || printer.name,
      description: existing.description || printer.description || printer.options?.driverName || '',
      options: {
        ...(printer.options || {}),
        ...(existing.options || {}),
      },
    })
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

async function getStore() {
  if (!store) {
    if (!Store) {
      Store = (await import('electron-store')).default
    }
    store = new Store({
      name: 'temple-os-desktop',
      defaults: {
        serverUrl: '',
        auth: null,
        printClient: null,
        defaultPrinter: '',
        recentData: {},
        desktopCache: {},
        pendingReports: [],
        cachedJobs: [],
        calendarEvents: [],
      }
    })
  }
  return store
}

function getLocalDb() {
  if (localDb) return localDb
  const dbPath = path.join(app.getPath('userData'), 'temple-os-local.db')
  localDb = new Database(dbPath)
  localDb.pragma('journal_mode = WAL')
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS local_entities (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      remote_id TEXT,
      data TEXT NOT NULL,
      dirty INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      remote_updated_at TEXT,
      local_updated_at TEXT NOT NULL,
      UNIQUE(entity_type, remote_id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      local_entity_id TEXT,
      remote_id TEXT,
      operation TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_local_entities_type_dirty ON local_entities(entity_type, dirty);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status_created ON sync_queue(status, created_at);
  `)
  return localDb
}

function nowIso() {
  return new Date().toISOString()
}

function createLocalId(prefix = 'local') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function upsertLocalEntity(entityType, data, options = {}) {
  const db = getLocalDb()
  const remoteId = options.remoteId || data.id || null
  const id = options.localId || (remoteId ? `${entityType}:${remoteId}` : createLocalId(entityType))
  db.prepare(`
    INSERT INTO local_entities (
      id, entity_type, remote_id, data, dirty, deleted, remote_updated_at, local_updated_at
    )
    VALUES (@id, @entityType, @remoteId, @data, @dirty, @deleted, @remoteUpdatedAt, @localUpdatedAt)
    ON CONFLICT(id)
    DO UPDATE SET
      remote_id = excluded.remote_id,
      data = excluded.data,
      dirty = excluded.dirty,
      deleted = excluded.deleted,
      remote_updated_at = excluded.remote_updated_at,
      local_updated_at = excluded.local_updated_at
  `).run({
    id,
    entityType,
    remoteId,
    data: JSON.stringify({ ...data, id: remoteId || id, localId: id }),
    dirty: options.dirty ? 1 : 0,
    deleted: options.deleted ? 1 : 0,
    remoteUpdatedAt: data.updatedAt || data.createdAt || null,
    localUpdatedAt: nowIso(),
  })
  return id
}

function listLocalEntities(entityType) {
  const db = getLocalDb()
  return db.prepare(`
    SELECT * FROM local_entities
    WHERE entity_type = ? AND deleted = 0
    ORDER BY local_updated_at DESC
  `).all(entityType).map((row) => JSON.parse(row.data))
}

function enqueueOfflineOperation(operation) {
  const db = getLocalDb()
  const id = createLocalId('sync')
  db.prepare(`
    INSERT INTO sync_queue (
      id, entity_type, local_entity_id, remote_id, operation, endpoint, method,
      payload, status, created_at, updated_at
    )
    VALUES (@id, @entityType, @localEntityId, @remoteId, @operation, @endpoint, @method,
      @payload, 'PENDING', @createdAt, @updatedAt)
  `).run({
    id,
    entityType: operation.entityType,
    localEntityId: operation.localEntityId || null,
    remoteId: operation.remoteId || null,
    operation: operation.operation,
    endpoint: operation.endpoint,
    method: operation.method,
    payload: JSON.stringify(operation.payload || {}),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
  return id
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: 'Temple OS Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalPrintPreviewUrl(url)) {
      openPrintPreviewWindow(url).catch((error) => showStartupError(error))
      return { action: 'deny' }
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        ...halfScreenWindowBounds(800, 800),
        parent: mainWindow || undefined,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
    }
  })
  installMenu()
}

function isLocalPrintPreviewUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return (
      url.hostname === '127.0.0.1' &&
      Number(url.port) === FRONTEND_PORT &&
      url.pathname === '/print-api/index.html' &&
      (url.searchParams.get('preview') === '1' || url.searchParams.get('printPreview') === '1')
    )
  } catch {
    return false
  }
}

function halfScreenWindowBounds(defaultWidth = 900, defaultHeight = 560) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const area = display.workAreaSize
  return {
    width: Math.min(defaultWidth, Math.floor(area.width * 0.5)),
    height: Math.min(defaultHeight, Math.floor(area.height * 0.5)),
    minWidth: Math.min(760, Math.floor(area.width * 0.5)),
    minHeight: Math.min(480, Math.floor(area.height * 0.5)),
  }
}

function toolWindowBounds(defaultWidth = 1280, defaultHeight = 820) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const area = display.workAreaSize
  return {
    width: Math.min(defaultWidth, Math.floor(area.width * 0.85)),
    height: Math.min(defaultHeight, Math.floor(area.height * 0.85)),
    minWidth: Math.min(980, Math.floor(area.width * 0.75)),
    minHeight: Math.min(640, Math.floor(area.height * 0.75)),
  }
}

async function loadDesktopShell() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  await mainWindow.loadFile(path.join(__dirname, 'renderer.html'))
}

function installMenu() {
  const template = [
    {
      label: 'Temple OS',
      submenu: [
        { label: '重新加载工作台', click: () => loadAdmin().catch((error) => showStartupError(error)) },
        { label: '模板设计', click: () => openTemplateDesigner().catch((error) => showStartupError(error)) },
        { label: '连接设置', click: () => loadSetup() },
        { type: 'separator' },
        { label: '退出', role: 'quit' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', role: 'reload' },
        { label: '强制刷新', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

async function openTemplateDesigner() {
  const s = await getStore()
  const serverUrl = String(s.get('serverUrl') || '').replace(/\/+$/, '')
  if (!serverUrl) throw new Error('请先配置服务器地址')
  await installApiRedirect(serverUrl)
  await startFrontend(serverUrl)

  if (templateWindow && !templateWindow.isDestroyed()) {
    templateWindow.focus()
    return true
  }

  templateWindow = new BrowserWindow({
    ...toolWindowBounds(1280, 820),
    title: '模板设计',
    parent: mainWindow || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  templateWindow.on('closed', () => {
    templateWindow = null
  })
  await templateWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}/print-api/?desktopWindow=template-designer`)
  return true
}

async function openPrintPreviewWindow(url) {
  if (printPreviewWindow && !printPreviewWindow.isDestroyed()) {
    await printPreviewWindow.loadURL(url)
    printPreviewWindow.focus()
    return true
  }

  printPreviewWindow = new BrowserWindow({
    ...halfScreenWindowBounds(1000, 800),
    title: '打印预览',
    parent: mainWindow || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  printPreviewWindow.on('closed', () => {
    printPreviewWindow = null
  })
  await printPreviewWindow.loadURL(url)
  return true
}

async function openWebAdmin() {
  const s = await getStore()
  const serverUrl = String(s.get('serverUrl') || '').replace(/\/+$/, '')
  if (!serverUrl) throw new Error('请先配置服务器地址')
  await installApiRedirect(serverUrl)
  await startFrontend(serverUrl)

  if (adminWindow && !adminWindow.isDestroyed()) {
    adminWindow.focus()
    return true
  }

  adminWindow = new BrowserWindow({
    ...halfScreenWindowBounds(980, 620),
    title: '网页后台',
    parent: mainWindow || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  adminWindow.on('closed', () => {
    adminWindow = null
  })
  await adminWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}/admin`)
  return true
}

function sendStatus(message, progress, level = 'info') {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('desktop:status', { message, progress, level })
}

function showStartupError(error) {
  console.error(error)
  sendStatus(error.message || '启动失败', 100, 'error')
}

function requestJson(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        let json = null
        try {
          json = body ? JSON.parse(body) : null
        } catch {
          json = null
        }
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve({ statusCode: res.statusCode, data: json, body })
          return
        }
        reject(new Error(`服务器返回 ${res.statusCode || '未知状态'}`))
      })
    })
    req.on('timeout', () => {
      req.destroy(new Error('服务器连接超时'))
    })
    req.on('error', reject)
  })
}

async function checkServerHealth(serverUrl) {
  const normalized = String(serverUrl || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//.test(normalized)) {
    throw new Error('服务器地址必须以 http:// 或 https:// 开头')
  }
  const result = await requestJson(`${normalized}/api/health`)
  if (result.statusCode >= 400) {
    throw new Error(`服务器健康检查失败：${result.statusCode}`)
  }
  return { serverUrl: normalized, statusCode: result.statusCode, data: result.data }
}

function waitForFrontend(url, timeoutMs = 30000) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          resolve(true)
          return
        }
        retry()
      })
      const retry = () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Frontend did not start within ${timeoutMs}ms`))
          return
        }
        setTimeout(tick, 500)
      }
      req.on('error', () => {
        retry()
      })
      req.setTimeout(1000, () => {
        req.destroy()
      })
    }
    tick()
  })
}

async function loadSetup() {
  mainWindow.loadFile(path.join(__dirname, 'setup.html'))
}

async function loadLoading() {
  await mainWindow.loadFile(path.join(__dirname, 'loading.html'))
}

async function installApiRedirect(serverUrl) {
  if (apiRedirectInstalled) return
  const localOrigin = `http://127.0.0.1:${FRONTEND_PORT}`
  const remoteOrigin = String(serverUrl || '').replace(/\/+$/, '')

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (!remoteOrigin || !details.url.startsWith(localOrigin)) {
      callback({ requestHeaders: details.requestHeaders })
      return
    }

    const url = new URL(details.url)
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/export/') ||
      url.pathname.startsWith('/search/')
    ) {
      details.requestHeaders['x-temple-api-base'] = remoteOrigin
    }

    callback({ requestHeaders: details.requestHeaders })
  })

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (!remoteOrigin || !details.url.startsWith(localOrigin)) {
      callback({})
      return
    }

    const url = new URL(details.url)
    const shouldRedirect = url.pathname.startsWith('/wechat/')

    if (!shouldRedirect) {
      callback({})
      return
    }

    callback({ redirectURL: `${remoteOrigin}${url.pathname}${url.search}` })
  })

  apiRedirectInstalled = true
}

async function startFrontend(serverUrl) {
  if (frontendProcess) return

  try {
    await waitForFrontend(`http://127.0.0.1:${FRONTEND_PORT}/login`, 1200)
    sendStatus('已连接本地前端服务', 70)
    return
  } catch {
    // No existing local frontend is available; start our managed process below.
  }

  sendStatus('正在启动本地前端服务...', 35)
  const projectRoot = path.resolve(__dirname, '..', '..')
  const frontendDir = path.join(projectRoot, 'frontend')
  const standaloneDir = path.join(frontendDir, '.next', 'standalone')
  const standaloneServer = path.join(standaloneDir, 'server.js')
  const useStandalone = require('fs').existsSync(standaloneServer)

  frontendProcess = spawn(
    process.execPath,
    useStandalone
      ? [standaloneServer]
      : [path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-p', String(FRONTEND_PORT), '-H', '127.0.0.1'],
    {
      cwd: useStandalone ? standaloneDir : frontendDir,
      env: {
        ...process.env,
        PORT: String(FRONTEND_PORT),
        HOSTNAME: '127.0.0.1',
        NEXT_PUBLIC_API_BASE: serverUrl,
        API_BASE: serverUrl,
        BROWSER: 'none',
      },
      stdio: 'pipe',
      windowsHide: true,
    }
  )

  frontendProcess.stdout.on('data', (chunk) => {
    console.log(`[frontend] ${chunk}`)
  })
  frontendProcess.stderr.on('data', (chunk) => {
    console.error(`[frontend] ${chunk}`)
  })
  frontendProcess.on('exit', (code) => {
    console.log(`frontend exited with code ${code}`)
    frontendProcess = null
  })

  await waitForFrontend(`http://127.0.0.1:${FRONTEND_PORT}/login`, 45000)
  sendStatus('本地前端服务已就绪', 70)
}

async function loadAdmin() {
  await loadLoading()
  await session.defaultSession.clearCache().catch(() => {})
  const s = await getStore()
  const serverUrl = String(s.get('serverUrl') || '').replace(/\/+$/, '')
  if (!serverUrl) {
    await loadSetup()
    return
  }

  await installApiRedirect(serverUrl)
  await startFrontend(serverUrl)
  sendStatus('正在打开桌面化后台...', 90)
  await mainWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}/admin`)
}

app.whenReady().then(() => {
  createWindow()
  loadAdmin().catch((error) => {
    console.error(error)
    loadSetup()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      loadAdmin().catch(() => loadSetup())
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (frontendProcess) {
    frontendProcess.kill()
    frontendProcess = null
  }
})

ipcMain.handle('config:get', async () => {
  const s = await getStore()
  return {
    serverUrl: s.get('serverUrl'),
    auth: s.get('auth'),
    printClient: s.get('printClient'),
    defaultPrinter: s.get('defaultPrinter'),
    cachedJobs: s.get('cachedJobs'),
    recentData: s.get('recentData'),
    desktopCache: s.get('desktopCache'),
    pendingReports: s.get('pendingReports'),
    calendarEvents: s.get('calendarEvents'),
  }
})

ipcMain.handle('config:set', async (_event, patch) => {
  const s = await getStore()
  Object.entries(patch || {}).forEach(([key, value]) => s.set(key, value))
  return true
})

ipcMain.handle('cache:get', async (_event, key) => {
  const s = await getStore()
  const cache = s.get('desktopCache') || {}
  return cache[key] || null
})

ipcMain.handle('cache:set', async (_event, key, value) => {
  const s = await getStore()
  const cache = s.get('desktopCache') || {}
  cache[key] = {
    value,
    savedAt: new Date().toISOString(),
  }
  s.set('desktopCache', cache)
  return true
})

ipcMain.handle('cache:clear', async () => {
  const s = await getStore()
  s.set('desktopCache', {})
  return true
})

ipcMain.handle('local-db:upsert-many', async (_event, entityType, rows) => {
  if (!entityType || !Array.isArray(rows)) return { count: 0 }
  rows.forEach((row) => upsertLocalEntity(entityType, row, { remoteId: row.id, dirty: false }))
  return { count: rows.length }
})

ipcMain.handle('local-db:list', async (_event, entityType) => {
  if (!entityType) return []
  return listLocalEntities(entityType)
})

ipcMain.handle('local-db:offline-save', async (_event, operation) => {
  const entityType = operation?.entityType
  const payload = operation?.payload || {}
  if (!entityType) throw new Error('entityType is required')
  const localEntityId = upsertLocalEntity(entityType, payload, {
    localId: operation.localEntityId,
    remoteId: operation.remoteId || payload.id,
    dirty: true,
  })
  const queueId = enqueueOfflineOperation({
    ...operation,
    localEntityId,
    payload: { ...payload, localId: localEntityId },
  })
  return { localEntityId, queueId }
})

ipcMain.handle('local-db:queue', async () => {
  const db = getLocalDb()
  return db.prepare('SELECT * FROM sync_queue ORDER BY created_at ASC').all().map((row) => ({
    ...row,
    payload: JSON.parse(row.payload),
  }))
})

ipcMain.handle('local-db:info', async () => {
  const db = getLocalDb()
  const entityCount = db.prepare('SELECT COUNT(*) AS count FROM local_entities').get().count
  const pendingCount = db.prepare("SELECT COUNT(*) AS count FROM sync_queue WHERE status = 'PENDING'").get().count
  return {
    path: path.join(app.getPath('userData'), 'temple-os-local.db'),
    entityCount,
    pendingCount,
  }
})

ipcMain.handle('config:clear', async () => {
  const s = await getStore()
  s.clear()
  return true
})

ipcMain.handle('desktop:app-info', async () => ({
  name: app.getName(),
  version: app.getVersion(),
  frontendPort: FRONTEND_PORT,
}))

ipcMain.handle('desktop:open-admin', async () => {
  await loadAdmin()
  return true
})

ipcMain.handle('desktop:open-setup', async () => {
  await loadSetup()
  return true
})

ipcMain.handle('desktop:open-template-designer', async () => {
  return openTemplateDesigner()
})

ipcMain.handle('desktop:open-web-admin', async () => {
  return openWebAdmin()
})

ipcMain.handle('desktop:reload-admin', async () => {
  await loadAdmin()
  return true
})

ipcMain.handle('desktop:check-server', async (_event, serverUrl) => {
  return checkServerHealth(serverUrl)
})

ipcMain.handle('printers:list', async (event) => {
  return listAllPrinters(event)
})

ipcMain.handle('printers:paper-sizes', async (_event, printerName) => {
  return listWindowsPrinterPaperSizes(printerName)
})

ipcMain.handle('print:html', async (_event, options) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(options.html || '')}`)

  return new Promise((resolve) => {
    printWindow.webContents.print({
      silent: Boolean(options.silent),
      deviceName: options.deviceName || '',
      copies: Number(options.copies) || 1,
      printBackground: options.printBackground !== false,
    }, (success, failureReason) => {
      printWindow.close()
      resolve({ success, failureReason: failureReason || '' })
    })
  })
})
