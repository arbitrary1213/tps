'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Empty } from '@/components/ui'
import type { UserRecord } from '@/types/api'

const roleOptions = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'OPERATOR', label: '操作员' },
  { value: 'VIEWER', label: '查看者' },
]

export default function UsersPage() {
  const { token, user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'OPERATOR',
  })
  const [newPassword, setNewPassword] = useState('')

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
    if (!formData.username?.trim()) { alert('请输入用户名'); return; }
    if (!formData.password?.trim()) { alert('请输入密码'); return; }
    try {
      await businessAPI.createUser(token!, formData)
      setModalOpen(false)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('创建失败:', error)
    }
  }

  const handleEditPassword = (user: UserRecord) => {
    setEditingUser(user)
    setNewPassword('')
    setPasswordModalOpen(true)
  }

  const handlePasswordSubmit = async () => {
    if (!newPassword?.trim()) { alert('请输入新密码'); return; }
    if (newPassword.length < 6) { alert('密码长度不能少于6位'); return; }
    try {
      await businessAPI.updateUserPassword(token!, editingUser!.id, newPassword)
      setPasswordModalOpen(false)
      setEditingUser(null)
      setNewPassword('')
      alert('密码修改成功')
    } catch (error) {
      console.error('修改失败:', error)
      alert('修改失败，请重试')
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
    { key: 'role', title: '角色', render: (row: UserRecord) => (
      <Badge variant={roleBadgeMap[row.role] || 'info'}>
        {roleOptions.find(r => r.value === row.role)?.label || row.role}
      </Badge>
    )},
    { key: 'createdAt', title: '创建时间', render: (row: UserRecord) => new Date(row.createdAt).toLocaleString('zh-CN') },
    { key: 'actions', title: '操作', render: (row: UserRecord) => (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleEditPassword(row)}
        >
          修改密码
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleDelete(row.id)}
          disabled={row.id === currentUser?.id}
        >
          删除
        </Button>
      </div>
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
            label="用户名*"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            label="密码*"
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

      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="修改密码"
      >
        <div className="space-y-4">
          <p className="text-sm text-tea">正在修改用户 <strong>{editingUser?.username}</strong> 的密码</p>
          <Input
            label="新密码*"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码（至少6位）"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>取消</Button>
          <Button onClick={handlePasswordSubmit}>确认修改</Button>
        </div>
      </Modal>
    </div>
  )
}
