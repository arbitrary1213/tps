// Plaque Export API - calls /api/batch/export-plaques which returns CSV stream

export const plaqueExportAPI = {
  exportPlaques: async (token: string, plaqueIds: string[]): Promise<void> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''
    const url = API_BASE + '/api/batch/export-plaques'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
