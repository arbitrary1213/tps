const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('templeDesktop', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch) => ipcRenderer.invoke('config:set', patch),
  clearConfig: () => ipcRenderer.invoke('config:clear'),
  getCache: (key) => ipcRenderer.invoke('cache:get', key),
  setCache: (key, value) => ipcRenderer.invoke('cache:set', key, value),
  clearCache: () => ipcRenderer.invoke('cache:clear'),
  upsertLocalRows: (entityType, rows) => ipcRenderer.invoke('local-db:upsert-many', entityType, rows),
  listLocalRows: (entityType) => ipcRenderer.invoke('local-db:list', entityType),
  offlineSave: (operation) => ipcRenderer.invoke('local-db:offline-save', operation),
  getSyncQueue: () => ipcRenderer.invoke('local-db:queue'),
  getLocalDbInfo: () => ipcRenderer.invoke('local-db:info'),
  getAppInfo: () => ipcRenderer.invoke('desktop:app-info'),
  openAdmin: () => ipcRenderer.invoke('desktop:open-admin'),
  openSetup: () => ipcRenderer.invoke('desktop:open-setup'),
  openTemplateDesigner: () => ipcRenderer.invoke('desktop:open-template-designer'),
  openWebAdmin: () => ipcRenderer.invoke('desktop:open-web-admin'),
  reloadAdmin: () => ipcRenderer.invoke('desktop:reload-admin'),
  checkServer: (serverUrl) => ipcRenderer.invoke('desktop:check-server', serverUrl),
  listPrinters: () => ipcRenderer.invoke('printers:list'),
  listPrinterPaperSizes: (printerName) => ipcRenderer.invoke('printers:paper-sizes', printerName),
  printHtml: (options) => ipcRenderer.invoke('print:html', options),
  onStatus: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('desktop:status', handler)
    return () => ipcRenderer.removeListener('desktop:status', handler)
  },
})
