'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

const mealTypeOptions = [
  { value: 'BREAKFAST', label: '早餐' },
  { value: 'LUNCH', label: '午餐' },
  { value: 'DINNER', label: '晚餐' },
]

interface Dining {
  id: string
  date: string
  mealType: string
  mealCount: number
  contactName: string
  contactPhone: string
  status: string
  operator?: string
  remarks?: string
  createdAt: string
}

export default function DiningPage() {
  const { token } = useAuthStore()
  const [records, setRecords] = useState<Dining[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    mealCount: 10,
    contactName: '',
    contactPhone: '',
    remarks: '',
  })

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const data = await businessAPI.getDining(token!)
      setRecords(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await businessAPI.createDining(token!, formData)
      setModalOpen(false)
      resetForm()
      loadRecords()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      mealType: 'LUNCH',
      mealCount: 10,
      contactName: '',
      contactPhone: '',
      remarks: '',
    })
  }

  const columns = [
    { key: 'date', title: '日期', render: (row: Dining) => row.date ? new Date(row.date).toLocaleDateString('zh-CN') : '-' },
    { key: 'mealType', title: '餐型', render: (row: Dining) => (
      <Badge variant="info">{mealTypeOptions.find(m => m.value === row.mealType)?.label || row.mealType}</Badge>
    )},
    { key: 'mealCount', title: '用餐人数' },
    { key: 'contactName', title: '联系人' },
    { key: 'contactPhone', title: '联系电话' },
    { key: 'status', title: '状态', render: (row: Dining) => (
      <Badge variant={row.status === 'CONFIRMED' ? 'success' : 'warning'}>
        {row.status === 'CONFIRMED' ? '已确认' : '待确认'}
      </Badge>
    )},
    { key: 'operator', title: '经手人' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">斋堂管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理用餐预定和记录</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          新增预定
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={records}
          loading={loading}
          emptyText="暂无用餐预定"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增用餐预定"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            onClick={(e) => e.stopPropagation()}
            label="日期"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <Select
            label="餐型"
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
            options={mealTypeOptions}
          />
          <Input
            label="用餐人数"
            type="number"
            value={formData.mealCount}
            onChange={(e) => setFormData({ ...formData, mealCount: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="联系人"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          />
          <Input
            label="联系电话"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="备注"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="特殊要求..."
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  )
}