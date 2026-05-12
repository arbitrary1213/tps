import { describe, expect, test } from 'vitest'
import { normalizeDateFields, normalizeNullableForeignKeys } from './business.normalize'

describe('business payload normalization', () => {
  test('removes empty nullable foreign keys', () => {
    const data = normalizeNullableForeignKeys({
      templateId: '',
      devoteeId: 'null',
      ritualId: 'undefined',
      plaqueType: 'LONGEVITY'
    }, ['templateId', 'devoteeId', 'ritualId'])

    expect(data).toEqual({ plaqueType: 'LONGEVITY' })
  })

  test('removes empty and invalid ritual dates', () => {
    const data = normalizeDateFields({
      ritualDate: '',
      registrationDeadline: '0/0/0',
      name: 'test'
    }, ['ritualDate', 'registrationDeadline'])

    expect(data).toEqual({ name: 'test' })
  })
})
