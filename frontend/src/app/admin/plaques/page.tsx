'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, SearchBar, Checkbox } from '@/components/ui'
import { systemAPI } from '@/lib/api'
import { PlaquePrintPreview } from '@/components/PlaquePrintPreview'
import { PlaqueTemplate } from '@/types/template'
import * as XLSX from 'xlsx'

// 牌位大类型
const plaqueTypeOptions = [
  { value: 'LONGEVITY', label: '延生禄位' },
  { value: 'REBIRTH', label: '往生莲位' },
  { value: 'DELIVERANCE', label: '超度牌位' },
]

// 延生禄位子类型
const longevitySubtypeOptions = [
  { value: '祈福禄位', label: '祈福禄位' },
  { value: '化太岁禄位', label: '化太岁禄位' },
  { value: '财神禄位', label: '财神禄位' },
  { value: '文殊禄位', label: '文殊禄位' },
]

// 禄位规格
const sizeOptions = [
  { value: '大', label: '大' },
  { value: '中', label: '中' },
  { value: '小', label: '小' },
]

// 性别
const genderOptions = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
]

// 超度类型预设 - 现在从数据库动态加载
// const dedicationTypeOptions = [...]

// 状态
const statusOptions = [
  { value: 'ACTIVE', label: '有效' },
  { value: 'EXPIRED', label: '已过期' },
  { value: 'CANCELLED', label: '已作废' },
  { value: 'RENEWED', label: '已延期' },
]

interface Plaque {
  id: string
  plaqueType: string
  longevitySubtype?: string
  size?: string
  holderName?: string
  deceasedName?: string
  gender?: string
  birthDate?: string
  birthLunar: boolean
  deathDate?: string
  deathLunar: boolean
  deceasedName2?: string
  birthDate2?: string
  birthLunar2: boolean
  deathDate2?: string
  deathLunar2: boolean
  yangShang?: string
  phone?: string
  address?: string
  dedicationType?: string
  customDedicationType?: string
  blessingText?: string
  startDate: string
  endDate: string
  status: string
  remarks?: string
  templateId?: string
  createdAt: string
}

interface Devotee { id: string; name: string; phone?: string }
interface Ritual { id: string; name: string }

export default function PlaquesPage() {
  const { token } = useAuthStore()
  const [plaques, setPlaques] = useState<Plaque[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plaque | null>(null)
  const [showSecondDeceased, setShowSecondDeceased] = useState(false)
  const [devoteeSearchModalOpen, setDevoteeSearchModalOpen] = useState(false)
  const [devoteeSearchQuery, setDevoteeSearchQuery] = useState('')
  const [dedicationTypes, setDedicationTypes] = useState<string[]>([
    '冤亲债主', '堕胎婴灵', '历代宗亲', '无缘殊胜', '生日超度', '忌日超度', '新建地基主', '地基主'
  ])
  
  // 关联选项数据
  const [devotees, setDevotees] = useState<Devotee[]>([])
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [templates, setTemplates] = useState<PlaqueTemplate[]>([])

  // 多选相关
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterDevotee, setFilterDevotee] = useState('')
  const [filterRitual, setFilterRitual] = useState('')
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchAction, setBatchAction] = useState<'extend' | 'cancel' | 'delete'>('extend')
  const [batchExtendDate, setBatchExtendDate] = useState('')

  // 导入相关
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 预览状态
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewPlaque, setPreviewPlaque] = useState<Plaque | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PlaqueTemplate | null>(null)
  
  const [formData, setFormData] = useState({
    plaqueType: 'LONGEVITY',
    longevitySubtype: '',
    size: '',
    holderName: '',
    deceasedName: '',
    gender: '',
    birthDate: '',
    birthLunar: false,
    deathDate: '',
    deathLunar: true,
    deceasedName2: '',
    birthDate2: '',
    birthLunar2: true,
    deathDate2: '',
    deathLunar2: true,
    yangShang: '',
    phone: '',
    address: '',
    dedicationType: '',
    customDedicationType: '',
    blessingText: '',
    startDate: '',
    endDate: '',
    remarks: '',
    devoteeId: '',
    ritualId: '',
    templateId: '',
  })

  useEffect(() => {
    loadPlaques()
  }, [])

  // 加载关联数据
  useEffect(() => {
    if (modalOpen) {
      loadDevotees()
      loadRituals()
      loadTemplates()
      loadDedicationTypes()
    }
  }, [modalOpen])

  useEffect(() => {
    loadDevotees()
    loadRituals()
  }, [])

  const loadDedicationTypes = async () => {
    try {
      const data = await systemAPI.getSettings()
      if (data?.dedicationTypes) {
        setDedicationTypes(data.dedicationTypes.split(',').filter(Boolean))
      }
    } catch (error) {
      console.error('加载超度类型失败:', error)
    }
  }

  const loadPlaques = async () => {
    try {
      const params: any = {}
      if (filterType) params.plaqueType = filterType
      if (filterStatus) params.status = filterStatus
      if (filterDevotee) params.devoteeId = filterDevotee
      if (filterRitual) params.ritualId = filterRitual
      const data = await businessAPI.getPlaques(token!, params)
      setPlaques(data)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDevotees = async () => {
    try {
      const data = await businessAPI.getDevotees(token!)
      setDevotees(data)
    } catch (error) {
      console.error('加载信众失败:', error)
    }
  }

  const loadRituals = async () => {
    try {
      const data = await businessAPI.getRituals()
      setRituals(data)
    } catch (error) {
      console.error('加载法会失败:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const data = await businessAPI.getPlaqueTemplates(token!)
      setTemplates(data)
    } catch (error) {
      console.error('加载模板失败:', error)
    }
  }

  const downloadImportTemplate = () => {
    const templateData = [
      {
        '牌位类型': '延生禄位/往生莲位/超度牌位 (必填)',
        '姓名': '延生禄位必填',
        '亡者姓名': '往生莲位必填',
        '超度类型': '超度牌位必填',
        '规格': '大/中/小',
        '性别': '男/女',
        '出生日期': '',
        '农历': '是/否',
        '忌日': '',
        '忌日农历': '是/否',
        '第二亡者': '',
        '第二亡者生日': '',
        '第二亡者忌日': '',
        '阳上': '',
        '电话': '',
        '地址': '',
        '开始日期': 'YYYY-MM-DD',
        '结束日期': 'YYYY-MM-DD',
        '备注': '',
      },
      {
        '牌位类型': '延生禄位',
        '姓名': '王淑琴',
        '亡者姓名': '',
        '超度类型': '',
        '规格': '大',
        '性别': '女',
        '出生日期': '1982-06-05',
        '农历': '是',
        '忌日': '',
        '忌日农历': '否',
        '第二亡者': '',
        '第二亡者生日': '',
        '第二亡者忌日': '',
        '阳上': '王淑琴',
        '电话': '',
        '地址': '浙江省湖州市亿丰建材城1号楼301室',
        '开始日期': '',
        '结束日期': '',
        '备注': '',
      },
      {
        '牌位类型': '往生莲位',
        '姓名': '',
        '亡者姓名': '陈五喜',
        '超度类型': '',
        '规格': '',
        '性别': '',
        '出生日期': '',
        '农历': '否',
        '忌日': '',
        '忌日农历': '否',
        '第二亡者': '赵振华',
        '第二亡者生日': '',
        '第二亡者忌日': '',
        '阳上': '王淑琴',
        '电话': '',
        '地址': '浙江省湖州市亿丰建材城1号楼301室',
        '开始日期': '',
        '结束日期': '',
        '备注': '先外公',
      },
      {
        '牌位类型': '超度牌位',
        '姓名': '',
        '亡者姓名': '',
        '超度类型': '冤亲债主',
        '规格': '',
        '性别': '',
        '出生日期': '',
        '农历': '否',
        '忌日': '',
        '忌日农历': '否',
        '第二亡者': '',
        '第二亡者生日': '',
        '第二亡者忌日': '',
        '阳上': '马紫祥',
        '电话': '',
        '地址': '',
        '开始日期': '',
        '结束日期': '',
        '备注': '',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '牌位导入模板')

    const colWidths = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 8 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
      { wch: 15 }, { wch: 15 }, { wch: 20 },
    ]
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, '牌位导入模板.xlsx')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const result = await businessAPI.importPlaques(token!, file)
      setImportResult(result)
      if (result.success > 0) {
        loadPlaques()
      }
    } catch (error: any) {
      setImportResult({ success: 0, failed: 1, errors: [error.message || '导入失败'] })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const closeImportModal = () => {
    setImportModalOpen(false)
    setImportResult(null)
  }

  useEffect(() => {
    loadPlaques()
  }, [filterType, filterStatus, filterDevotee, filterRitual])

  const filteredPlaques = plaques.filter(p => {
    const searchLower = search.toLowerCase()
    return (
      p.holderName?.toLowerCase().includes(searchLower) ||
      p.deceasedName?.toLowerCase().includes(searchLower) ||
      p.yangShang?.toLowerCase().includes(searchLower)
    )
  })

  const handleSubmit = async () => {
    // 验证必填字段
    if (formData.plaqueType === 'LONGEVITY' && !formData.holderName) {
      alert('请输入姓名')
      return
    }
    if (formData.plaqueType === 'REBIRTH' && !formData.deceasedName) {
      alert('请输入亡者姓名')
      return
    }
    if (formData.plaqueType === 'DELIVERANCE' && !formData.dedicationType) {
      alert('请选择超度类型')
      return
    }
    if (formData.plaqueType === 'DELIVERANCE' && formData.dedicationType === 'custom' && !formData.customDedicationType) {
      alert('请输入自定义超度类型')
      return
    }
    try {
      const submitData = { ...formData }
      // 如果超度类型是"custom"，使用自定义字段的值，并保存到预设
      if (submitData.dedicationType === 'custom' && submitData.customDedicationType) {
        const newType = submitData.customDedicationType.trim()
        if (newType && !dedicationTypes.includes(newType)) {
          // 保存新的超度类型到系统设置
          try {
            const currentTypes = dedicationTypes.join(',')
            const newTypes = currentTypes ? `${currentTypes},${newType}` : newType
            await systemAPI.updateSettings(token!, { dedicationTypes: newTypes })
            setDedicationTypes([...dedicationTypes, newType])
          } catch (e) {
            console.error('保存超度类型失败:', e)
          }
        }
        submitData.dedicationType = newType
      }
      if (editing) {
        await businessAPI.updatePlaque(token!, editing.id, submitData)
      } else {
        await businessAPI.createPlaque(token!, submitData)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      loadPlaques()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (plaque: Plaque) => {
    setEditing(plaque)
    setFormData({
      plaqueType: plaque.plaqueType,
      longevitySubtype: plaque.longevitySubtype || '',
      size: plaque.size || '',
      holderName: plaque.holderName || '',
      deceasedName: plaque.deceasedName || '',
      gender: plaque.gender || '',
      birthDate: plaque.birthDate || '',
      birthLunar: plaque.birthLunar || false,
      deathDate: plaque.deathDate || '',
      deathLunar: plaque.deathLunar ?? true,
      deceasedName2: plaque.deceasedName2 || '',
      birthDate2: plaque.birthDate2 || '',
      birthLunar2: plaque.birthLunar2 ?? true,
      deathDate2: plaque.deathDate2 || '',
      deathLunar2: plaque.deathLunar2 ?? true,
      yangShang: plaque.yangShang || '',
      phone: plaque.phone || '',
      address: plaque.address || '',
      dedicationType: plaque.dedicationType || '',
      customDedicationType: plaque.customDedicationType || '',
      blessingText: plaque.blessingText || '',
      startDate: plaque.startDate ? plaque.startDate.split('T')[0] : '',
      endDate: plaque.endDate ? plaque.endDate.split('T')[0] : '',
      remarks: plaque.remarks || '',
      devoteeId: '',
      ritualId: '',
      templateId: plaque.templateId || '',
    })
    setShowSecondDeceased(!!plaque.deceasedName2)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要作废此牌位吗？')) return
    try {
      await businessAPI.deletePlaque(token!, id)
      loadPlaques()
    } catch (error) {
      console.error('作废失败:', error)
    }
  }

  const handleExtend = async (plaque: Plaque) => {
    const newEndDate = prompt('请输入新的结束日期（格式：YYYY-MM-DD）', plaque.endDate?.split('T')[0])
    if (!newEndDate) return
    try {
      await businessAPI.updatePlaque(token!, plaque.id, { endDate: newEndDate, status: 'ACTIVE' })
      loadPlaques()
    } catch (error) {
      console.error('延期失败:', error)
    }
  }

  const handlePreview = async (plaque: Plaque) => {
    await loadTemplates()
    const template = templates.find(t => t.id === plaque.templateId) || templates.find(t => t.type === plaque.plaqueType) || templates.find(t => t.type === 'ALL')
    setPreviewPlaque(plaque)
    setPreviewTemplate(template || null)
    setPreviewModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      plaqueType: 'LONGEVITY',
      longevitySubtype: '',
      size: '',
      holderName: '',
      deceasedName: '',
      gender: '',
      birthDate: '',
      birthLunar: false,
      deathDate: '',
      deathLunar: true,
      deceasedName2: '',
      birthDate2: '',
      birthLunar2: true,
      deathDate2: '',
      deathLunar2: true,
      yangShang: '',
      phone: '',
      address: '',
      dedicationType: '',
      customDedicationType: '',
      blessingText: '',
      startDate: '',
      endDate: '',
      remarks: '',
      devoteeId: '',
      ritualId: '',
      templateId: '',
    })
    setShowSecondDeceased(false)
  }

  const devoteeOptions = [
    { value: '', label: '请选择' },
    ...devotees.map(d => ({ value: d.id, label: `${d.name} ${d.phone || ''}` }))
  ]

  const getDevoteeName = (id: string) => {
    const d = devotees.find(d => d.id === id)
    return d ? `${d.name} ${d.phone || ''}` : ''
  }

  const getDedicationTypeOptions = () => [
    { value: '', label: '请选择' },
    ...dedicationTypes.map(t => ({ value: t, label: t })),
    { value: 'custom', label: '+ 新增...' }
  ]
  
  const ritualOptions = [
    { value: '', label: '请选择' },
    ...rituals.map(r => ({ value: r.id, label: r.name }))
  ]
  
  const templateOptions = [
    { value: '', label: '请选择' },
    ...templates.map(t => ({ value: t.id, label: t.name }))
  ]

  const columns = [
    {
      key: 'select',
      title: <input
        type="checkbox"
        checked={selectedIds.size === filteredPlaques.length && filteredPlaques.length > 0}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedIds(new Set(filteredPlaques.map(p => p.id)))
          } else {
            setSelectedIds(new Set())
          }
        }}
      />,
      render: (row: Plaque) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => {
            const newSet = new Set(selectedIds)
            if (e.target.checked) {
              newSet.add(row.id)
            } else {
              newSet.delete(row.id)
            }
            setSelectedIds(newSet)
          }}
        />
      ),
    },
    { key: 'plaqueType', title: '类型', render: (row: Plaque) => (
      <Badge variant="info">{plaqueTypeOptions.find(t => t.value === row.plaqueType)?.label || row.plaqueType}</Badge>
    )},
    { key: 'subtype', title: '子类型', render: (row: Plaque) => row.longevitySubtype || row.dedicationType || '-' },
    { key: 'name', title: '姓名', render: (row: Plaque) => row.holderName || row.deceasedName || '-' },
    { key: 'yangShang', title: '阳上', render: (row: Plaque) => row.yangShang || '-' },
    { key: 'size', title: '规格', render: (row: Plaque) => row.size || '-' },
    { key: 'dates', title: '有效期', render: (row: Plaque) => (
      <span className="text-sm whitespace-nowrap">
        {row.startDate ? new Date(row.startDate).toLocaleDateString('zh-CN') : '-'} ~ {row.endDate ? new Date(row.endDate).toLocaleDateString('zh-CN') : '-'}
      </span>
    )},
    { key: 'status', title: '状态', render: (row: Plaque) => (
      <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'EXPIRED' ? 'warning' : 'gray'}>
        {statusOptions.find(s => s.value === row.status)?.label || row.status}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (row: Plaque) => (
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="ghost" onClick={() => handlePreview(row)}>预览</Button>
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>编辑</Button>
        <Button size="sm" variant="secondary" onClick={() => handleExtend(row)}>延期</Button>
        {row.status !== 'CANCELLED' && (
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>作废</Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">牌位管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理延生禄位、往生莲位和超度牌位</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportModalOpen(true)}>
            批量导入
          </Button>
          <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }}>
            新建牌位
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="搜索姓名或阳上..."
            className="w-64"
          />
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[{ value: '', label: '全部类型' }, ...plaqueTypeOptions]}
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[{ value: '', label: '全部状态' }, ...statusOptions]}
          />
          <Select
            value={filterDevotee}
            onChange={(e) => setFilterDevotee(e.target.value)}
            options={[{ value: '', label: '全部信众' }, ...devotees.map(d => ({ value: d.id, label: d.name }))]}
          />
          <Select
            value={filterRitual}
            onChange={(e) => setFilterRitual(e.target.value)}
            options={[{ value: '', label: '全部法会' }, ...rituals.map(r => ({ value: r.id, label: r.name }))]}
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-amber-50 rounded">
            <span className="text-sm text-amber-800">已选择 {selectedIds.size} 项</span>
            <Button size="sm" variant="secondary" onClick={() => { setBatchAction('extend'); setBatchExtendDate(''); setBatchModalOpen(true); }}>批量延期</Button>
            <Button size="sm" variant="danger" onClick={() => { setBatchAction('cancel'); setBatchModalOpen(true); }}>批量作废</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
          </div>
        )}
        <Table
          columns={columns}
          data={filteredPlaques}
          loading={loading}
          emptyText="暂无牌位"
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? '编辑牌位' : '新建牌位'}
        size="lg"
      >
        {/* 牌位类型选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="牌位类型"
            value={formData.plaqueType}
            onChange={(e) => setFormData({ ...formData, plaqueType: e.target.value })}
            options={plaqueTypeOptions}
          />
        </div>

        {/* ========== 延生禄位 ========== */}
        {formData.plaqueType === 'LONGEVITY' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select
                label="禄位类型"
                value={formData.longevitySubtype}
                onChange={(e) => setFormData({ ...formData, longevitySubtype: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...longevitySubtypeOptions]}
              />
              <Select
                label="规格"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...sizeOptions]}
              />
              <Input
                label="姓名 *"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                required
              />
              <Select
                label="性别"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...genderOptions]}
              />
              <Input
                label="出生日期"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                placeholder={formData.birthLunar ? '如：一九九零年正月十五' : '如：1990-01-15'}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="birthLunar"
                  checked={formData.birthLunar}
                  onChange={(e) => setFormData({ ...formData, birthLunar: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="birthLunar" className="text-sm text-tea">农历</label>
              </div>
              <Input
                label="联系电话"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <Input
                label="祈福祝福语"
                value={formData.blessingText}
                onChange={(e) => setFormData({ ...formData, blessingText: e.target.value })}
                placeholder="如：心想事成 万事如意"
              />
              <div>
                <label className="block text-sm font-medium text-tea mb-2">关联信众</label>
                <button
                  type="button"
                  onClick={() => setDevoteeSearchModalOpen(true)}
                  className="w-full h-11 px-4 border border-[#E8E0D0] rounded bg-white text-left flex items-center justify-between hover:border-vermilion transition-colors"
                >
                  <span className={formData.devoteeId ? 'text-ink' : 'text-tea/50'}>
                    {formData.devoteeId ? getDevoteeName(formData.devoteeId) : '点击搜索信众...'}
                  </span>
                  {formData.devoteeId && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, devoteeId: '' }) }}
                      className="text-tea/50 hover:text-vermilion text-lg"
                    >
                      ×
                    </span>
                  )}
                </button>
              </div>
              <Select
                label="关联法会"
                value={formData.ritualId}
                onChange={(e) => setFormData({ ...formData, ritualId: e.target.value })}
                options={ritualOptions}
              />
              <Select
                label="关联牌位模板"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                options={templateOptions}
              />
            </div>
          </>
        )}

        {/* ========== 往生莲位 ========== */}
        {formData.plaqueType === 'REBIRTH' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select
                label="规格"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...sizeOptions]}
              />
              <Input
                label="亡者姓名 *"
                value={formData.deceasedName}
                onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                required
              />
              <Select
                label="性别"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...genderOptions]}
              />
              <Input
                label="出生日期"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                placeholder="如：1960-05-20"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="birthLunarRebirth"
                  checked={formData.birthLunar}
                  onChange={(e) => setFormData({ ...formData, birthLunar: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="birthLunarRebirth" className="text-sm text-tea">农历</label>
              </div>
              <Input
                label="忌日"
                value={formData.deathDate}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                placeholder={formData.deathLunar ? '如：二零二零年三月初三' : '如：2020-03-15'}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deathLunar"
                  checked={formData.deathLunar}
                  onChange={(e) => setFormData({ ...formData, deathLunar: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="deathLunar" className="text-sm text-tea">农历</label>
              </div>
            </div>
            
            {/* 第二亡者 - 可选择显示 */}
            {!showSecondDeceased ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowSecondDeceased(true)}
                  className="text-sm text-vermilion hover:text-vermilion-dark flex items-center gap-1"
                >
                  <span>+</span> 增加第二亡者
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-[#E8E0D0]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-tea">第二亡者</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecondDeceased(false)
                      setFormData({ ...formData, deceasedName2: '', birthDate2: '', birthLunar2: true, deathDate2: '', deathLunar2: true })
                    }}
                    className="text-sm text-tea/60 hover:text-vermilion"
                  >
                    移除
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="亡者姓名"
                    value={formData.deceasedName2}
                    onChange={(e) => setFormData({ ...formData, deceasedName2: e.target.value })}
                    placeholder="请输入第二亡者姓名"
                  />
                  <Input
                    label="出生日期"
                    value={formData.birthDate2}
                    onChange={(e) => setFormData({ ...formData, birthDate2: e.target.value })}
                    placeholder={formData.birthLunar2 ? '如：一九六五年八月十五' : '如：1965-08-10'}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="birthLunar2"
                      checked={formData.birthLunar2}
                      onChange={(e) => setFormData({ ...formData, birthLunar2: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="birthLunar2" className="text-sm text-tea">农历</label>
                  </div>
                  <Input
                    label="忌日"
                    value={formData.deathDate2}
                    onChange={(e) => setFormData({ ...formData, deathDate2: e.target.value })}
                    placeholder={formData.deathLunar2 ? '如：二零二一年五月廿十' : '如：2021-05-20'}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="deathLunar2"
                      checked={formData.deathLunar2}
                      onChange={(e) => setFormData({ ...formData, deathLunar2: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="deathLunar2" className="text-sm text-tea">农历</label>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="阳上（供奉人）"
                value={formData.yangShang}
                onChange={(e) => setFormData({ ...formData, yangShang: e.target.value })}
              />
              <Input
                label="联系电话"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-tea mb-2">关联信众</label>
                <button
                  type="button"
                  onClick={() => setDevoteeSearchModalOpen(true)}
                  className="w-full h-11 px-4 border border-[#E8E0D0] rounded bg-white text-left flex items-center justify-between hover:border-vermilion transition-colors"
                >
                  <span className={formData.devoteeId ? 'text-ink' : 'text-tea/50'}>
                    {formData.devoteeId ? getDevoteeName(formData.devoteeId) : '点击搜索信众...'}
                  </span>
                  {formData.devoteeId && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, devoteeId: '' }) }}
                      className="text-tea/50 hover:text-vermilion text-lg"
                    >
                      ×
                    </span>
                  )}
                </button>
              </div>
              <Select
                label="关联法会"
                value={formData.ritualId}
                onChange={(e) => setFormData({ ...formData, ritualId: e.target.value })}
                options={ritualOptions}
              />
              <Select
                label="关联牌位模板"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                options={templateOptions}
              />
            </div>
          </>
        )}

        {/* ========== 超度牌位 ========== */}
        {formData.plaqueType === 'DELIVERANCE' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select
                label="超度类型 *"
                value={formData.dedicationType}
                onChange={(e) => setFormData({ ...formData, dedicationType: e.target.value })}
                options={getDedicationTypeOptions()}
              />
              {formData.dedicationType === 'custom' && (
                <Input
                  label="新增超度类型"
                  value={formData.customDedicationType}
                  onChange={(e) => setFormData({ ...formData, customDedicationType: e.target.value })}
                  placeholder="请输入新的超度类型名称"
                />
              )}
              <Select
                label="规格"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...sizeOptions]}
              />
              <Input
                label="阳上（供奉人）"
                value={formData.yangShang}
                onChange={(e) => setFormData({ ...formData, yangShang: e.target.value })}
              />
              <Input
                label="联系电话"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <Select
                label="关联法会"
                value={formData.ritualId}
                onChange={(e) => setFormData({ ...formData, ritualId: e.target.value })}
                options={ritualOptions}
              />
              <div>
                <label className="block text-sm font-medium text-tea mb-2">关联信众</label>
                <button
                  type="button"
                  onClick={() => setDevoteeSearchModalOpen(true)}
                  className="w-full h-11 px-4 border border-[#E8E0D0] rounded bg-white text-left flex items-center justify-between hover:border-vermilion transition-colors"
                >
                  <span className={formData.devoteeId ? 'text-ink' : 'text-tea/50'}>
                    {formData.devoteeId ? getDevoteeName(formData.devoteeId) : '点击搜索信众...'}
                  </span>
                  {formData.devoteeId && (
                    <span
                      onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, devoteeId: '' }) }}
                      className="text-tea/50 hover:text-vermilion text-lg"
                    >
                      ×
                    </span>
                  )}
                </button>
              </div>
              <Select
                label="关联模板"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                options={templateOptions}
              />
            </div>
          </>
        )}

        {/* ========== 共同字段：日期 + 备注 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            onClick={(e) => e.stopPropagation()}
            label="开始日期"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            onClick={(e) => e.stopPropagation()}
            label="结束日期"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>

      {/* 信众搜索弹窗 */}
      <Modal
        open={devoteeSearchModalOpen}
        onClose={() => setDevoteeSearchModalOpen(false)}
        title="搜索信众"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="搜索信众"
            value={devoteeSearchQuery}
            onChange={(e) => setDevoteeSearchQuery(e.target.value)}
            placeholder="输入姓名或电话搜索..."
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {devotees
              .filter(d => 
                !devoteeSearchQuery || 
                d.name.toLowerCase().includes(devoteeSearchQuery.toLowerCase()) ||
                d.phone?.includes(devoteeSearchQuery)
              )
              .map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    setFormData({ ...formData, devoteeId: d.id })
                    setDevoteeSearchModalOpen(false)
                    setDevoteeSearchQuery('')
                  }}
                  className="p-3 border border-[#E8E0D0] rounded hover:border-vermilion cursor-pointer transition-colors"
                >
                  <div className="font-medium text-ink">{d.name}</div>
                  {d.phone && <div className="text-sm text-tea/60">{d.phone}</div>}
                </div>
              ))}
            {devotees.filter(d =>
              !devoteeSearchQuery ||
              d.name.toLowerCase().includes(devoteeSearchQuery.toLowerCase()) ||
              d.phone?.includes(devoteeSearchQuery)
            ).length === 0 && (
              <div className="text-center text-tea/50 py-4">未找到信众</div>
            )}
          </div>
        </div>
      </Modal>

      <PlaquePrintPreview
        plaque={previewPlaque!}
        template={previewTemplate}
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />

      {/* 导入弹窗 */}
      <Modal open={importModalOpen} onClose={closeImportModal} title="批量导入牌位" size="md">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-2">导入说明</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>牌位类型：延生禄位 / 往生莲位 / 超度牌位</li>
              <li>延生禄位必填"姓名"，往生莲位必填"亡者姓名"，超度牌位必填"超度类型"</li>
              <li>日期格式：YYYY-MM-DD，如 2024-01-15</li>
              <li>农历列填写"是"或"否"</li>
              <li>规格填写：大 / 中 / 小</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={downloadImportTemplate}>
              下载模板
            </Button>
            <label className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
              <Button className="w-full" loading={importing} disabled={importing}>
                {importing ? '导入中...' : '选择文件'}
              </Button>
            </label>
          </div>

          {importResult && (
            <div className={`rounded-lg p-4 ${importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-medium ${importResult.failed === 0 ? 'text-green-800' : 'text-red-800'}`}>
                导入完成
              </p>
              <p className={`text-sm ${importResult.failed === 0 ? 'text-green-700' : 'text-red-700'}`}>
                成功：{importResult.success} 条，失败：{importResult.failed} 条
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <p className="text-xs text-red-600">错误列表：</p>
                  <ul className="text-xs text-red-500 space-y-1 list-disc list-inside">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={closeImportModal}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal open={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="批量操作" size="sm">
        <div className="space-y-4">
          {batchAction === 'extend' && (
            <div>
              <p className="text-sm text-tea mb-3">将为 {selectedIds.size} 个牌位设置新的结束日期</p>
              <Input
                label="新的结束日期"
                type="date"
                value={batchExtendDate}
                onChange={(e) => setBatchExtendDate(e.target.value)}
              />
            </div>
          )}
          {batchAction === 'cancel' && (
            <div>
              <p className="text-sm text-tea mb-3">确定要作废选中的 {selectedIds.size} 个牌位吗？</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBatchModalOpen(false)}>取消</Button>
            <Button
              onClick={async () => {
                try {
                  for (const id of selectedIds) {
                    if (batchAction === 'extend') {
                      await businessAPI.updatePlaque(token!, id, { endDate: batchExtendDate, status: 'ACTIVE' })
                    } else if (batchAction === 'cancel') {
                      await businessAPI.updatePlaque(token!, id, { status: 'CANCELLED' })
                    }
                  }
                  setBatchModalOpen(false)
                  setSelectedIds(new Set())
                  loadPlaques()
                } catch (error) {
                  console.error('批量操作失败:', error)
                  alert('批量操作失败')
                }
              }}
            >
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
