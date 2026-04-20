'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

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

  const handleStatusChange = async (ritual: Ritual, newStatus: string) => {
    try {
      await businessAPI.updateRitual(token!, ritual.id, { ...ritual, status: newStatus })
      loadRituals()
    } catch (error) {
      console.error('状态更新失败:', error)
    }
  }

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
  }

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
    { key: 'actions', title: '操作', render: (row: Ritual) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>编辑</Button>
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          className="text-xs border border-[#E8E0D0] rounded px-2 py-1"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>删除</Button>
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
        <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }}>
          新建法会
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={rituals}
          loading={loading}
          emptyText="暂无法会"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑法会' : '新建法会'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="法会名称"
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
              label="日期"
              type="date"
              value={formData.ritualDate}
              onChange={(e) => setFormData({ ...formData, ritualDate: e.target.value })}
            />
            <Input
              onClick={(e) => e.stopPropagation()}
              label="开始时间"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              onClick={(e) => e.stopPropagation()}
              label="结束时间"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="地点"
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
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  )
}