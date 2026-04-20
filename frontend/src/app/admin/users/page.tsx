'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Empty } from '@/components/ui'

const roleOptions = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'OPERATOR', label: '操作员' },
  { value: 'VIEWER', label: '查看者' },
]

interface User {
  id: string
  username: string
  name?: string
  email?: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const { token, user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'OPERATOR',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await businessAPI.getUsers(token!)
      setUsers(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await businessAPI.createUser(token!, formData)
      setModalOpen(false)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('创建失败:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert('不能删除当前登录用户')
      return
    }
    if (!confirm('确定要删除吗？')) return
    try {
      await businessAPI.deleteUser(token!, id)
      loadUsers()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'OPERATOR',
    })
  }

  const roleBadgeMap: Record<string, 'danger' | 'warning' | 'info'> = {
    ADMIN: 'danger',
    OPERATOR: 'warning',
    VIEWER: 'info',
  }

  const columns = [
    { key: 'username', title: '用户名' },
    { key: 'name', title: '姓名' },
    { key: 'email', title: '邮箱' },
    { key: 'role', title: '角色', render: (row: User) => (
      <Badge variant={roleBadgeMap[row.role] || 'info'}>
        {roleOptions.find(r => r.value === row.role)?.label || row.role}
      </Badge>
    )},
    { key: 'createdAt', title: '创建时间', render: (row: User) => new Date(row.createdAt).toLocaleString('zh-CN') },
    { key: 'actions', title: '操作', render: (row: User) => (
      <Button
        size="sm"
        variant="danger"
        onClick={() => handleDelete(row.id)}
        disabled={row.id === currentUser?.id}
      >
        删除
      </Button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">用户管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理系统用户和权限</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          新建用户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={users}
          loading={loading}
          emptyText="暂无用户"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新建用户"
      >
        <div className="space-y-4">
          <Input
            label="用户名"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="邮箱"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Select
            label="角色"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={roleOptions}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit}>创建</Button>
        </div>
      </Modal>
    </div>
  )
}