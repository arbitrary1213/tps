'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Badge } from '@/components/ui'

const taskTypeMap: Record<string, string> = {
  VOLUNTEER: '义工报名',
  LONGEVITY: '延生禄位',
  REBIRTH: '往生莲位',
  DELIVERANCE: '超度牌位',
  RITUAL: '法会报名',
  LAMP: '供灯祈福',
  ACCOMMODATION: '住宿登记',
  DINING: '斋堂用餐',
}

const statusMap: Record<string, { label: string; variant: string }> = {
  PENDING: { label: '待审批', variant: 'warning' },
  APPROVED: { label: '已通过', variant: 'success' },
  REJECTED: { label: '已拒绝', variant: 'danger' },
}

export default function AdminDashboard() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState({
    pendingCount: 0,
    volunteerCount: 0,
    plaqueCount: 0,
    ritualCount: 0,
  })
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadDashboardData()
    }
  }, [token])

  const loadDashboardData = async () => {
    try {
      const data = await businessAPI.getStats(token!)
      setStats({
        pendingCount: data.pendingCount || 0,
        volunteerCount: data.volunteerCount || 0,
        plaqueCount: data.plaqueCount || 0,
        ritualCount: data.ritualCount || 0,
      })
      setRecentRegistrations(data.recentRegistrations || [])
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: '待审批', value: stats.pendingCount, color: 'bg-gold-pale' },
    { label: '义工总数', value: stats.volunteerCount, color: 'bg-paper-dark' },
    { label: '牌位总数', value: stats.plaqueCount, color: 'bg-vermilion-light' },
    { label: '法会场次', value: stats.ritualCount, color: 'bg-bamboo/10' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-vermilion border-t-transparent rounded-full" />
          <p className="mt-4 text-tea/60">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6 ${stat.color}`}>
            <div className="text-2xl font-bold text-ink">{stat.value}</div>
            <div className="text-sm text-tea/70 mt-1 tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-ink">最近登记</h2>
          <Link href="/admin/approvals" className="text-sm text-vermilion hover:underline tracking-wide">
            查看全部
          </Link>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="text-center py-8 text-tea/60">暂无登记记录</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F0E6] text-tea text-sm font-medium border-b border-[#E8E0D0]">
                <th className="text-left py-3 px-4">姓名</th>
                <th className="text-left py-3 px-4">类型</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-left py-3 px-4">日期</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((item) => (
                <tr key={item.id} className="border-b border-[#F5F0E6] hover:bg-[#F5F0E6]/50 transition-colors">
                  <td className="py-3 px-4 text-ink">{item.submitterName}</td>
                  <td className="py-3 px-4 text-tea">{taskTypeMap[item.taskType] || item.taskType}</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusMap[item.status]?.variant as any || 'info'}>
                      {statusMap[item.status]?.label || item.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-tea/70">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/admin/tasks" className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6 hover:border-vermilion transition-colors">
          <div className="font-medium text-ink tracking-wide">发布登记</div>
          <div className="text-sm text-tea/60 mt-1">配置新的登记表单</div>
        </Link>
        <Link href="/admin/plaques" className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6 hover:border-vermilion transition-colors">
          <div className="font-medium text-ink tracking-wide">牌位管理</div>
          <div className="text-sm text-tea/60 mt-1">管理延生禄位/往生莲位</div>
        </Link>
        <Link href="/admin/volunteers" className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6 hover:border-vermilion transition-colors">
          <div className="font-medium text-ink tracking-wide">义工管理</div>
          <div className="text-sm text-tea/60 mt-1">管理义工档案和任务</div>
        </Link>
      </div>
    </div>
  )
}