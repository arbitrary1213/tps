'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select } from '@/components/ui'

interface Task {
  id: string
  name: string
  taskDate: string
  startTime: string
  endTime: string
  status: string
  currentCount: number
}

export default function VolunteerAttendancePage() {
  const { token } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [signInModal, setSignInModal] = useState(false)
  const [formData, setFormData] = useState({
    volunteerName: '',
    volunteerPhone: '',
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await businessAPI.getVolunteerTasks({ status: 'IN_PROGRESS' })
      setTasks(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!selectedTask) return
    try {
      await businessAPI.signIn({
        taskId: selectedTask.id,
        volunteerName: formData.volunteerName,
        volunteerPhone: formData.volunteerPhone,
      })
      setSignInModal(false)
      setFormData({ volunteerName: '', volunteerPhone: '' })
      loadTasks()
    } catch (error) {
      console.error('签到失败:', error)
    }
  }

  const handleSignOut = async (phone: string) => {
    if (!selectedTask) return
    try {
      await businessAPI.signOut({
        taskId: selectedTask.id,
        volunteerPhone: phone,
      })
      loadTasks()
    } catch (error) {
      console.error('签退失败:', error)
    }
  }

  const columns = [
    { key: 'name', title: '任务名称' },
    { key: 'taskDate', title: '日期', render: (row: Task) => row.taskDate ? new Date(row.taskDate).toLocaleDateString('zh-CN') : '-' },
    { key: 'time', title: '时间', render: (row: Task) => `${row.startTime} - ${row.endTime}` },
    { key: 'currentCount', title: '当前人数' },
    { key: 'actions', title: '操作', render: (row: Task) => (
      <Button size="sm" onClick={() => { setSelectedTask(row); setSignInModal(true); }}>
        签到
      </Button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-ink">义工考勤</h2>
        <p className="text-sm text-tea/60 mt-1">管理义工任务的签到和签退</p>
      </div>

      <Card>
        <Table
          columns={columns}
          data={tasks}
          loading={loading}
          emptyText="当前没有进行中的任务"
        />
      </Card>

      <Modal
        open={signInModal}
        onClose={() => { setSignInModal(false); setSelectedTask(null); }}
        title={`义工签到 - ${selectedTask?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="义工姓名"
            value={formData.volunteerName}
            onChange={(e) => setFormData({ ...formData, volunteerName: e.target.value })}
          />
          <Input
            label="义工电话"
            value={formData.volunteerPhone}
            onChange={(e) => setFormData({ ...formData, volunteerPhone: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => { setSignInModal(false); setSelectedTask(null); }}>取消</Button>
          <Button onClick={handleSignIn}>签到</Button>
        </div>
      </Modal>
    </div>
  )
}