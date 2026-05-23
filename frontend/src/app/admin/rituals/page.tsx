'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'
import type { PlaqueRecord } from '@/types/api'

const ritualTypeOptions = [
  { value: 'BUDDHA_BIRTH', label: '佛诞法会' },
  { value: 'MEDITATION', label: '禅修法会' },
  { value: 'PURIFICATION', label: '消灾法会' },
  { value: 'REPOSE', label: '超度法会' },
  { value: 'OTHER', label: '其他' },
]

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'UPCOMING', label: '即将开始' },
  { value: 'ONGOING', label: '进行中' },
  { value: 'COMPLETED', label: '已结束' },
]

interface Ritual {
  id: string
  name: string
  ritualType: string
  description?: string
  ritualDate: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  fee: number
  registrationDeadline?: string
  allowOnlineRegistration: boolean
  status: string
  createdAt: string
}

export default function RitualsPage() {
  const { token } = useAuthStore()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRitualId, setExpandedRitualId] = useState<string | null>(null)
  const [ritualPlaques, setRitualPlaques] = useState<PlaqueRecord[]>([])
  const [loadingPlaques, setLoadingPlaques] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ritual | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    ritualType: 'BUDDHA_BIRTH',
    description: '',
    ritualDate: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: 100,
    fee: 0,
    registrationDeadline: '',
    allowOnlineRegistration: true,
    status: 'DRAFT',
  })

  useEffect(() => {
    loadRituals()
  }, [])

  const loadRituals = async () => {
    try {
      const data = await businessAPI.getRituals()
      setRituals(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name?.trim()) { alert('请输入法会名称'); return; }
    if (!formData.ritualDate?.trim()) { alert('请选择日期'); return; }
    if (!formData.startTime?.trim()) { alert('请选择开始时间'); return; }
    if (!formData.endTime?.trim()) { alert('请选择结束时间'); return; }
    if (!formData.location?.trim()) { alert('请输入地点'); return; }
    try {
      if (editing) {
        await businessAPI.updateRitual(token!, editing.id, formData)
      } else {
        await businessAPI.createRitual(token!, formData)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      loadRituals()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (ritual: Ritual) => {
    setEditing(ritual)
    setFormData({
      name: ritual.name,
      ritualType: ritual.ritualType,
      description: ritual.description || '',
      ritualDate: ritual.ritualDate.split('T')[0],
      startTime: ritual.startTime,
      endTime: ritual.endTime,
      location: ritual.location,
      maxParticipants: ritual.maxParticipants,
      fee: ritual.fee,
      registrationDeadline: ritual.registrationDeadline?.split('T')[0] || '',
      allowOnlineRegistration: ritual.allowOnlineRegistration,
      status: ritual.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await businessAPI.deleteRitual(token!, id)
      loadRituals()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const togglePlaques = async (ritualId: string) => {
    if (expandedRitualId === ritualId) {
      setExpandedRitualId(null)
      setRitualPlaques([])
      return
    }
    setExpandedRitualId(ritualId)
    setLoadingPlaques(true)
    try {
      const plaques = await businessAPI.getRitualPlaques(token!, ritualId)
      setRitualPlaques(plaques || [])
    } catch (error) {
      console.error('加载牌位失败:', error)
    } finally {
      setLoadingPlaques(false)
    }
  }

  const handleStatusChange = async (ritual: Ritual, newStatus: string) => {
    try {
      await businessAPI.updateRitual(token!, ritual.id, { ...ritual, status: newStatus })
      loadRituals()
    } catch (error) {
      console.error('状态更新失败:', error)
    }
  }

  const plaqueTypeLabels: Record<string, string> = {
    LONGEVITY: '延生禄位', REBIRTH: '往生莲位', DELIVERANCE: '超度牌位',
  }
  const plaqueStatusLabels: Record<string, string> = {
    ACTIVE: '有效', EXPIRED: '已过期', CANCELLED: '已作废', RENEWED: '已延期',
  }

  const renderPlaqueSubTable = () => (
    <div className="px-4 py-3 bg-paper-dark border-t border-[#E8E0D0]">
      <h4 className="text-sm font-medium text-tea mb-3">
        关联牌位（{ritualPlaques.length}个，含已归档）
      </h4>
      {loadingPlaques ? (
        <p className="text-sm text-tea/60 py-4 text-center">加载中...</p>
      ) : ritualPlaques.length === 0 ? (
        <p className="text-sm text-tea/60 py-4 text-center">该法会暂无关联牌位</p>
      ) : (
        <div className="overflow-x-auto rounded border border-[#E8E0D0]">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F0E8]">
              <tr>
                <th className="px-3 py-2 text-left text-tea font-medium">编码</th>
                <th className="px-3 py-2 text-left text-tea font-medium">类型</th>
                <th className="px-3 py-2 text-left text-tea font-medium">牌位主体</th>
                <th className="px-3 py-2 text-left text-tea font-medium">阳上</th>
                <th className="px-3 py-2 text-left text-tea font-medium">规格</th>
                <th className="px-3 py-2 text-left text-tea font-medium">有效期</th>
                <th className="px-3 py-2 text-left text-tea font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {ritualPlaques.map((p: PlaqueRecord) => (
                <tr key={p.id} className="border-t border-[#E8E0D0] hover:bg-white/50">
                  <td className="px-3 py-2 font-mono text-xs text-tea/70">{p.code || '-'}</td>
                  <td className="px-3 py-2">
                    <Badge variant="info">{plaqueTypeLabels[p.plaqueType] || p.plaqueType}</Badge>
                  </td>
                  <td className="px-3 py-2 text-ink">
                    {p.plaqueType === 'LONGEVITY' ? p.holderName || '-'
                      : p.plaqueType === 'DELIVERANCE' ? (p.dedicationType || '-')
                      : p.deceasedName ? `${p.deceasedName}往生莲位` : '-'}
                  </td>
                  <td className="px-3 py-2 text-tea">{p.yangShang || '-'}</td>
                  <td className="px-3 py-2 text-tea">{p.size || '-'}</td>
                  <td className="px-3 py-2 text-tea text-xs whitespace-nowrap">
                    {p.startDate ? new Date(p.startDate).toLocaleDateString('zh-CN') : '-'} ~ {p.endDate ? new Date(p.endDate).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'EXPIRED' ? 'warning' : 'gray'}>
                      {plaqueStatusLabels[p.status] || p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const resetForm = () => {
    setFormData({
      name: '',
      ritualType: 'BUDDHA_BIRTH',
      description: '',
      ritualDate: '',
      startTime: '',
      endTime: '',
      location: '',
      maxParticipants: 100,
      fee: 0,
      registrationDeadline: '',
      allowOnlineRegistration: true,
      status: 'DRAFT',
    })
  }

  const statusBadgeMap: Record<string, 'gray' | 'info' | 'warning' | 'success'> = {
    DRAFT: 'gray',
    PUBLISHED: 'info',
    UPCOMING: 'warning',
    ONGOING: 'success',
    COMPLETED: 'gray',
    CANCELLED: 'gray',
  }

  const activeStatuses = ['DRAFT', 'PUBLISHED', 'UPCOMING', 'ONGOING']
  const pastStatuses = ['COMPLETED', 'CANCELLED']

  const activeRituals = rituals.filter(r => activeStatuses.includes(r.status))
  const pastRituals = rituals.filter(r => pastStatuses.includes(r.status))

  const columns = [
    { key: 'name', title: '法会名称' },
    { key: 'ritualType', title: '类型', render: (row: Ritual) => (
      <Badge variant="info">{ritualTypeOptions.find(t => t.value === row.ritualType)?.label || row.ritualType}</Badge>
    )},
    { key: 'ritualDate', title: '日期', render: (row: Ritual) => row.ritualDate ? new Date(row.ritualDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'time', title: '时间', render: (row: Ritual) => `${row.startTime} - ${row.endTime}` },
    { key: 'location', title: '地点' },
    { key: 'participants', title: '人数', render: (row: Ritual) => (
      <span className={row.currentParticipants >= row.maxParticipants ? 'text-vermilion' : 'text-tea'}>
        {row.currentParticipants} / {row.maxParticipants}
      </span>
    )},
    { key: 'fee', title: '费用', render: (row: Ritual) => row.fee === 0 ? '免费' : `¥${row.fee}` },
    { key: 'status', title: '状态', render: (row: Ritual) => (
      <Badge variant={statusBadgeMap[row.status] || 'info'}>
        {statusOptions.find(s => s.value === row.status)?.label || row.status}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Ritual & { _count?: { plaques: number } }) => (
      <div className="flex gap-2 items-center">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)} className="active:scale-[0.98] transition-all duration-200">编辑</Button>
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          className="text-xs border border-[#E8E0D0] rounded px-2 py-1"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Button
          size="sm"
          variant={expandedRitualId === row.id ? 'primary' : 'ghost'}
          onClick={() => togglePlaques(row.id)}
          className="active:scale-[0.98] transition-all duration-200"
        >
          牌位{row._count?.plaques ? ` (${row._count.plaques})` : ''}
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} className="active:scale-[0.98] transition-all duration-200">删除</Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">法会管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理法会的创建、发布和参与者</p>
        </div>
        <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">
          新建法会
        </Button>
      </div>

      <section>
        <h3 className="text-lg font-medium text-ink mb-3">进行中法会</h3>
        <Card>
          <div className="overflow-x-auto rounded-xl border min-w-0">
            <Table
              columns={columns}
              data={activeRituals}
              loading={loading}
              emptyText="暂无进行中法会"
            />
            {expandedRitualId && activeRituals.some(r => r.id === expandedRitualId) && renderPlaqueSubTable()}
          </div>
        </Card>
      </section>

      <section>
        <h3 className="text-lg font-medium text-ink mb-3">往期法会</h3>
        <Card>
          <div className="overflow-x-auto rounded-xl border min-w-0">
            <Table
              columns={columns}
              data={pastRituals}
              loading={loading}
              emptyText="暂无往期法会"
            />
            {expandedRitualId && pastRituals.some(r => r.id === expandedRitualId) && renderPlaqueSubTable()}
          </div>
        </Card>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑法会' : '新建法会'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="法会名称 *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="如：观音诞辰法会"
            />
            <Select
              label="法会类型"
              value={formData.ritualType}
              onChange={(e) => setFormData({ ...formData, ritualType: e.target.value })}
              options={ritualTypeOptions}
            />
          </div>
          <Textarea
            label="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="法会详细描述..."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              onClick={(e) => e.stopPropagation()}
              label="日期 *"
              type="date"
              value={formData.ritualDate}
              onChange={(e) => setFormData({ ...formData, ritualDate: e.target.value })}
            />
            <Input
              onClick={(e) => e.stopPropagation()}
              label="开始时间 *"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              onClick={(e) => e.stopPropagation()}
              label="结束时间 *"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="地点 *"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Input
              label="最大参与人数"
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="费用（0为免费）"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
            />
            <Input
              onClick={(e) => e.stopPropagation()}
              label="报名截止日期"
              type="date"
              value={formData.registrationDeadline}
              onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }} className="active:scale-[0.98] transition-all duration-200">取消</Button>
          <Button onClick={handleSubmit} className="active:scale-[0.98] transition-all duration-200">保存</Button>
        </div>
      </Modal>
    </div>
  )
}