export type RouteData = Record<string, any>

export type PlaqueImportType = 'LONGEVITY' | 'REBIRTH' | 'DELIVERANCE'

export type PlaqueDuplicateIdentity = {
  plaqueType: PlaqueImportType
  holderName?: unknown
  longevitySubtype?: unknown
  size?: unknown
  gender?: unknown
  birthDate?: unknown
  birthLunar?: unknown
  deceasedName?: unknown
  deceasedName2?: unknown
  deathLunar?: unknown
  birthDate2?: unknown
  deathDate2?: unknown
  dedicationType?: unknown
  yangShang?: unknown
  phone?: unknown
  address?: unknown
  blessingText?: unknown
  startDate?: unknown
  deathDate?: unknown
  endDate?: unknown
}

export function normalizeNullableForeignKeys(data: RouteData, keys: string[]) {
  for (const key of keys) {
    if (data[key] === '' || data[key] === 'undefined' || data[key] === 'null') {
      delete data[key]
    }
  }
  return data
}

export function normalizeDateFields(data: RouteData, keys: string[]) {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string') {
      if (['', 'undefined', 'null'].includes(value) || value === '0/0/0' || /^0[\\/-]0[\\/-]0/.test(value)) {
        delete data[key]
      } else {
        const parsed = new Date(value)
        if (isNaN(parsed.getTime())) delete data[key]
        else data[key] = parsed
      }
    } else if (value === undefined || value === null) {
      delete data[key]
    }
  }
  return data
}

export function normalizePlaqueKeyText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .trim()
}

export function parseSpreadsheetDateValue(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const wholeDays = Math.floor(value)
    if (wholeDays <= 0) return undefined
    const millis = (wholeDays - 25569) * 86400 * 1000
    const parsed = new Date(millis)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  if (typeof value === 'string') {
    const normalized = value.normalize('NFKC').trim()
    if (
      normalized === '' ||
      normalized === 'undefined' ||
      normalized === 'null' ||
      normalized === '0/0/0' ||
      /^0[\\/-]0[\\/-]0/.test(normalized)
    ) {
      return undefined
    }

    const ymdMatch =
      normalized.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/) ||
      normalized.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch
      const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
      return Number.isNaN(parsed.getTime()) ? undefined : parsed
    }

    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  return undefined
}

export function normalizePlaqueKeyDate(value: unknown) {
  const parsed = parseSpreadsheetDateValue(value)
  return parsed ? parsed.toISOString().split('T')[0] : ''
}

export function normalizePlaqueKeyFlag(value: unknown) {
  return value ? '1' : '0'
}

export function buildPlaqueImportDuplicateKey(identity: PlaqueDuplicateIdentity) {
  if (identity.plaqueType === 'LONGEVITY') {
    return [
      'LONGEVITY',
      normalizePlaqueKeyText(identity.holderName),
      normalizePlaqueKeyText(identity.longevitySubtype),
      normalizePlaqueKeyText(identity.size),
      normalizePlaqueKeyText(identity.gender),
      normalizePlaqueKeyText(identity.birthDate),
      normalizePlaqueKeyFlag(identity.birthLunar),
      normalizePlaqueKeyText(identity.yangShang),
      normalizePlaqueKeyText(identity.phone),
      normalizePlaqueKeyText(identity.address),
      normalizePlaqueKeyText(identity.blessingText),
      normalizePlaqueKeyDate(identity.startDate),
      normalizePlaqueKeyDate(identity.endDate)
    ].join('|')
  }

  if (identity.plaqueType === 'REBIRTH') {
    return [
      'REBIRTH',
      normalizePlaqueKeyText(identity.deceasedName),
      normalizePlaqueKeyText(identity.deceasedName2),
      normalizePlaqueKeyText(identity.size),
      normalizePlaqueKeyText(identity.gender),
      normalizePlaqueKeyText(identity.birthDate),
      normalizePlaqueKeyFlag(identity.birthLunar),
      normalizePlaqueKeyText(identity.deathDate),
      normalizePlaqueKeyFlag(identity.deathLunar),
      normalizePlaqueKeyText(identity.birthDate2),
      normalizePlaqueKeyText(identity.deathDate2),
      normalizePlaqueKeyText(identity.yangShang),
      normalizePlaqueKeyText(identity.phone),
      normalizePlaqueKeyText(identity.address),
      normalizePlaqueKeyDate(identity.startDate),
      normalizePlaqueKeyDate(identity.endDate)
    ].join('|')
  }

  return [
    'DELIVERANCE',
    normalizePlaqueKeyText(identity.dedicationType),
    normalizePlaqueKeyText(identity.size),
    normalizePlaqueKeyText(identity.yangShang),
    normalizePlaqueKeyText(identity.phone),
    normalizePlaqueKeyText(identity.address),
    normalizePlaqueKeyDate(identity.startDate),
    normalizePlaqueKeyDate(identity.endDate)
  ].join('|')
}
