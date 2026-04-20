'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, SearchBar } from '@/components/ui'

const positionOptions = [
  { value: '住持', label: '住持' },
  { value: '副住持', label: '副住持' },
  { value: '僧人', label: '僧人' },
  { value: '沙弥', label: '沙弥' },
]

const statusOptions = [
  { value: '在寺', label: '在寺' },
  { value: '离单', label: '离单' },
  { value: '还俗', label: '还俗' },
]

interface Monk {
  id: string
  name: string
  dharmaName?: string
  phone?: string
  position: string
  ordinationDate?: string
  birthDate?: string
  origin?: string
  avatar?: string
  status: string
  remarks?: string
  createdAt: string
}

export default function MonksPage() {
  const { token } = useAuthStore()
  const [monks, setMonks] = useState<Monk[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Monk | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    dharmaName: '',
    phone: '',
    position: '僧人',
    ordinationDate: '',
    birthDate: '',
    origin: '',
    status: '在寺',
    remarks: '',
  })

  useEffect(() => {
    loadMonks()
  }, [])

  const loadMonks = async () => {
    try {
      const data = await businessAPI.getMonks(token!)
      setMonks(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMonks = monks.filter(m =>
    (m.name || '').includes(search) || (m.dharmaName || '').includes(search)
  )

  const handleSubmit = async () => {
    try {
      // Build API data with only non-empty values
      const apiData: any = {}
      const add = (key: string, val: any) => {
        if (val === '' || val === undefined || val === null) return
        if (String(val) === 'undefined') return
        if (String(val) === 'null') return
        apiData[key] = val
      }
      add('dharmaName', formData.dharmaName)
      add('name', formData.name)
      add('phone', formData.phone)
      add('position', formData.position)
      add('birthDate', formData.birthDate)
      add('ordinationDate', formData.ordinationDate)
      add('origin', formData.origin)
      add('status', formData.status)
      add('remarks', formData.remarks)
      
      console.log('apiData:', JSON.stringify(apiData))
      if (editing) {
        await businessAPI.updateMonk(token!, editing.id, apiData)
      } else {
        await businessAPI.createMonk(token!, apiData)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      loadMonks()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (monk: Monk) => {
    setEditing(monk)
    setFormData({
      name: monk.name,
      dharmaName: monk.dharmaName || '',
      phone: monk.phone || '',
      position: monk.position,
      ordinationDate: monk.ordinationDate?.split('T')[0] || '',
      birthDate: monk.birthDate?.split('T')[0] || '',
      origin: monk.origin || '',
      status: monk.status,
      remarks: monk.remarks || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await businessAPI.deleteMonk(token!, id)
      loadMonks()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dharmaName: '',
      phone: '',
      position: '僧人',
      ordinationDate: '',
      birthDate: '',
      origin: '',
      status: '在寺',
      remarks: '',
    })
  }

  const columns = [
    { key: 'dharmaName', title: '法名' },
    { key: 'dharmaName', title: '字号' },
    { key: 'position', title: '职务', render: (row: Monk) => (
      <Badge variant="info">{positionOptions.find(p => p.value === row.position)?.label || row.position}</Badge>
    )},
    { key: 'phone', title: '电话' },
    { key: 'ordinationDate', title: '受戒日期', render: (row: Monk) => row.ordinationDate ? new Date(row.ordinationDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'status', title: '状态', render: (row: Monk) => (
      <Badge variant={row.status === 'ACTIVE' ? 'success' : 'gray'}>
        {statusOptions.find(s => s.value === row.status)?.label || row.status}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Monk) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>编辑</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>删除</Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">僧众管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理僧众档案、职务和考勤</p>
        </div>
        <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }}>
          新增僧众
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="搜索法名或字号..."
          />
        </div>
        <Table
          columns={columns}
          data={filteredMonks}
          loading={loading}
          emptyText="暂无僧众档案"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑僧众' : '新增僧众'}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="法名"
            value={formData.dharmaName}
            onChange={(e) => setFormData({ ...formData, dharmaName: e.target.value })}
          />
          <Input
            label="字号"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="职务"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            options={positionOptions}
          />
          <Input
            label="电话"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="出生日期"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="受戒日期"
            type="date"
            value={formData.ordinationDate}
            onChange={(e) => setFormData({ ...formData, ordinationDate: e.target.value })}
          />
          <Input
            label="籍贯"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
          />
          <Select
            label="状态"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="备注"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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