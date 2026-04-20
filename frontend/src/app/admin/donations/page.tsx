'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

const donationTypeOptions = [
  { value: 'INCENSE', label: '香火钱' },
  { value: 'TEMPLE_BUILDING', label: '建庙功德' },
  { value: 'RITUAL', label: '法会功德' },
  { value: 'PLAQUE', label: '牌位供奉' },
  { value: 'OTHER', label: '其他' },
]

const paymentMethodOptions = [
  { value: 'CASH', label: '现金' },
  { value: 'WECHAT', label: '微信' },
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'BANK_TRANSFER', label: '银行转账' },
]

interface Donation {
  id: string
  devoteeId?: string
  devotee?: { name: string }
  donorName: string
  donorPhone: string
  type: string
  amount: number
  paymentMethod: string
  donationDate: string
  receiptNumber?: string
  operator?: string
  remarks?: string
  createdAt: string
}

export default function DonationsPage() {
  const { token } = useAuthStore()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    devoteeId: '',
    donorName: '',
    donorPhone: '',
    type: 'INCENSE',
    amount: '',
    paymentMethod: 'CASH',
    donationDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    remarks: '',
  })

  useEffect(() => {
    loadDonations()
  }, [])

  const loadDonations = async () => {
    try {
      const data = await businessAPI.getDonations(token!)
      setDonations(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await businessAPI.createDonation(token!, {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      })
      setModalOpen(false)
      resetForm()
      loadDonations()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      devoteeId: '',
      donorName: '',
      donorPhone: '',
      type: 'INCENSE',
      amount: '',
      paymentMethod: 'CASH',
      donationDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      remarks: '',
    })
  }

  const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0)

  const columns = [
    { key: 'receiptNumber', title: '收据编号' },
    { key: 'donorName', title: '捐款人' },
    { key: 'donorPhone', title: '电话' },
    { key: 'type', title: '类型', render: (row: Donation) => (
      <Badge variant="info">{donationTypeOptions.find(t => t.value === row.type)?.label || row.type}</Badge>
    )},
    { key: 'amount', title: '金额', render: (row: Donation) => (
      <span className="text-vermilion font-medium">¥{row.amount}</span>
    )},
    { key: 'paymentMethod', title: '支付方式', render: (row: Donation) => (
      paymentMethodOptions.find(p => p.value === row.paymentMethod)?.label || row.paymentMethod
    )},
    { key: 'donationDate', title: '日期', render: (row: Donation) => row.donationDate ? new Date(row.donationDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'operator', title: '经手人' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">功德管理</h2>
          <p className="text-sm text-tea/60 mt-1">记录和管理功德捐款</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-vermilion">¥{totalAmount.toLocaleString()}</div>
            <div className="text-xs text-tea/60">累计功德总额</div>
          </div>
          <Button onClick={() => { resetForm(); setModalOpen(true); }}>
            记录功德
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={donations}
          loading={loading}
          emptyText="暂无功德记录"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="记录功德"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="捐款人姓名"
            value={formData.donorName}
            onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
          />
          <Input
            label="捐款人电话"
            value={formData.donorPhone}
            onChange={(e) => setFormData({ ...formData, donorPhone: e.target.value })}
          />
          <Select
            label="功德类型"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={donationTypeOptions}
          />
          <Input
            label="金额"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
          />
          <Select
            label="支付方式"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            options={paymentMethodOptions}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="捐款日期"
            type="date"
            value={formData.donationDate}
            onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
          />
          <Input
            label="收据编号"
            value={formData.receiptNumber}
            onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="备注"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="其他说明..."
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