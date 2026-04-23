'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { registrationAPI } from '@/lib/api'
import { Button, Card, CardHeader, CardTitle, Table, Badge, Modal, Input, Select, Textarea, Checkbox } from '@/components/ui'

const taskTypeOptions = [
  { value: 'VOLUNTEER', label: '义工报名' },
  { value: 'PLAQUE', label: '牌位登记' },
  { value: 'RITUAL', label: '法会报名' },
  { value: 'LAMP', label: '供灯祈福' },
  { value: 'ACCOMMODATION', label: '住宿登记' },
  { value: 'DINING', label: '斋堂用餐' },
]

const defaultFormConfig = {
  VOLUNTEER: ['name', 'phone', 'skills'],
  PLAQUE: ['holderName', 'longevitySubtype', 'size', 'gender', 'birthDate', 'birthLunar', 'deceasedName', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'blessingText', 'startDate', 'dedicationType'],
  RITUAL: ['ritualId', 'name', 'phone'],
  LAMP: ['name', 'phone', 'lampType', 'location', 'blessingName', 'startDate', 'endDate'],
  ACCOMMODATION: ['name', 'phone', 'roomId', 'accommodationType', 'checkInDate', 'checkOutDate'],
  DINING: ['mealType', 'date', 'mealCount', 'contactName', 'contactPhone'],
}

interface Task {
  id: string
  name: string
  taskType: string
  description: string
  enabled: boolean
  formConfig: string[]
  createdAt: string
}

export default function TasksPage() {
  const { token } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    taskType: 'VOLUNTEER',
    description: '',
    enabled: true,
    formConfig: [] as string[],
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await registrationAPI.getTasksAll(token!)
      setTasks(data)
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingTask) {
        await registrationAPI.updateTask(token!, editingTask.id, formData)
      } else {
        await registrationAPI.createTask(token!, formData)
      }
      setModalOpen(false)
      setEditingTask(null)
      resetForm()
      loadTasks()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      name: task.name,
      taskType: task.taskType,
      description: task.description,
      enabled: task.enabled,
      formConfig: task.formConfig || [],
    })
    setModalOpen(true)
  }

  const handleToggle = async (task: Task) => {
    try {
      await registrationAPI.updateTask(token!, task.id, { ...task, enabled: !task.enabled })
      loadTasks()
    } catch (error) {
      console.error('切换状态失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await registrationAPI.deleteTask(token!, id)
      loadTasks()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      taskType: 'VOLUNTEER',
      description: '',
      enabled: true,
      formConfig: [],
    })
  }

  const handleTaskTypeChange = (type: string) => {
    setFormData({
      ...formData,
      taskType: type,
      formConfig: defaultFormConfig[type as keyof typeof defaultFormConfig] || [],
    })
  }

  const columns = [
    { key: 'name', title: '任务名称' },
    { key: 'taskType', title: '类型', render: (row: Task) => {
      if (row.taskType === 'PLAQUE') {
        return <Badge variant="info">牌位登记</Badge>
      }
      return <Badge variant="info">{taskTypeOptions.find(t => t.value === row.taskType)?.label || row.taskType}</Badge>
    }},
    { key: 'description', title: '描述' },
    { key: 'enabled', title: '状态', render: (row: Task) => (
      <Badge variant={row.enabled ? 'success' : 'gray'}>{row.enabled ? '已发布' : '未发布'}</Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Task) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>编辑</Button>
        <Button size="sm" variant="ghost" onClick={() => handleToggle(row)}>
          {row.enabled ? '下架' : '发布'}
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>删除</Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">登记发布</h2>
          <p className="text-sm text-tea/60 mt-1">管理在线登记表单，发布后用户可在落地页提交</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingTask(null); setModalOpen(true); }}>
          新建任务
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={tasks}
          loading={loading}
          emptyText="暂无登记任务"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        title={editingTask ? '编辑任务' : '新建任务'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="任务名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="如：义工报名"
          />
          <Select
            label="任务类型"
            value={formData.taskType}
            onChange={(e) => handleTaskTypeChange(e.target.value)}
            options={taskTypeOptions}
          />
          <Textarea
            label="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="任务说明..."
          />
          <Checkbox
            label="发布到落地页"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
          />
          <div className="pt-4 border-t border-[#E8E0D0]">
            <p className="text-sm text-tea mb-2">表单字段（已根据类型自动选择）</p>
            <div className="flex flex-wrap gap-2">
              {formData.formConfig.map((field) => (
                <Badge key={field} variant="info">{field}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingTask(null); }}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}