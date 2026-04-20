'use client'

import { clsx } from 'clsx'
import { Button } from './Button'

interface Column<T> {
  key: string
  title: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface TableProps<T> {
  columns: Column<T>[] | any[]
  data: T[] | any[]
  loading?: boolean
  emptyText?: string
  onRowClick?: (row: T) => void
  pagination?: Pagination
}

export function Table<T extends { id?: string }>({
  columns,
  data,
  loading,
  emptyText = '暂无数据',
  onRowClick,
  pagination,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-8 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-vermilion border-t-transparent rounded-full" />
        <p className="mt-3 text-tea/60">加载中...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-8 text-center">
        <div className="text-4xl text-tea/30 mb-3"></div>
        <p className="text-tea/60">{emptyText}</p>
      </div>
    )
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  return (
    <div className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5F0E6] text-tea text-sm font-medium border-b border-[#E8E0D0]">
              {columns.map((col) => (
                <th key={col.key} className={clsx('py-3 px-4 text-left', col.className)}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  'border-b border-[#F5F0E6] hover:bg-[#F5F0E6]/50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-ink">
                    {col.render
                      ? col.render(row)
                      : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#F5F0E6] border-t border-[#E8E0D0]">
          <p className="text-sm text-tea/70">
            共 {pagination.total} 条，第 {pagination.page}/{totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}