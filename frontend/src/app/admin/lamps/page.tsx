'use client'

import { useState, useEffect } from 'react'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

const lampTypeOptions = [
  { value: 'WISDOM_LAMP', label: '智慧灯' },
  { value: 'LONGEVITY_LAMP', label: '延寿灯' },
  { value: 'REPOSE_LAMP', label: '往生灯' },
  { value: 'WISH_LAMP', label: '许愿灯' },
]

interface Lamp {
  id: string
  name: string
  phone: string
  lampType: string
  duration: number
  startDate: string
  endDate: string
  amount: number
  status: string
  blessings?: string
  createdAt: string
}

export default function LampsPage() {
  const [lamps, setLamps] = useState<Lamp[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    lampType: 'WISDOM_LAMP',
    duration: 7,
    startDate: new Date().toISOString().split('T')[0],
    blessings: '',
  })

  useEffect(() => {
    loadLamps()
  }, [])

  const loadLamps = async () => {
    try {
      const data = await businessAPI.getLampOfferings()
      setLamps(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const endDate = new Date(formData.startDate)
      endDate.setDate(endDate.getDate() + formData.duration)
      await businessAPI.createLampOffering({
        ...formData,
        endDate: endDate.toISOString().split('T')[0],
        amount: formData.duration * 30,
        status: 'ACTIVE',
      })
      setModalOpen(false)
      resetForm()
      loadLamps()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      lampType: 'WISDOM_LAMP',
      duration: 7,
      startDate: new Date().toISOString().split('T')[0],
      blessings: '',
    })
  }

  const totalAmount = lamps.reduce((sum, l) => sum + (l.amount || 0), 0)

  const columns = [
    { key: 'name', title: '祈福人' },
    { key: 'phone', title: '电话' },
    { key: 'lampType', title: '灯类型', render: (row: Lamp) => (
      <Badge variant="info">{lampTypeOptions.find(t => t.value === row.lampType)?.label || row.lampType}</Badge>
    )},
    { key: 'duration', title: '天数' },
    { key: 'startDate', title: '开始日期', render: (row: Lamp) => row.startDate ? new Date(row.startDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'endDate', title: '结束日期', render: (row: Lamp) => row.endDate ? new Date(row.endDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'amount', title: '金额', render: (row: Lamp) => `¥${row.amount}` },
    { key: 'status', title: '状态', render: (row: Lamp) => (
      <Badge variant={row.status === 'ACTIVE' ? 'success' : 'gray'}>
        {row.status === 'ACTIVE' ? '燃亮中' : '已熄灭'}
      </Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">供灯祈福</h2>
          <p className="text-sm text-tea/60 mt-1">管理供灯预约和记录</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-vermilion">¥{totalAmount}</div>
            <div className="text-xs text-tea/60">累计金额</div>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            新增供灯
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={lamps}
          loading={loading}
          emptyText="暂无供灯记录"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增供灯"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="祈福人姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="联系电话"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="灯类型"
            value={formData.lampType}
            onChange={(e) => setFormData({ ...formData, lampType: e.target.value })}
            options={lampTypeOptions}
          />
          <Select
            label="供奉天数"
            value={String(formData.duration)}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            options={[
              { value: '7', label: '7天' },
              { value: '15', label: '15天' },
              { value: '30', label: '30天' },
              { value: '99', label: '99天' },
              { value: '365', label: '365天' },
            ]}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="开始日期"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="祈福语"
            value={formData.blessings}
            onChange={(e) => setFormData({ ...formData, blessings: e.target.value })}
            placeholder="请输入祈福内容..."
          />
        </div>
        <div className="bg-paper rounded p-4 mt-4">
          <div className="text-sm text-tea">费用：{formData.duration} 天 × ¥30/天 = <span className="text-vermilion font-bold">¥{formData.duration * 30}</span></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit}>确认供奉</Button>
        </div>
      </Modal>
    </div>
  )
}