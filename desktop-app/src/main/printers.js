const { execFile } = require('child_process')

function listWindowsPrinters() {
  if (process.platform !== 'win32') return Promise.resolve([])

  const command = [
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;',
    '$OutputEncoding = [System.Text.Encoding]::UTF8;',
    'Get-Printer',
    '|',
    'Select-Object Name,DriverName,PortName,PrinterStatus',
    '|',
    'ConvertTo-Json -Depth 3',
  ].join(' ')

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 10000, encoding: 'utf8' },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([])
          return
        }

        try {
          const parsed = JSON.parse(stdout)
          const rows = Array.isArray(parsed) ? parsed : [parsed]
          resolve(rows.filter((row) => row?.Name).map((row) => ({
            name: row.Name,
            displayName: row.Name,
            description: row.DriverName || '',
            status: row.PrinterStatus,
            isDefault: false,
            options: {
              driverName: row.DriverName || '',
              portName: row.PortName || '',
              source: 'windows',
            },
          })))
        } catch {
          resolve([])
        }
      }
    )
  })
}

function powershellString(value) {
  return `'${String(value || '').replace(/'/g, "''")}'`
}

function listWindowsPrinterPaperSizes(printerName) {
  if (process.platform !== 'win32' || !printerName) return Promise.resolve([])

  const command = [
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;',
    '$OutputEncoding = [System.Text.Encoding]::UTF8;',
    'Add-Type -AssemblyName System.Drawing;',
    '$printer = New-Object System.Drawing.Printing.PrinterSettings;',
    `$printer.PrinterName = ${powershellString(printerName)};`,
    'if (-not $printer.IsValid) { @() | ConvertTo-Json; exit 0 }',
    '$printer.PaperSizes',
    '|',
    'ForEach-Object { [PSCustomObject]@{',
    'name = $_.PaperName;',
    'kind = $_.Kind.ToString();',
    'rawKind = $_.RawKind;',
    'widthInch100 = $_.Width;',
    'heightInch100 = $_.Height;',
    'widthMm = [Math]::Round($_.Width * 0.254, 2);',
    'heightMm = [Math]::Round($_.Height * 0.254, 2)',
    '} }',
    '|',
    'ConvertTo-Json -Depth 3',
  ].join(' ')

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 10000, encoding: 'utf8' },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([])
          return
        }

        try {
          const parsed = JSON.parse(stdout)
          const rows = Array.isArray(parsed) ? parsed : [parsed]
          resolve(rows.filter((row) => row?.name).map((row) => ({
            name: row.name,
            kind: row.kind || '',
            rawKind: row.rawKind,
            widthMm: Number(row.widthMm) || 0,
            heightMm: Number(row.heightMm) || 0,
            widthInch100: Number(row.widthInch100) || 0,
            heightInch100: Number(row.heightInch100) || 0,
          })))
        } catch {
          resolve([])
        }
      }
    )
  })
}

async function listAllPrinters(event) {
  const chromiumPrinters = await event.sender.getPrintersAsync().catch(() => [])
  const windowsPrinters = await listWindowsPrinters()
  const byName = new Map()

  for (const printer of [...chromiumPrinters, ...windowsPrinters]) {
    if (!printer?.name) continue
    const existing = byName.get(printer.name) || {}
    byName.set(printer.name, {
      ...printer,
      ...existing,
      name: printer.name,
      displayName: existing.displayName || printer.displayName || printer.name,
      description: existing.description || printer.description || printer.options?.driverName || '',
      options: {
        ...(printer.options || {}),
        ...(existing.options || {}),
      },
    })
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

module.exports = {
  listAllPrinters,
  listWindowsPrinterPaperSizes,
}
