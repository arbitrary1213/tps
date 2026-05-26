const fs = require('fs')
const os = require('os')
const path = require('path')

async function waitForPrintWindowReady(webContents) {
  await webContents.executeJavaScript(`
    (async () => {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (_) {}
      }

      const images = Array.from(document.images || []);
      const waitForImages = Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve();
        if (typeof image.decode === 'function') {
          return image.decode().catch(() => {});
        }
        return new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }));
      await Promise.race([
        waitForImages,
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);

      await new Promise((resolve) => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
    })();
  `)
}

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
  appMode,
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
      await waitForPrintWindowReady(printWindow.webContents)
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

  ipcMain.handle('app:mode', async () => appMode || 'networked')
  ipcMain.on('app:mode-sync', (event) => { event.returnValue = appMode || 'networked' })

  // Seed sample data for standalone mode (first run)
  ipcMain.handle('local-db:seed-sample-data', async () => {
    if (appMode !== 'standalone') return { skipped: true }
    const db = getLocalDb(app, Database)
    const existing = db.prepare('SELECT COUNT(*) as c FROM local_entities WHERE entity_type = ?').get('plaques')
    if (existing && existing.c > 0) return { skipped: true, reason: 'already has data' }

    const now = new Date().toISOString()
    const samplePlaques = [
      { id: 'sample_blessing_1', plaqueType: 'LONGEVITY', holderName: '张三', yangShang: '张三', age: '四十八岁', zodiac: '属龙', birthDate: '1978年正月初三', address: '本市东街一号', message: '消灾延寿 福慧增长', status: 'ACTIVE', size: '中', updatedAt: now },
      { id: 'sample_blessing_2', plaqueType: 'LONGEVITY', holderName: '谢释迦摩尼佛', yangShang: '王五', address: '本市南街二号', message: '身体康泰 所求如意', status: 'ACTIVE', size: '中', updatedAt: now },
      { id: 'sample_deliverance_1', plaqueType: 'DELIVERANCE', dedicationType: '地基主', deceasedName: '', yangShang: '陈氏家人', address: '本市东街一号', status: 'ACTIVE', size: '大', updatedAt: now },
      { id: 'sample_deliverance_2', plaqueType: 'DELIVERANCE', dedicationType: 'custom', customDedicationType: '冤亲债主', deceasedName: '李四', yinGeng: '戊午年正月初三日建生', birthDate: '1978-01-15', deathDate: '2020-03-15', yangShang: '李四家人', message: '蒙佛接引 莲品增上', address: '本市南街五号', status: 'ACTIVE', size: '大', updatedAt: now },
    ]
    const sampleDevotees = [
      { id: 'sample_devotee_1', name: '张三', phone: '13800001111', updatedAt: now },
      { id: 'sample_devotee_2', name: '王五', phone: '13800002222', updatedAt: now },
    ]
    const sampleRituals = [
      { id: 'sample_ritual_1', name: '2026年水陆法会', startDate: '2026-06-01', endDate: '2026-06-07', updatedAt: now },
    ]

    for (const p of samplePlaques) upsertLocalEntity(app, Database, 'plaques', p, { remoteId: p.id, dirty: false })
    for (const d of sampleDevotees) upsertLocalEntity(app, Database, 'devotees', d, { remoteId: d.id, dirty: false })
    for (const r of sampleRituals) upsertLocalEntity(app, Database, 'rituals', r, { remoteId: r.id, dirty: false })

    return { seeded: samplePlaques.length + sampleDevotees.length + sampleRituals.length }
  })
}

module.exports = {
  registerIpcHandlers,
}
