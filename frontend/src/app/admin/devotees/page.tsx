'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, SearchBar, Empty } from '@/components/ui'

const tagOptions = ['常客', '义工', '捐赠者', 'VIP']

interface Devotee {
  id: string
  name: string
  phone: string
  wechat?: string
  email?: string
  idCard?: string
  birthday?: string
  zodiac?: string
  address?: string
  tags: string[]
  totalDonation: number
  firstVisitDate?: string
  lastVisitDate?: string
  remarks?: string
  createdAt: string
}

export default function DevoteesPage() {
  const { token } = useAuthStore()
  const [devotees, setDevotees] = useState<Devotee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Devotee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wechat: '',
    email: '',
    idCard: '',
    birthday: '',
    zodiac: '',
    address: '',
    tags: [] as string[],
    remarks: '',
  })

  useEffect(() => {
    loadDevotees()
  }, [])

  const loadDevotees = async () => {
    try {
      const data = await businessAPI.getDevotees(token!)
      setDevotees(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDevotees = devotees.filter(d =>
    d.name.includes(search) || d.phone.includes(search)
  )

  const handleSubmit = async () => {
    try {
      if (editing) {
        await businessAPI.updateDevotee(token!, editing.id, formData)
      } else {
        await businessAPI.createDevotee(token!, formData)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      loadDevotees()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (devotee: Devotee) => {
    setEditing(devotee)
    setFormData({
      name: devotee.name,
      phone: devotee.phone,
      wechat: devotee.wechat || '',
      email: devotee.email || '',
      idCard: devotee.idCard || '',
      birthday: devotee.birthday || '',
      zodiac: devotee.zodiac || '',
      address: devotee.address || '',
      tags: devotee.tags || [],

      remarks: devotee.remarks || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await businessAPI.deleteDevotee(token!, id)
      loadDevotees()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      wechat: '',
      email: '',
      idCard: '',
      birthday: '',
      zodiac: '',
      address: '',
      tags: [],

      remarks: '',
    })
  }


  const columns = [
    { key: 'name', title: '姓名' },
    { key: 'phone', title: '电话' },
    { key: 'wechat', title: '微信' },
    { key: 'tags', title: '标签', render: (row: Devotee) => (
      <div className="flex flex-wrap gap-1">
        {(row.tags || []).map(tag => (
          <Badge key={tag} variant="info">{tag}</Badge>
        ))}
      </div>
    )},
    { key: 'totalDonation', title: '累计功德', render: (row: Devotee) => `¥${row.totalDonation || 0}` },
    { key: 'lastVisitDate', title: '最近到访', render: (row: Devotee) => row.lastVisitDate ? new Date(row.lastVisitDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'actions', title: '操作', render: (row: Devotee) => (
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
          <h2 className="text-xl font-medium text-ink">信众管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理信众档案和标签</p>
        </div>
        <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }}>
          新建信众
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="搜索姓名或电话..."
          />
        </div>
        <Table
          columns={columns}
          data={filteredDevotees}
          loading={loading}
          emptyText="暂无信众档案"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑信众' : '新建信众'}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="电话"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="微信"
            value={formData.wechat}
            onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
          />
          <Input
            label="邮箱"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="身份证"
            value={formData.idCard}
            onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="生日"
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          />
          <Select
            label="生肖"
            value={formData.zodiac}
            onChange={(e) => setFormData({ ...formData, zodiac: e.target.value })}
            options={[{ value: '', label: '请选择' }, { value: '鼠', label: '鼠' }, { value: '牛', label: '牛' }, { value: '虎', label: '虎' }, { value: '兔', label: '兔' }, { value: '龙', label: '龙' }, { value: '蛇', label: '蛇' }, { value: '马', label: '马' }, { value: '羊', label: '羊' }, { value: '猴', label: '猴' }, { value: '鸡', label: '鸡' }, { value: '狗', label: '狗' }, { value: '猪', label: '猪' }]}
          />
        </div>
        <div className="mt-4">
          <Input
            label="地址"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-tea mb-2">标签</label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  formData.tags.includes(tag)
                    ? 'bg-vermilion text-white border-vermilion'
                    : 'bg-paper text-tea border-[#E8E0D0] hover:border-vermilion'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
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