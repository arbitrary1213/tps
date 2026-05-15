const path = require('path')

let Store
let store
let localDb = null

function nowIso() {
  return new Date().toISOString()
}

function createLocalId(prefix = 'local') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
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
      },
    })
  }
  return store
}

function getLocalDb(app, Database) {
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

function upsertLocalEntity(app, Database, entityType, data, options = {}) {
  const db = getLocalDb(app, Database)
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

function listLocalEntities(app, Database, entityType) {
  const db = getLocalDb(app, Database)
  return db.prepare(`
    SELECT * FROM local_entities
    WHERE entity_type = ? AND deleted = 0
    ORDER BY local_updated_at DESC
  `).all(entityType).map((row) => JSON.parse(row.data))
}

function enqueueOfflineOperation(app, Database, operation) {
  const db = getLocalDb(app, Database)
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

function closeLocalDb() {
  if (localDb) {
    try { localDb.close() } catch (_) {}
    localDb = null
  }
}

module.exports = {
  closeLocalDb,
  enqueueOfflineOperation,
  getLocalDb,
  getStore,
  listLocalEntities,
  upsertLocalEntity,
}
