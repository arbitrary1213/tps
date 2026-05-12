const fs = require('fs')

function createEmptyStore() {
  return {
    componentVerifyTicket: '',
    componentAccessToken: '',
    componentAccessTokenExpiresAt: 0,
    preAuthCode: '',
    preAuthCodeExpiresAt: 0,
    authorizers: {},
    messages: [],
    articles: [],
    templateMessages: [],
  }
}

function loadStore(storeFile) {
  const initial = createEmptyStore()
  try {
    if (!fs.existsSync(storeFile)) return initial
    return { ...initial, ...JSON.parse(fs.readFileSync(storeFile, 'utf8')) }
  } catch (error) {
    console.warn(`Failed to read WeChat platform store: ${error.message}`)
    return initial
  }
}

function saveStoreToFile(dataDir, storeFile, store) {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2))
}

module.exports = {
  createEmptyStore,
  loadStore,
  saveStoreToFile,
}
