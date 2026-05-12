const path = require('path')

function createWindowManager({ BrowserWindow, Menu, screen, frontendPort, getStore, frontendRuntime, showStartupError, loadSetupRef }) {
  let mainWindow = null
  let templateWindow = null
  let printPreviewWindow = null
  let adminWindow = null

  function isLocalPrintPreviewUrl(rawUrl) {
    try {
      const url = new URL(rawUrl)
      return (
        url.hostname === '127.0.0.1' &&
        Number(url.port) === frontendPort &&
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
    await mainWindow.loadFile(path.join(__dirname, '..', 'renderer.html'))
  }

  async function loadSetup() {
    if (!mainWindow || mainWindow.isDestroyed()) return
    await mainWindow.loadFile(path.join(__dirname, '..', 'setup.html'))
  }

  async function loadLoading() {
    if (!mainWindow || mainWindow.isDestroyed()) return
    await mainWindow.loadFile(path.join(__dirname, '..', 'loading.html'))
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
        preload: path.join(__dirname, '..', 'preload.js'),
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

  async function openTemplateDesigner() {
    const s = await getStore()
    const serverUrl = String(s.get('serverUrl') || '').replace(/\/+$/, '')
    if (!serverUrl) throw new Error('请先配置服务器地址')
    await frontendRuntime.installApiRedirect(serverUrl)
    await frontendRuntime.startFrontend(serverUrl)

    if (templateWindow && !templateWindow.isDestroyed()) {
      templateWindow.focus()
      return true
    }

    templateWindow = new BrowserWindow({
      ...toolWindowBounds(1280, 820),
      title: '模板设计',
      parent: mainWindow || undefined,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
    templateWindow.on('closed', () => {
      templateWindow = null
    })
    await templateWindow.loadURL(`http://127.0.0.1:${frontendPort}/print-api/?desktopWindow=template-designer`)
    return true
  }

  async function openWebAdmin() {
    const s = await getStore()
    const serverUrl = String(s.get('serverUrl') || '').replace(/\/+$/, '')
    if (!serverUrl) throw new Error('请先配置服务器地址')
    await frontendRuntime.installApiRedirect(serverUrl)
    await frontendRuntime.startFrontend(serverUrl)

    if (adminWindow && !adminWindow.isDestroyed()) {
      adminWindow.focus()
      return true
    }

    adminWindow = new BrowserWindow({
      ...halfScreenWindowBounds(980, 620),
      title: '网页后台',
      parent: mainWindow || undefined,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
    adminWindow.on('closed', () => {
      adminWindow = null
    })
    await adminWindow.loadURL(`http://127.0.0.1:${frontendPort}/admin`)
    return true
  }

  async function loadAdmin(sendStatus) {
    await loadLoading()
    const s = await getStore()
    const serverUrl = String(s.get('serverUrl') || '').replace(/\/+$/, '')
    if (!serverUrl) {
      await loadSetupRef()
      return
    }

    await frontendRuntime.installApiRedirect(serverUrl)
    await frontendRuntime.startFrontend(serverUrl)
    sendStatus('正在打开桌面化后台...', 90)
    await mainWindow.loadURL(`http://127.0.0.1:${frontendPort}/admin`)
  }

  function installMenu(loadAdminFn) {
    const template = [
      {
        label: 'Temple OS',
        submenu: [
          { label: '重新加载工作台', click: () => loadAdminFn().catch((error) => showStartupError(error)) },
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

  function createMainWindow(loadAdminFn) {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 1024,
      minHeight: 680,
      title: 'Temple OS Desktop',
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
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
            preload: path.join(__dirname, '..', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
          },
        },
      }
    })
    installMenu(loadAdminFn)
    return mainWindow
  }

  return {
    createMainWindow,
    loadAdmin,
    loadDesktopShell,
    loadLoading,
    loadSetup,
    openTemplateDesigner,
    openWebAdmin,
    getMainWindow: () => mainWindow,
  }
}

module.exports = {
  createWindowManager,
}
