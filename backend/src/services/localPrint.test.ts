import { describe, expect, test } from 'vitest'
import {
  calculatePrintJobProgress,
  canLocalPrintClientClaimJob,
  normalizeReportedItemStatus
} from './localPrint'

describe('local print state machine', () => {
  test('accepts completed and failed item reports only', () => {
    expect(normalizeReportedItemStatus('COMPLETED')).toBe('COMPLETED')
    expect(normalizeReportedItemStatus('FAILED')).toBe('FAILED')
    expect(() => normalizeReportedItemStatus('PENDING')).toThrow('INVALID_PRINT_ITEM_STATUS')
    expect(() => normalizeReportedItemStatus(undefined)).toThrow('INVALID_PRINT_ITEM_STATUS')
  })

  test('keeps job printing while pending or printing items remain', () => {
    expect(calculatePrintJobProgress([
      { status: 'COMPLETED' },
      { status: 'PENDING' },
      { status: 'FAILED' },
    ])).toEqual({
      printedCount: 1,
      failedCount: 1,
      status: 'PRINTING',
    })
  })

  test('marks job completed when every item completed', () => {
    expect(calculatePrintJobProgress([
      { status: 'COMPLETED' },
      { status: 'COMPLETED' },
    ])).toEqual({
      printedCount: 2,
      failedCount: 0,
      status: 'COMPLETED',
    })
  })

  test('marks job failed when no active items remain and at least one item failed', () => {
    expect(calculatePrintJobProgress([
      { status: 'COMPLETED' },
      { status: 'FAILED' },
    ])).toEqual({
      printedCount: 1,
      failedCount: 1,
      status: 'FAILED',
    })
  })

  test('allows clients to claim unassigned pending jobs or their own active jobs', () => {
    expect(canLocalPrintClientClaimJob({ printClientId: null, status: 'PENDING' }, 'client-1')).toBe(true)
    expect(canLocalPrintClientClaimJob({ printClientId: 'client-1', status: 'FAILED' }, 'client-1')).toBe(true)
    expect(canLocalPrintClientClaimJob({ printClientId: 'client-2', status: 'PENDING' }, 'client-1')).toBe(false)
    expect(canLocalPrintClientClaimJob({ printClientId: null, status: 'COMPLETED' }, 'client-1')).toBe(false)
  })
})

