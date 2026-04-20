'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

const statusOptions = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'OCCUPIED', label: '已入住' },
  { value: 'MAINTENANCE', label: '维护中' },
]

interface Room {
  id: string
  roomNumber: string
  type: string
  capacity: number
  status: string
  floor?: string
  facilities?: string
  remarks?: string
  createdAt: string
}

interface Accommodation {
  id: string
  roomId: string
  room?: Room
  guestName: string
  guestPhone: string
  checkInDate: string
  checkOutDate?: string
  status: string
  operator?: string
  createdAt: string
}

export default function RoomsPage() {
  const { token } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'rooms' | 'records'>('rooms')
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'SINGLE',
    capacity: 2,
    floor: '',
    facilities: '',
    remarks: '',
  })

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const data = await businessAPI.getRooms(token!)
      setRooms(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAccommodations = async () => {
    try {
      const data = await businessAPI.getAccommodations(token!)
      setAccommodations(data)
    } catch (error) {
      console.error('加载失败:', error)
    }
  }

  const handleTabChange = (newTab: 'rooms' | 'records') => {
    setTab(newTab)
    if (newTab === 'records') {
      loadAccommodations()
    }
  }

  const handleSubmit = async () => {
    try {
      await businessAPI.createRoom(token!, formData)
      setModalOpen(false)
      resetForm()
      loadRooms()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleCheckOut = async (id: string) => {
    try {
      await businessAPI.checkoutAccommodation(token!, id)
      loadAccommodations()
      loadRooms()
    } catch (error) {
      console.error('退房失败:', error)
    }
  }

  const handleCheckIn = async (room: Room) => {
    const name = prompt('请输入入住人姓名:')
    if (!name) return
    const phone = prompt('请输入联系电话:')
    if (!phone) return
    const days = prompt('请输入入住天数:', '1')
    if (!days) return
    try {
      const checkOutDate = new Date()
      checkOutDate.setDate(checkOutDate.getDate() + parseInt(days))
      await businessAPI.createAccommodation(token!, {
        roomId: room.id,
        guestName: name,
        guestPhone: phone,
        checkInDate: new Date().toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        status: 'CHECKED_IN',
      })
      loadRooms()
    } catch (error) {
      console.error('入住登记失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      type: 'SINGLE',
      capacity: 2,
      floor: '',
      facilities: '',
      remarks: '',
    })
  }

  const roomColumns = [
    { key: 'roomNumber', title: '房间号' },
    { key: 'type', title: '类型' },
    { key: 'capacity', title: '容量' },
    { key: 'floor', title: '楼层' },
    { key: 'status', title: '状态', render: (row: Room) => (
      <Badge variant={row.status === 'AVAILABLE' ? 'success' : row.status === 'OCCUPIED' ? 'warning' : 'gray'}>
        {statusOptions.find(s => s.value === row.status)?.label || row.status}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Room) => (
      <div className="flex gap-2">
        {row.status === 'AVAILABLE' && (
          <Button size="sm" onClick={() => handleCheckIn(row)}>入住</Button>
        )}
      </div>
    )},
  ]

  const recordColumns = [
    { key: 'guestName', title: '入住人' },
    { key: 'guestPhone', title: '电话' },
    { key: 'room', title: '房间号', render: (row: Accommodation) => row.room?.roomNumber || '-' },
    { key: 'checkInDate', title: '入住日期', render: (row: Accommodation) => row.checkInDate ? new Date(row.checkInDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'checkOutDate', title: '退房日期', render: (row: Accommodation) => row.checkOutDate ? row.checkOutDate ? new Date(row.checkOutDate).toLocaleDateString('zh-CN') : '-' : '-' },
    { key: 'status', title: '状态', render: (row: Accommodation) => (
      <Badge variant={row.status === 'CHECKED_IN' ? 'success' : 'gray'}>
        {row.status === 'CHECKED_IN' ? '已入住' : '已退房'}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Accommodation) => (
      row.status === 'CHECKED_IN' && (
        <Button size="sm" variant="secondary" onClick={() => handleCheckOut(row.id)}>退房</Button>
      )
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">住宿管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理房间和入住记录</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          新增房间
        </Button>
      </div>

      <div className="flex gap-4 border-b border-[#E8E0D0]">
        <button
          onClick={() => handleTabChange('rooms')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'rooms' ? 'border-vermilion text-vermilion' : 'border-transparent text-tea hover:text-ink'
          }`}
        >
          房间管理
        </button>
        <button
          onClick={() => handleTabChange('records')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'records' ? 'border-vermilion text-vermilion' : 'border-transparent text-tea hover:text-ink'
          }`}
        >
          入住记录
        </button>
      </div>

      <Card>
        <Table
          columns={tab === 'rooms' ? roomColumns : recordColumns}
          data={tab === 'rooms' ? rooms : accommodations}
          loading={loading}
          emptyText={tab === 'rooms' ? '暂无房间' : '暂无入住记录'}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增房间"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="房间号"
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
          />
          <Select
            label="房间类型"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'SINGLE', label: '单人间' },
              { value: 'DOUBLE', label: '双人间' },
              { value: 'SUITE', label: '套房' },
            ]}
          />
          <Input
            label="容量"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
          />
          <Input
            label="楼层"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="设施"
            value={formData.facilities}
            onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
            placeholder="如：空调、热水器、独立卫生间..."
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