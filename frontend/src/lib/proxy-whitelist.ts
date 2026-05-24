const DEFAULT_REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || ''

const ALLOWED_BASES = (() => {
  const bases = new Set<string>()
  if (DEFAULT_REMOTE_API_BASE) bases.add(DEFAULT_REMOTE_API_BASE)
  const extra = process.env.ALLOWED_API_BASES
  if (extra) extra.split(',').forEach((b) => bases.add(b.trim()))
  if (process.env.NODE_ENV !== 'production') {
    bases.add('http://localhost:3002')
    bases.add('http://127.0.0.1:3002')
  }
  return bases
})()

function validateOrigin(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    const origin = parsed.origin
    for (const allowed of ALLOWED_BASES) {
      try {
        const allowedOrigin = new URL(allowed).origin
        if (origin === allowedOrigin) return true
      } catch {
        continue
      }
    }
    return false
  } catch {
    return false
  }
}

export function resolveRemoteBase(headerBase: string | null): string {
  if (headerBase) {
    const trimmed = headerBase.replace(/\/+$/, '')
    if (!validateOrigin(trimmed)) {
      throw new Error(`API base not allowed: ${trimmed}`)
    }
    return trimmed
  }
  if (!DEFAULT_REMOTE_API_BASE) {
    throw new Error('Server API base is not configured')
  }
  return DEFAULT_REMOTE_API_BASE.replace(/\/+$/, '')
}
