'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, Empty } from '@/components/ui'

const categoryOptions = [
  { value: 'CANDLE', label: '香烛' },
  { value: 'INCENSE', label: '香' },
  { value: 'FLOWER', label: '鲜花' },
  { value: 'FRUIT', label: '水果' },
  { value: 'OTHER', label: '其他' },
]

interface Item {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  price: number
  supplier?: string
  remarks?: string
  createdAt: string
}

interface WarehouseIn {
  id: string
  itemId: string
  item?: Item
  quantity: number
  price: number
  supplier?: string
  operator?: string
  createdAt: string
}

interface WarehouseOut {
  id: string
  itemId: string
  item?: Item
  quantity: number
  purpose?: string
  operator?: string
  createdAt: string
}

export default function WarehousePage() {
  const { token } = useAuthStore()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items' | 'in' | 'out'>('items')
  const [inRecords, setInRecords] = useState<WarehouseIn[]>([])
  const [outRecords, setOutRecords] = useState<WarehouseOut[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'CANDLE',
    unit: '个',
    stock: 0,
    minStock: 10,
    price: 0,
    supplier: '',
    remarks: '',
  })

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const data = await businessAPI.getWarehouseItems(token!)
      setItems(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await businessAPI.createWarehouseItem(token!, formData)
      setModalOpen(false)
      resetForm()
      loadItems()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleStockIn = async (item: Item) => {
    const quantity = prompt('请输入入库数量:', '1')
    if (!quantity) return
    const price = prompt('请输入单价:', String(item.price))
    if (!price) return
    try {
      await businessAPI.warehouseIn(token!, {
        itemId: item.id,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        supplier: '',
      })
      loadItems()
    } catch (error) {
      console.error('入库失败:', error)
    }
  }

  const handleStockOut = async (item: Item) => {
    const quantity = prompt('请输入出库数量:', '1')
    if (!quantity) return
    try {
      await businessAPI.warehouseOut(token!, {
        itemId: item.id,
        quantity: parseInt(quantity),
        purpose: '',
      })
      loadItems()
    } catch (error) {
      console.error('出库失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'CANDLE',
      unit: '个',
      stock: 0,
      minStock: 10,
      price: 0,
      supplier: '',
      remarks: '',
    })
  }

  const columns = [
    { key: 'name', title: '物品名称' },
    { key: 'category', title: '分类', render: (row: Item) => (
      <Badge variant="info">{categoryOptions.find(c => c.value === row.category)?.label || row.category}</Badge>
    )},
    { key: 'stock', title: '库存', render: (row: Item) => (
      <span className={row.stock <= row.minStock ? 'text-vermilion font-bold' : 'text-tea'}>
        {row.stock} {row.unit}
      </span>
    )},
    { key: 'minStock', title: '最低库存' },
    { key: 'price', title: '单价', render: (row: Item) => `¥${row.price}` },
    { key: 'actions', title: '操作', render: (row: Item) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleStockIn(row)}>入库</Button>
        <Button size="sm" variant="ghost" onClick={() => handleStockOut(row)}>出库</Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">库房管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理库存、台账和出入库</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          新增物品
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={items}
          loading={loading}
          emptyText="暂无物品"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增物品"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="物品名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            label="分类"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categoryOptions}
          />
          <Input
            label="单位"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
          <Input
            label="初始库存"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="最低库存"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="单价"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="供应商"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            className="col-span-2"
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