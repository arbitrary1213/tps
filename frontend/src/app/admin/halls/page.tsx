'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea } from '@/components/ui'

interface Hall {
  id: string
  name: string
  description?: string
  location: string
  capacity: number
  status: string
  facilities?: string
  createdAt: string
}

const statusOptions = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'MAINTENANCE', label: '维护中' },
  { value: 'CLOSED', label: '关闭' },
]

export default function HallsPage() {
  const { token } = useAuthStore()
  const [halls, setHalls] = useState<Hall[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Hall | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: 50,
    status: 'AVAILABLE',
    facilities: '',
  })

  useEffect(() => {
    loadHalls()
  }, [])

  const loadHalls = async () => {
    try {
      const data = await businessAPI.getHalls()
      setHalls(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editing) {
        await businessAPI.updateHall(token!, editing.id, formData)
      } else {
        await businessAPI.createHall(token!, formData)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      loadHalls()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (hall: Hall) => {
    setEditing(hall)
    setFormData({
      name: hall.name,
      description: hall.description || '',
      location: hall.location,
      capacity: hall.capacity,
      status: hall.status,
      facilities: hall.facilities || '',
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      capacity: 50,
      status: 'AVAILABLE',
      facilities: '',
    })
  }

  const columns = [
    { key: 'name', title: '殿堂名称' },
    { key: 'location', title: '位置' },
    { key: 'capacity', title: '容量' },
    { key: 'status', title: '状态', render: (row: Hall) => (
      <Badge variant={row.status === 'AVAILABLE' ? 'success' : row.status === 'MAINTENANCE' ? 'warning' : 'gray'}>
        {statusOptions.find(s => s.value === row.status)?.label || row.status}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Hall) => (
      <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>编辑</Button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">殿堂管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理殿堂档案和预约</p>
        </div>
        <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }}>
          新增殿堂
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={halls}
          loading={loading}
          emptyText="暂无殿堂"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑殿堂' : '新增殿堂'}
      >
        <div className="space-y-4">
          <Input
            label="殿堂名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="位置"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <Input
            label="容量"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
          />
          <Select
            label="状态"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
          />
          <Textarea
            label="设施"
            value={formData.facilities}
            onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
            placeholder="如：佛像、香炉、蒲团..."
          />
          <Textarea
            label="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  )
}