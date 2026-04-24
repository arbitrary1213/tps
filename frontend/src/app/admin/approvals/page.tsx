'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { registrationAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Tabs, Empty } from '@/components/ui'

const statusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: '待审批', variant: 'warning' },
  APPROVED: { label: '已通过', variant: 'success' },
  REJECTED: { label: '已拒绝', variant: 'danger' },
}

const taskTypeMap: Record<string, string> = {
  VOLUNTEER: '义工报名',
  LONGEVITY: '延生禄位',
  REBIRTH: '往生莲位',
  DELIVERANCE: '超度牌位',
  RITUAL: '法会报名',
  LAMP: '供灯祈福',
  ACCOMMODATION: '住宿登记',
  DINING: '斋堂用餐',
}

interface Request {
  id: string
  taskId: string
  taskType: string
  status: string
  submitterName: string
  submitterPhone: string
  formData: any
  rejectReason?: string
  approvedAt?: string
  createdAt: string
  task?: { name: string }
}

export default function ApprovalsPage() {
  const { token } = useAuthStore()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('PENDING')
  const [detailModal, setDetailModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadRequests()
  }, [activeTab])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const params = activeTab !== 'ALL' ? { status: activeTab } : {}
      const data = await registrationAPI.getRequests(token!, params)
      setRequests(data.list || data.data || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await registrationAPI.approveRequest(token!, id)
      setDetailModal(false)
      setSelectedRequest(null)
      loadRequests()
    } catch (error) {
      console.error('批准失败:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return
    try {
      await registrationAPI.rejectRequest(token!, selectedRequest.id, rejectReason)
      setDetailModal(false)
      setSelectedRequest(null)
      setRejectReason('')
      loadRequests()
    } catch (error) {
      console.error('拒绝失败:', error)
    }
  }

  const handleViewDetail = (request: Request) => {
    setSelectedRequest(request)
    setRejectReason('')
    setDetailModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条登记申请吗？删除后不可恢复。')) return
    try {
      await registrationAPI.deleteRequest(token!, id)
      loadRequests()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const tabs = [
    { id: 'PENDING', label: '待审批', count: requests.filter(r => r.status === 'PENDING').length },
    { id: 'APPROVED', label: '已通过' },
    { id: 'REJECTED', label: '已拒绝' },
    { id: 'ALL', label: '全部' },
  ]

  const columns = [
    { key: 'submitterName', title: '提交人' },
    { key: 'submitterPhone', title: '电话' },
    { key: 'taskType', title: '类型', render: (row: Request) => (
      <Badge variant="info">{taskTypeMap[row.taskType] || row.taskType}</Badge>
    )},
    { key: 'status', title: '状态', render: (row: Request) => {
      const s = statusMap[row.status]
      return <Badge variant={s.variant}>{s.label}</Badge>
    }},
    { key: 'createdAt', title: '提交时间', render: (row: Request) => new Date(row.createdAt).toLocaleString('zh-CN') },
    { key: 'actions', title: '操作', render: (row: Request) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleViewDetail(row)}>查看</Button>
        {row.status === 'PENDING' && (
          <>
            <Button size="sm" variant="secondary" onClick={() => handleApprove(row.id)}>通过</Button>
            <Button size="sm" variant="danger" onClick={() => { setSelectedRequest(row); setDetailModal(true); }}>拒绝</Button>
          </>
        )}
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>删除</Button>
      </div>
    )},
  ]

  const renderFormData = (data: any, taskType: string) => {
    if (!data) return null
    const entries = Object.entries(data).filter(([k]) => !k.startsWith('_'))
    return (
      <div className="grid grid-cols-2 gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-paper rounded p-3">
            <div className="text-xs text-tea/60">{key}</div>
            <div className="text-sm text-ink mt-1">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">登记审批</h2>
          <p className="text-sm text-tea/60 mt-1">审核用户提交的登记申请，通过后自动分发到对应业务模块</p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <Card>
        {activeTab === 'PENDING' && requests.filter(r => r.status === 'PENDING').length === 0 ? (
          <Empty title="暂无待审批" description="当前没有待审批的登记申请" />
        ) : (
          <Table
            columns={columns}
            data={requests}
            loading={loading}
            emptyText="暂无数据"
          />
        )}
      </Card>

      <Modal
        open={detailModal}
        onClose={() => { setDetailModal(false); setSelectedRequest(null); }}
        title="申请详情"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-tea/60">提交人</div>
                <div className="text-sm text-ink mt-1">{selectedRequest.submitterName}</div>
              </div>
              <div>
                <div className="text-xs text-tea/60">联系电话</div>
                <div className="text-sm text-ink mt-1">{selectedRequest.submitterPhone}</div>
              </div>
              <div>
                <div className="text-xs text-tea/60">登记类型</div>
                <div className="text-sm text-ink mt-1">{taskTypeMap[selectedRequest.taskType] || selectedRequest.taskType}</div>
              </div>
              <div>
                <div className="text-xs text-tea/60">状态</div>
                <div className="mt-1">
                  <Badge variant={statusMap[selectedRequest.status].variant}>
                    {statusMap[selectedRequest.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-xs text-tea/60">提交时间</div>
                <div className="text-sm text-ink mt-1">{new Date(selectedRequest.createdAt).toLocaleString('zh-CN')}</div>
              </div>
              {selectedRequest.approvedAt && (
                <div>
                  <div className="text-xs text-tea/60">审批时间</div>
                  <div className="text-sm text-ink mt-1">{new Date(selectedRequest.approvedAt).toLocaleString('zh-CN')}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-tea/60 mb-2">表单数据</div>
              {renderFormData(selectedRequest.formData, selectedRequest.taskType)}
            </div>

            {selectedRequest.rejectReason && (
              <div className="bg-vermilion-light/30 rounded p-3">
                <div className="text-xs text-vermilion/80">拒绝原因</div>
                <div className="text-sm text-vermilion-dark mt-1">{selectedRequest.rejectReason}</div>
              </div>
            )}

            {selectedRequest.status === 'PENDING' && (
              <div className="pt-4 border-t border-[#E8E0D0]">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-tea mb-2">拒绝原因（选填）</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="填写拒绝原因..."
                    className="w-full px-4 py-3 border border-[#E8E0D0] rounded focus:outline-none focus:border-vermilion"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="danger" onClick={handleReject}>拒绝</Button>
                  <Button onClick={() => handleApprove(selectedRequest.id)}>通过</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}