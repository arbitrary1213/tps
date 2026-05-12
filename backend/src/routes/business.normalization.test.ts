import { describe, expect, test } from 'vitest'

type RecordLike = Record<string, any>

function normalizeNullableForeignKeys(data: RecordLike, keys: string[]) {
  for (const key of keys) {
    if (data[key] === '') delete data[key]
  }
  return data
}

function normalizeRitualPayload(data: RecordLike) {
  for (const key of ['ritualDate', 'registrationDeadline']) {
    const value = data[key]
    if (typeof value === 'string') {
      if (['', 'undefined', 'null'].includes(value)) {
        delete data[key]
      } else {
        const parsed = new Date(value)
        data[key] = isNaN(parsed.getTime()) ? undefined : parsed
      }
    }
  }
  return data
}

describe('business route payload normalization', () => {
  test('removes empty nullable foreign keys for plaque creation', () => {
    const data = normalizeNullableForeignKeys({
      templateId: '',
      devoteeId: '',
      ritualId: '',
      plaqueType: 'LONGEVITY'
    }, ['templateId', 'devoteeId', 'ritualId'])

    expect(data).toEqual({ plaqueType: 'LONGEVITY' })
  })

  test('removes empty ritual date fields during update normalization', () => {
    const data = normalizeRitualPayload({
      ritualDate: '',
      registrationDeadline: 'null',
      name: 'test'
    })

    expect(data).toEqual({ name: 'test' })
  })
})
