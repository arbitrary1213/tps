// Plaque Export API - calls /api/batch/export-plaques which returns CSV stream

function getCsrfToken(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)csrf=([^;]*)/)
  return match ? match[1] : undefined
}

export const plaqueExportAPI = {
  exportPlaques: async (token: string, plaqueIds: string[]): Promise<void> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''
    const url = API_BASE + '/api/batch/export-plaques'
    let csrf = getCsrfToken()
    if (!csrf) {
      try {
        await fetch('/api/auth/csrf-token', { credentials: 'include' }).then(r => r.json())
        csrf = getCsrfToken()
      } catch {}
    }
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
    if (csrf) headers['x-csrf-token'] = csrf
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ plaqueIds }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Export failed' }))
      throw new Error(err.error || 'Export failed')
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = 'plaques_' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  },
}
