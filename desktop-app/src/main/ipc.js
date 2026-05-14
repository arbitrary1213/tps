const fs = require('fs')
const os = require('os')
const path = require('path')

function registerIpcHandlers({
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
  openTemplateDesigner,
  openWebAdmin,
  loadSetup,
}) {
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
    rows.forEach((row) => upsertLocalEntity(app, Database, entityType, row, { remoteId: row.id, dirty: false }))
    return { count: rows.length }
  })

  ipcMain.handle('local-db:list', async (_event, entityType) => {
    if (!entityType) return []
    return listLocalEntities(app, Database, entityType)
  })

  ipcMain.handle('local-db:offline-save', async (_event, operation) => {
    const entityType = operation?.entityType
    const payload = operation?.payload || {}
    if (!entityType) throw new Error('entityType is required')
    const localEntityId = upsertLocalEntity(app, Database, entityType, payload, {
      localId: operation.localEntityId,
      remoteId: operation.remoteId || payload.id,
      dirty: true,
    })
    const queueId = enqueueOfflineOperation(app, Database, {
      ...operation,
      localEntityId,
      payload: { ...payload, localId: localEntityId },
    })
    return { localEntityId, queueId }
  })

  ipcMain.handle('local-db:queue', async () => {
    const db = getLocalDb(app, Database)
    return db.prepare('SELECT * FROM sync_queue ORDER BY created_at ASC').all().map((row) => ({
      ...row,
      payload: JSON.parse(row.payload),
    }))
  })

  ipcMain.handle('local-db:info', async () => {
    const db = getLocalDb(app, Database)
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

  ipcMain.handle('desktop:open-template-designer', async () => openTemplateDesigner())
  ipcMain.handle('desktop:open-web-admin', async () => openWebAdmin())

  ipcMain.handle('desktop:reload-admin', async () => {
    await loadAdmin()
    return true
  })

  ipcMain.handle('desktop:check-server', async (_event, serverUrl) => {
    return frontendRuntime.checkServerHealth(serverUrl)
  })

  ipcMain.handle('printers:list', async (event) => listAllPrinters(event))
  ipcMain.handle('printers:paper-sizes', async (_event, printerName) => listWindowsPrinterPaperSizes(printerName))

  ipcMain.handle('print:html', async (_event, options) => {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temple-os-print-'))
    const tempHtmlPath = path.join(tempDir, 'print.html')
    fs.writeFileSync(tempHtmlPath, options.html || '', 'utf8')

    try {
      await printWindow.loadFile(tempHtmlPath)
    } catch (error) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      throw error
    }

    return new Promise((resolve) => {
      printWindow.webContents.print({
        silent: Boolean(options.silent),
        deviceName: options.deviceName || '',
        copies: Number(options.copies) || 1,
        printBackground: options.printBackground !== false,
      }, (success, failureReason) => {
        printWindow.close()
        fs.rmSync(tempDir, { recursive: true, force: true })
        resolve({ success, failureReason: failureReason || '' })
      })
    })
  })
}

module.exports = {
  registerIpcHandlers,
}
