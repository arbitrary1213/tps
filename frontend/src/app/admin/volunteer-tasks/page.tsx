'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, SearchBar, Empty } from '@/components/ui'

const taskTypeOptions = [
  { value: 'HALL_CLEANING', label: '殿堂清洁' },
  { value: 'RITUAL_ASSIST', label: '法会协助' },
  { value: 'RECEPTION', label: '接待引导' },
  { value: 'KITCHEN', label: '斋堂帮厨' },
  { value: 'DRIVER', label: '司机' },
  { value: 'OTHER', label: '其他' },
]

const statusOptions = [
  { value: 'RECRUITING', label: '招募中' },
  { value: 'FULL', label: '已满员' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
]

interface VolunteerTask {
  id: string
  name: string
  description?: string
  taskType: string
  location: string
  taskDate: string
  startTime: string
  endTime: string
  requiredCount: number
  currentCount: number
  status: string
  createdAt: string
  signups?: any[]
}

export default function VolunteerTasksPage() {
  const { token } = useAuthStore()
  const [tasks, setTasks] = useState<VolunteerTask[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<VolunteerTask | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    taskType: 'HALL_CLEANING',
    location: '',
    taskDate: '',
    startTime: '',
    endTime: '',
    requiredCount: 5,
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await businessAPI.getVolunteerTasks()
      setTasks(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editing) {
        await businessAPI.updateVolunteerTask(token!, editing.id, formData)
      } else {
        await businessAPI.createVolunteerTask(token!, formData)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      loadTasks()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (task: VolunteerTask) => {
    setEditing(task)
    setFormData({
      name: task.name,
      description: task.description || '',
      taskType: task.taskType,
      location: task.location,
      taskDate: task.taskDate.split('T')[0],
      startTime: task.startTime,
      endTime: task.endTime,
      requiredCount: task.requiredCount,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await businessAPI.deleteVolunteerTask(token!, id)
      loadTasks()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleStatusChange = async (task: VolunteerTask, newStatus: string) => {
    try {
      await businessAPI.updateVolunteerTask(token!, task.id, { ...task, status: newStatus })
      loadTasks()
    } catch (error) {
      console.error('状态更新失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      taskType: 'HALL_CLEANING',
      location: '',
      taskDate: '',
      startTime: '',
      endTime: '',
      requiredCount: 5,
    })
  }

  const statusBadgeMap: Record<string, 'warning' | 'info' | 'success' | 'gray'> = {
    RECRUITING: 'warning',
    FULL: 'info',
    IN_PROGRESS: 'success',
    COMPLETED: 'gray',
  }

  const statusLabelMap: Record<string, string> = {
    RECRUITING: '招募中',
    FULL: '已满员',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
  }

  const columns = [
    { key: 'name', title: '任务名称' },
    { key: 'taskType', title: '类型', render: (row: VolunteerTask) => (
      <Badge variant="info">{taskTypeOptions.find(t => t.value === row.taskType)?.label || row.taskType}</Badge>
    )},
    { key: 'location', title: '地点' },
    { key: 'taskDate', title: '日期', render: (row: VolunteerTask) => row.taskDate ? new Date(row.taskDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'time', title: '时间', render: (row: VolunteerTask) => `${row.startTime} - ${row.endTime}` },
    { key: 'count', title: '人数', render: (row: VolunteerTask) => (
      <span className={row.currentCount >= row.requiredCount ? 'text-bamboo' : 'text-tea'}>
        {row.currentCount} / {row.requiredCount}
      </span>
    )},
    { key: 'status', title: '状态', render: (row: VolunteerTask) => (
      <Badge variant={statusBadgeMap[row.status] || 'info'}>{statusLabelMap[row.status] || row.status}</Badge>
    )},
    { key: 'actions', title: '操作', render: (row: VolunteerTask) => (
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
          <h2 className="text-xl font-medium text-ink">义工任务</h2>
          <p className="text-sm text-tea/60 mt-1">创建和管理义工服务任务</p>
        </div>
        <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }}>
          新建任务
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={tasks}
          loading={loading}
          emptyText="暂无义工任务"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑任务' : '新建任务'}
      >
        <div className="space-y-4">
          <Input
            label="任务名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="如：大殿清洁"
          />
          <Select
            label="任务类型"
            value={formData.taskType}
            onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
            options={taskTypeOptions}
          />
          <Textarea
            label="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="任务详细描述..."
          />
          <Input
            label="服务地点"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              onClick={(e) => e.stopPropagation()}
              label="日期"
              type="date"
              value={formData.taskDate}
              onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
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
          <Input
            label="需求人数"
            type="number"
            value={formData.requiredCount}
            onChange={(e) => setFormData({ ...formData, requiredCount: parseInt(e.target.value) || 0 })}
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