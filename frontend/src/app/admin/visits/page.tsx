'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

const visitorTypeOptions = [
  { value: 'DEVOTEE', label: '信众' },
  { value: 'FAMILY', label: '家属' },
  { value: 'GUEST', label: '访客' },
  { value: 'VOLUNTEER', label: '义工' },
  { value: 'OTHER', label: '其他' },
]

interface Visit {
  id: string
  visitorName: string
  visitorPhone: string
  visitorType: string
  visitDate: string
  visitPurpose?: string
  visitedPerson?: string
  checkInTime?: string
  checkOutTime?: string
  remarks?: string
  createdAt: string
}

export default function VisitsPage() {
  const { token } = useAuthStore()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorType: 'DEVOTEE',
    visitDate: new Date().toISOString(),
    visitPurpose: '',
    visitedPerson: '',
    remarks: '',
  })

  useEffect(() => {
    loadVisits()
  }, [])

  const loadVisits = async () => {
    try {
      const params: any = {}
      if (filterType) params.visitorType = filterType
      const data = await businessAPI.getVisits(token!, params)
      setVisits(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisits()
  }, [filterType])

  const handleSubmit = async () => {
    try {
      await businessAPI.createVisit(token!, formData)
      setModalOpen(false)
      resetForm()
      loadVisits()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      visitorName: '',
      visitorPhone: '',
      visitorType: 'DEVOTEE',
      visitDate: new Date().toISOString(),
      visitPurpose: '',
      visitedPerson: '',
      remarks: '',
    })
  }

  const todayVisits = visits.filter(v => v.visitDate === new Date().toISOString().split('T')[0])
  const totalVisits = visits.length

  const columns = [
    { key: 'visitorName', title: '来访人' },
    { key: 'visitorPhone', title: '电话' },
    { key: 'visitorType', title: '类型', render: (row: Visit) => (
      <Badge variant="info">{visitorTypeOptions.find(v => v.value === row.visitorType)?.label || row.visitorType}</Badge>
    )},
    { key: 'visitDate', title: '来访日期', render: (row: Visit) => row.visitDate ? new Date(row.visitDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'visitPurpose', title: '来访目的' },
    { key: 'visitedPerson', title: '受访者' },
    { key: 'checkInTime', title: '签到', render: (row: Visit) => row.checkInTime ? (
      <Badge variant="success">已签到</Badge>
    ) : (
      <Badge variant="gray">未签到</Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">来访管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理来访登记和统计</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-vermilion">{todayVisits.length}</div>
            <div className="text-xs text-tea/60">今日来访</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-ink">{totalVisits}</div>
            <div className="text-xs text-tea/60">总来访量</div>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            来访登记
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[{ value: '', label: '全部类型' }, ...visitorTypeOptions]}
          className="w-48"
        />
      </div>

      <Card>
        <Table
          columns={columns}
          data={visits}
          loading={loading}
          emptyText="暂无来访记录"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="来访登记"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="来访人姓名"
            value={formData.visitorName}
            onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
          />
          <Input
            label="联系电话"
            value={formData.visitorPhone}
            onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
          />
          <Select
            label="来访类型"
            value={formData.visitorType}
            onChange={(e) => setFormData({ ...formData, visitorType: e.target.value })}
            options={visitorTypeOptions}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="来访日期"
            type="date"
            value={formData.visitDate.split('T')[0]}
            onChange={(e) => setFormData({ ...formData, visitDate: e.target.value + 'T00:00:00.000Z' })}
          />
          <Input
            label="受访者"
            value={formData.visitedPerson}
            onChange={(e) => setFormData({ ...formData, visitedPerson: e.target.value })}
          />
          <Input
            label="来访目的"
            value={formData.visitPurpose}
            onChange={(e) => setFormData({ ...formData, visitPurpose: e.target.value })}
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
          <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  )
}