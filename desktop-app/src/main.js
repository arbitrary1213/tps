const { app, BrowserWindow, ipcMain, session, Menu, screen } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')
const { createFrontendRuntime } = require('./main/frontendRuntime')
const { registerIpcHandlers } = require('./main/ipc')
const { createWindowManager } = require('./main/windows')
const { listAllPrinters, listWindowsPrinterPaperSizes } = require('./main/printers')
const {
  enqueueOfflineOperation,
  getLocalDb,
  getStore,
  listLocalEntities,
  upsertLocalEntity,
} = require('./main/localStore')
const FRONTEND_PORT = 3911

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
})
let windowManager

async function loadAdmin() {
  await session.defaultSession.clearCache().catch(() => {})
  await windowManager.loadAdmin(sendStatus)
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
})

app.whenReady().then(() => {
  windowManager.createMainWindow(loadAdmin)
  loadAdmin().catch((error) => {
    console.error(error)
    windowManager.loadSetup()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createMainWindow(loadAdmin)
      loadAdmin().catch(() => windowManager.loadSetup())
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
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
})
