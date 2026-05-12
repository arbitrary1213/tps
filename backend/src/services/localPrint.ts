export const PRINT_JOB_STATUSES = ['PENDING', 'DISPATCHED', 'PRINTING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const
export const PRINT_ITEM_STATUSES = ['PENDING', 'PRINTING', 'COMPLETED', 'FAILED', 'SKIPPED'] as const

export type PrintJobStatus = typeof PRINT_JOB_STATUSES[number]
export type PrintItemStatus = typeof PRINT_ITEM_STATUSES[number]

export type PrintItemLike = {
  status: string
}

export function isValidPrintItemReportStatus(status: unknown): status is Extract<PrintItemStatus, 'COMPLETED' | 'FAILED'> {
  return status === 'COMPLETED' || status === 'FAILED'
}

export function normalizeReportedItemStatus(status: unknown): Extract<PrintItemStatus, 'COMPLETED' | 'FAILED'> {
  if (!isValidPrintItemReportStatus(status)) {
    throw new Error('INVALID_PRINT_ITEM_STATUS')
  }
  return status
}

export function calculatePrintJobProgress(items: PrintItemLike[]) {
  const printedCount = items.filter((item) => item.status === 'COMPLETED').length
  const failedCount = items.filter((item) => item.status === 'FAILED').length
  const activeCount = items.filter((item) => item.status === 'PENDING' || item.status === 'PRINTING').length

  const status: PrintJobStatus = activeCount > 0
    ? 'PRINTING'
    : (failedCount > 0 ? 'FAILED' : 'COMPLETED')

  return {
    printedCount,
    failedCount,
    status,
  }
}

export function canLocalPrintClientClaimJob(job: { printClientId?: string | null; status: string }, clientId: string) {
  if (job.printClientId === clientId) {
    return ['PENDING', 'DISPATCHED', 'PRINTING', 'FAILED'].includes(job.status)
  }
  return !job.printClientId && job.status === 'PENDING'
}

