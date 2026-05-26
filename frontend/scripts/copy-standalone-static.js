const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const source = path.join(root, '.next', 'static')
const target = path.join(root, '.next', 'standalone', '.next', 'static')
const publicSource = path.join(root, 'public')
const publicTarget = path.join(root, '.next', 'standalone', 'public')

if (!fs.existsSync(source)) {
  console.warn(`Static directory not found: ${source}`)
  process.exit(0)
}

fs.mkdirSync(path.dirname(target), { recursive: true })
fs.rmSync(target, { recursive: true, force: true })
fs.cpSync(source, target, { recursive: true })
console.log(`Copied ${source} -> ${target}`)

if (fs.existsSync(publicSource)) {
  fs.rmSync(publicTarget, { recursive: true, force: true })
  fs.cpSync(publicSource, publicTarget, { recursive: true })
  console.log(`Copied ${publicSource} -> ${publicTarget}`)
}

// Copy node_modules for standalone packaging (electron-builder filters "node_modules" name)
const nmSource = path.join(root, '.next', 'standalone', 'node_modules')
const nmBackup = path.join(root, '.next', 'standalone', 'standalone_deps')
if (fs.existsSync(nmSource)) {
  fs.rmSync(nmBackup, { recursive: true, force: true })
  fs.cpSync(nmSource, nmBackup, { recursive: true })
  console.log(`Copied node_modules -> standalone_deps for packaging`)
}
