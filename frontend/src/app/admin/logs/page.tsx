'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Card, Table, Badge, Select, Empty } from '@/components/ui'

interface Log {
  id: string
  userId: string
  username: string
  action: string
  targetType: string
  targetId: string
  beforeValue?: any
  afterValue?: any
  createdAt: string
}

const actionMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  CREATE: { label: '创建', variant: 'success' },
  UPDATE: { label: '更新', variant: 'warning' },
  DELETE: { label: '删除', variant: 'danger' },
}

export default function LogsPage() {
  const { token } = useAuthStore()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [page, actionFilter, targetFilter])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params: any = { page, pageSize: 20 }
      if (actionFilter) params.action = actionFilter
      if (targetFilter) params.targetType = targetFilter
      const data = await businessAPI.getLogs(token!, params)
      setLogs(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'createdAt', title: '时间', render: (row: Log) => new Date(row.createdAt).toLocaleString('zh-CN') },
    { key: 'username', title: '用户' },
    { key: 'action', title: '操作', render: (row: Log) => {
      const action = actionMap[row.action]
      return <Badge variant={action?.variant || 'info'}>{action?.label || row.action}</Badge>
    }},
    { key: 'targetType', title: '对象类型' },
    { key: 'targetId', title: '对象ID', render: (row: Log) => (
      <span className="text-xs text-tea/60 truncate max-w-32 block">{row.targetId}</span>
    )},
    { key: 'details', title: '详情', render: (row: Log) => {
      if (row.action === 'CREATE') {
        return <span className="text-bamboo text-sm">新增记录</span>
      }
      if (row.action === 'UPDATE' && row.afterValue) {
        const keys = Object.keys(row.afterValue).filter(k => !k.startsWith('_'))
        return <span className="text-tea text-sm">修改 {keys.slice(0, 2).join(', ')}</span>
      }
      return '-'
    }},
  ]

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-ink">操作日志</h2>
        <p className="text-sm text-tea/60 mt-1">查看所有用户的操作记录</p>
      </div>

      <div className="flex gap-4">
        <Select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: '全部操作' },
            { value: 'CREATE', label: '创建' },
            { value: 'UPDATE', label: '更新' },
            { value: 'DELETE', label: '删除' },
          ]}
        />
        <Select
          value={targetFilter}
          onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: '全部类型' },
            { value: 'volunteer', label: '义工' },
            { value: 'volunteer_task', label: '义工任务' },
            { value: 'plaque', label: '牌位' },
            { value: 'ritual', label: '法会' },
            { value: 'devotee', label: '信众' },
            { value: 'donation', label: '功德' },
          ]}
        />
      </div>

      <Card>
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          emptyText="暂无操作记录"
        />
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[#E8E0D0] rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2">
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-[#E8E0D0] rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}