'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, SearchBar, Checkbox } from '@/components/ui'
import { systemAPI } from '@/lib/api'
import { PlaqueTemplate } from '@/types/template'
import type { DevoteeRecord, PlaqueRecord, RitualRecord } from '@/types/api'
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

type Plaque = PlaqueRecord & { customDedicationType?: string }
type Devotee = Pick<DevoteeRecord, 'id' | 'name' | 'phone'>
type Ritual = RitualRecord

export default function PlaquesPage() {
  const { token } = useAuthStore()
  const [plaques, setPlaques] = useState<Plaque[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSubtype, setFilterSubtype] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plaque | null>(null)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printTargetIds, setPrintTargetIds] = useState<string[]>([])
  const [printTargetType, setPrintTargetType] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
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
  const [batchAction, setBatchAction] = useState<'extend' | 'associate' | 'clear' | 'archive' | 'delete'>('extend')
  const [batchExtendDate, setBatchExtendDate] = useState('')
  const [batchRitualId, setBatchRitualId] = useState('')

  // 导入相关
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    plaqueType: 'LONGEVITY',
    longevitySubtype: '',
    size: '',
    holderName: '',
    deceasedName: '',
    gender: '',
    zodiac: '',
    age: '',
    birthDate: '',
    birthLunar: false,
    deathDate: '',
    deathLunar: true,
    yinGeng: '',
    deceasedName2: '',
    yinGeng2: '',
    birthDate2: '',
    birthLunar2: true,
    deathDate2: '',
    deathLunar2: true,
    yangShang: '',
    phone: '',
    address: '',
    dedicationType: '',
    customDedicationType: '',
    message: '',
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
    loadTemplates()
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
      if (filterSubtype) {
        if (filterType === 'LONGEVITY') params.longevitySubtype = filterSubtype
        else if (filterType === 'DELIVERANCE') params.dedicationType = filterSubtype
        else params.subtype = filterSubtype
      }
      if (filterStatus) params.status = filterStatus
      if (filterSize) params.size = filterSize
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

  const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
    const array = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([array], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

    // 延生禄位导入模板
  const downloadLongevityTemplate = () => {
    const templateData = [
      {
        '牌位类型': '延生禄位',
        '牌位主体': '牌位主体 (必填)',
        '阳上': '',
        '禄位类型': '',
        '规格': '',
        '性别': '',
        '出生日期': '',
        '农历': '是/否',
        '电话': '',
        '地址': '',
        '寄语': '',
        '祝福语': '',
      },
      {
        '牌位类型': '延生禄位',
        '牌位主体': '张三',
        '阳上': '张三',
        '禄位类型': '标准',
        '规格': '大',
        '性别': '男',
        '出生日期': '1978年正月初三',
        '农历': '是',
        '电话': '',
        '地址': '本市东街一号',
        '寄语': '',
        '祝福语': '消灾延寿 福慧增长',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '延生禄位导入模板')
    const colWidths = [
      { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 8 },
      { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
    ]
    ws['!cols'] = colWidths
    downloadWorkbook(wb, '延生禄位导入模板.xlsx')
  }

  // 往生莲位导入模板
  const downloadRebirthTemplate = () => {
    const templateData = [
      {
        '牌位类型': '往生莲位',
        '亡者姓名': '亡者姓名 (必填)',
        '阴庚': '',
        '亡者二': '',
        '亡者二阴庚': '',
        '规格': '',
        '性别': '',
        '出生日期': '',
        '亡者农历': '是/否',
        '忌日': '',
        '忌日农历': '是/否',
        '亡者二生日': '',
        '亡者二忌日': '',
        '阳上': '',
        '寄语': '',
        '祝福语': '',
        '电话': '',
        '地址': '',
        '开始日期': '',
        '结束日期': '',
      },
      {
        '牌位类型': '往生莲位',
        '亡者姓名': '王五莲位',
        '阴庚': '甲午年三月十二日建生',
        '亡者二': '王小五',
        '亡者二阴庚': '',
        '规格': '大',
        '性别': '男',
        '出生日期': '甲午年三月十二',
        '亡者农历': '否',
        '忌日': '八月初一',
        '忌日农历': '是',
        '亡者二生日': '',
        '亡者二忌日': '',
        '阳上': '王家眷属',
        '寄语': '蒙佛接引 早登极乐',
        '祝福语': '',
        '电话': '13800138002',
        '地址': '本市西街三号',
        '开始日期': '2024-01-01',
        '结束日期': '2025-01-01',
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '往生莲位导入模板')
    ws['!cols'] = [
      { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 16 },
      { wch: 8 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 14 },
      { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 14 },
    ]
    downloadWorkbook(wb, '往生莲位导入模板.xlsx')
  }

  // 超度牌位导入模板（3个Sheet对应3种版式）
  const downloadDeliveranceTemplate = () => {
    const baseCols = ['牌位类型', '牌位主体', '亡者', '亡者阴庚', '亡者生日', '亡者忌日', '亡者二', '亡者二阴庚', '亡者二生日', '亡者二忌日', '规格', '阳上', '寄语', '祝福语', '地址', '电话', '开始日期', '结束日期']

    const sheet1 = [
      baseCols.reduce((obj, k) => ({ ...obj, [k]: '' }), {}),
      {
        '牌位类型': '超度牌位',
        '牌位主体': '地基主',
        '亡者': '', '亡者阴庚': '', '亡者生日': '', '亡者忌日': '',
        '亡者二': '', '亡者二阴庚': '', '亡者二生日': '', '亡者二忌日': '',
        '阳上': '陈氏家人', '寄语': '', '地址': '本市东街一号', '电话': '',
        '开始日期': '2024-01-01', '结束日期': '2025-01-01',
      },
    ]

    const sheet2 = [
      baseCols.reduce((obj, k) => ({ ...obj, [k]: '' }), {}),
      {
        '牌位类型': '超度牌位',
        '牌位主体': '李四',
        '亡者': '李四', '亡者阴庚': '戊午年正月初三日建生', '亡者生日': '1978-01-15', '亡者忌日': '2020-03-15',
        '亡者二': '', '亡者二阴庚': '', '亡者二生日': '', '亡者二忌日': '',
        '阳上': '李四家人', '寄语': '蒙佛接引 莲品增上', '地址': '本市南街五号', '电话': '13800138003',
        '开始日期': '2024-01-01', '结束日期': '2025-01-01',
      },
    ]

    const sheet3 = [
      baseCols.reduce((obj, k) => ({ ...obj, [k]: '' }), {}),
      {
        '牌位类型': '超度牌位',
        '牌位主体': '赵六 李四',
        '亡者': '赵六', '亡者阴庚': '甲午年三月十二日建生', '亡者生日': '1954-04-15', '亡者忌日': '2010-08-20',
        '亡者二': '李四', '亡者二阴庚': '丙申年九月初九日建生', '亡者二生日': '1956-10-12', '亡者二忌日': '2015-12-03',
        '阳上': '赵李两家后人', '寄语': '早登极乐 莲品增上', '地址': '本市北街四号', '电话': '13900139004',
        '开始日期': '2024-01-01', '结束日期': '2025-01-01',
      },
    ]

    const colWidths = [
      { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
      { wch: 8 }, { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 30 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
    ]

    const wb = XLSX.utils.book_new()
    ;[
      [sheet1, '版式一（无亡者）'],
      [sheet2, '版式二（单亡者）'],
      [sheet3, '版式三（双亡者）'],
    ].forEach(([data, name]) => {
      const ws = XLSX.utils.json_to_sheet(data as any[])
      ws['!cols'] = colWidths
      XLSX.utils.book_append_sheet(wb, ws, name as string)
    })

    downloadWorkbook(wb, '超度牌位导入模板.xlsx')
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

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) {
      alert("请先选择要导出的牌位");
      return;
    }
    try {
      await businessAPI.exportPlaques(token!, Array.from(selectedIds));
    } catch (error: any) {
      alert(error.message || "导出失败");
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false)
    setImportResult(null)
  }

  useEffect(() => {
    loadPlaques()
  }, [filterType, filterSubtype, filterStatus, filterSize, filterDevotee, filterRitual])

  const filteredPlaques = plaques.filter(p => {
    const searchLower = search.toLowerCase()
    const matchesSearch = !searchLower || (
      p.code?.toLowerCase().includes(searchLower) ||
      p.holderName?.toLowerCase().includes(searchLower) ||
      p.deceasedName?.toLowerCase().includes(searchLower) ||
      p.yangShang?.toLowerCase().includes(searchLower)
    )
    const matchesType = !filterType || p.plaqueType === filterType
    const matchesSubtype = !filterSubtype ||
      (filterType === 'LONGEVITY' && p.longevitySubtype === filterSubtype) ||
      (filterType === 'DELIVERANCE' && (p.dedicationType === filterSubtype || p.customDedicationType === filterSubtype))
    const matchesStatus = !filterStatus || p.status === filterStatus
    const matchesSize = !filterSize || p.size === filterSize
    const matchesDevotee = !filterDevotee || p.devoteeId === filterDevotee
    const matchesRitual = !filterRitual || p.ritualId === filterRitual

    return matchesSearch && matchesType && matchesSubtype && matchesStatus && matchesSize && matchesDevotee && matchesRitual
  })

  const handleSubmit = async () => {
    // 验证必填字段
    if (formData.plaqueType === 'LONGEVITY' && !formData.holderName?.trim()) {
      alert('请输入禄位持有人姓名'); return;
    }
    if (formData.plaqueType === 'REBIRTH' && !formData.deceasedName?.trim()) {
      alert('请输入往生者姓名'); return;
    }
    if (formData.plaqueType === 'DELIVERANCE' && !formData.dedicationType) {
      alert('请选择超度类型'); return;
    }
    if (formData.plaqueType === 'DELIVERANCE' && formData.dedicationType === 'custom' && !formData.customDedicationType) {
      alert('请输入自定义超度类型')
      return
    }
    try {
      const submitData = { ...formData }
      if (submitData.message && !submitData.blessingText) {
        submitData.blessingText = submitData.message
      } else if (submitData.blessingText && !submitData.message) {
        submitData.message = submitData.blessingText
      }
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
      zodiac: plaque.zodiac || '',
      age: plaque.age || '',
      birthDate: plaque.birthDate || '',
      birthLunar: plaque.birthLunar || false,
      deathDate: plaque.deathDate || '',
      deathLunar: plaque.deathLunar ?? true,
      yinGeng: plaque.yinGeng || '',
      deceasedName2: plaque.deceasedName2 || '',
      yinGeng2: plaque.yinGeng2 || '',
      birthDate2: plaque.birthDate2 || '',
      birthLunar2: plaque.birthLunar2 ?? true,
      deathDate2: plaque.deathDate2 || '',
      deathLunar2: plaque.deathLunar2 ?? true,
      yangShang: plaque.yangShang || '',
      phone: plaque.phone || '',
      address: plaque.address || '',
      dedicationType: plaque.dedicationType || '',
      customDedicationType: plaque.customDedicationType || '',
      message: plaque.message || '',
      blessingText: plaque.blessingText || '',
      startDate: plaque.startDate ? plaque.startDate.split('T')[0] : '',
      endDate: plaque.endDate ? plaque.endDate.split('T')[0] : '',
      remarks: plaque.remarks || '',
      devoteeId: plaque.devoteeId || '',
      ritualId: plaque.ritualId || '',
      templateId: plaque.templateId || '',
    })
    setShowSecondDeceased(!!plaque.deceasedName2)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此牌位吗？')) return
    try {
      await businessAPI.deletePlaque(token!, id)
      loadPlaques()
    } catch (error) {
      console.error('删除失败:', error)
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

  const openPrintTool = (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    window.open(`/print-api/index.html${query}`, '_blank')
  }

  const handlePreview = (plaque: Plaque) => {
    openPrintTemplateModal([plaque.id], plaque.plaqueType, plaque.templateId || '')
  }

  const handlePrint = (plaque: Plaque) => {
    openPrintTemplateModal([plaque.id], plaque.plaqueType, plaque.templateId || '')
  }

  const openPrintTemplateModal = async (ids: string[], plaqueType?: string, preferredTemplateId?: string) => {
    if (!ids.length) {
      alert('请先选择要打印的牌位')
      return
    }
    if (!templates.length) await loadTemplates()
    setPrintTargetIds(ids)
    setPrintTargetType(plaqueType || filterType || '')
    setSelectedTemplateId(preferredTemplateId || '')
    setPrintModalOpen(true)
  }

  const handleLocalPrint = async (ids: string[], plaqueType?: string) => {
    openPrintTemplateModal(ids, plaqueType)
  }

  const confirmPrintWithTemplate = () => {
    if (!printTargetIds.length) return
    const params: Record<string, string> = {
      type: printTargetType || '',
      preview: '1',
      ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
    }
    if (printTargetIds.length === 1) params.plaqueId = printTargetIds[0]
    else params.plaqueIds = printTargetIds.join(',')
    setPrintModalOpen(false)
    openPrintTool({
      ...params,
    })
  }

  const openNewTemplateForPrint = () => {
    if (window.templeDesktop?.openTemplateDesigner) {
      window.templeDesktop.openTemplateDesigner()
    } else {
      openPrintTool(printTargetType ? { type: printTargetType } : undefined)
    }
  }

  const resetForm = () => {
    setFormData({
      plaqueType: 'LONGEVITY',
      longevitySubtype: '',
      size: '',
      holderName: '',
      deceasedName: '',
      gender: '',
      zodiac: '',
      age: '',
      birthDate: '',
      birthLunar: false,
      deathDate: '',
      deathLunar: true,
      yinGeng: '',
      deceasedName2: '',
      yinGeng2: '',
      birthDate2: '',
      birthLunar2: true,
      deathDate2: '',
      deathLunar2: true,
      yangShang: '',
      phone: '',
      address: '',
      dedicationType: '',
      customDedicationType: '',
      message: '',
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

  const getDedicationTypeOptions = () => {
    const currentType = formData.dedicationType === 'custom'
      ? formData.customDedicationType
      : formData.dedicationType
    const mergedTypes = currentType && !dedicationTypes.includes(currentType)
      ? [currentType, ...dedicationTypes]
      : dedicationTypes
    return [
      { value: '', label: '请选择' },
      ...mergedTypes.map(t => ({ value: t, label: t })),
      { value: 'custom', label: '+ 新增...' }
    ]
  }

  const subtypeFilterOptions = [
    { value: '', label: '\u5168\u90e8\u5b50\u7c7b\u578b' },
    ...(filterType === 'LONGEVITY' ? longevitySubtypeOptions : []),
    ...(filterType === 'DELIVERANCE' ? dedicationTypes.map(t => ({ value: t, label: t })) : []),
  ]
  
  const ritualOptions = [
    { value: '', label: '请选择' },
    ...rituals.map(r => ({ value: r.id, label: r.name }))
  ]
  
  const templateOptions = [
    { value: '', label: '请选择' },
    ...templates.map(t => ({ value: t.id, label: t.name }))
  ]

  const printableTemplates = templates.filter((template: any) => {
    if (!printTargetType) return true
    const templateType = template.type || template.elements?.template?.dataGroup
    if (templateType === 'ALL') return true
    if (templateType === printTargetType) return true
    if (printTargetType === 'LONGEVITY' && templateType === 'blessing') return true
    if ((printTargetType === 'REBIRTH' || printTargetType === 'DELIVERANCE') && templateType === 'deliverance') return true
    return false
  })

  const templatePreview = (template: any) => {
    const payload = template.elements && !Array.isArray(template.elements) ? template.elements : null
    const paper = payload?.layout?.paper || {}
    const background = paper.background || payload?.layout?.background || template.backgroundImage || payload?.defaults?.background || ''
    const paperWidth = Number(paper.width || payload?.template?.width || template.paperWidth || 90)
    const paperHeight = Number(paper.height || payload?.template?.height || template.paperHeight || 260)
    const type = template.type || payload?.template?.dataGroup || 'ALL'
    return {
      background,
      ratio: `${Math.max(paperWidth, 1)} / ${Math.max(paperHeight, 1)}`,
      typeLabel: type === 'LONGEVITY' || type === 'blessing'
        ? '延生禄位'
        : type === 'REBIRTH'
          ? '往生莲位'
          : type === 'DELIVERANCE' || type === 'deliverance'
            ? '超度牌位'
            : '通用模板',
      sizeLabel: `${paperWidth} × ${paperHeight} mm`,
    }
  }

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
    { key: 'code', title: '编码', render: (row: Plaque) => (
      <span className="text-xs font-mono text-tea/70">{row.code || '-'}</span>
    )},
    { key: 'plaqueType', title: '类型', render: (row: Plaque) => (
      <Badge variant="info">{plaqueTypeOptions.find(t => t.value === row.plaqueType)?.label || row.plaqueType}</Badge>
    )},
    { key: 'subtype', title: '牌位主体', render: (row: Plaque) => {
      if (row.plaqueType === 'LONGEVITY') return row.holderName || '-'
      if (row.plaqueType === 'DELIVERANCE') return row.dedicationType === 'custom' ? (row.customDedicationType || '-') : (row.dedicationType || '-')
      if (row.plaqueType === 'REBIRTH') return row.deceasedName ? `${row.deceasedName}往生莲位` : '-'
      return '-'
    } },
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
        <Button size="sm" variant="ghost" onClick={() => handlePreview(row)} className="active:scale-[0.98] transition-all duration-200">预览</Button>
        <Button size="sm" variant="ghost" onClick={() => handlePrint(row)} className="active:scale-[0.98] transition-all duration-200">打印</Button>
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)} className="active:scale-[0.98] transition-all duration-200">编辑</Button>
        <Button size="sm" variant="secondary" onClick={() => handleExtend(row)} className="active:scale-[0.98] transition-all duration-200">延期</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} className="active:scale-[0.98] transition-all duration-200">删除</Button>
      </div>
    )},
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">牌位管理</h2>
          <p className="text-sm text-tea/60 mt-1">管理延生禄位、往生莲位和超度牌位</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportModalOpen(true)} className="active:scale-[0.98] transition-all duration-200">
            批量导入
          </Button>
          <Button variant="secondary" onClick={handleExportSelected} className="active:scale-[0.98] transition-all duration-200">
            批量导出
          </Button>
          <Button variant="secondary" onClick={() => openPrintTool(filterType ? { type: filterType } : undefined)} className="active:scale-[0.98] transition-all duration-200">
            打印工具
          </Button>
          <Button variant="secondary" onClick={() => handleLocalPrint(filteredPlaques.map((plaque) => plaque.id), filterType || undefined)} className="active:scale-[0.98] transition-all duration-200">
            打印当前列表
          </Button>
          <Button onClick={() => { resetForm(); setEditing(null); setModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">
            新建牌位
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4 overflow-x-auto whitespace-nowrap pb-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="搜索编码/姓名/阳上..."
            className="w-56 min-w-56 shrink-0"
          />
          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setFilterSubtype('')
            }}
            options={[{ value: '', label: '\u5168\u90e8\u7c7b\u578b' }, ...plaqueTypeOptions]}
            containerClassName="!w-[132px] shrink-0"
            className="h-10 px-3 pr-9 text-sm"
          />
          {(filterType === 'LONGEVITY' || filterType === 'DELIVERANCE') && (
            <Select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              options={subtypeFilterOptions}
              containerClassName="!w-[150px] shrink-0"
              className="h-10 px-3 pr-9 text-sm"
            />
          )}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[{ value: '', label: '全部状态' }, ...statusOptions]}
            containerClassName="!w-[120px] shrink-0"
            className="h-10 px-3 pr-9 text-sm"
          />
          <Select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            options={[{ value: '', label: '全部规格' }, ...sizeOptions]}
            containerClassName="!w-[112px] shrink-0"
            className="h-10 px-3 pr-9 text-sm"
          />
          <Select
            value={filterDevotee}
            onChange={(e) => setFilterDevotee(e.target.value)}
            options={[{ value: '', label: '全部信众' }, ...devotees.map(d => ({ value: d.id, label: d.name }))]}
            containerClassName="!w-[140px] shrink-0"
            className="h-10 px-3 pr-9 text-sm"
          />
          <Select
            value={filterRitual}
            onChange={(e) => setFilterRitual(e.target.value)}
            options={[{ value: '', label: '全部法会' }, ...rituals.map(r => ({ value: r.id, label: r.name }))]}
            containerClassName="!w-[140px] shrink-0"
            className="h-10 px-3 pr-9 text-sm"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-amber-50 rounded">
            <span className="text-sm text-amber-800">已选择 {selectedIds.size} 项</span>
            <Button size="sm" variant="secondary" onClick={() => { setBatchAction('associate'); setBatchRitualId(''); setBatchModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">关联法会</Button>
            <Button size="sm" variant="secondary" onClick={() => { setBatchAction('clear'); setBatchModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">清空法会</Button>
            <Button size="sm" variant="secondary" onClick={() => { setBatchAction('archive'); setBatchExtendDate(''); setBatchModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">批量归档</Button>
            <Button size="sm" variant="secondary" onClick={() => { setBatchAction('extend'); setBatchExtendDate(''); setBatchModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">批量延期</Button>
            <Button size="sm" variant="secondary" onClick={() => handleLocalPrint(Array.from(selectedIds), filterType || undefined)} className="active:scale-[0.98] transition-all duration-200">打印选中</Button>
            <Button size="sm" variant="danger" onClick={() => { setBatchAction('delete'); setBatchModalOpen(true); }} className="active:scale-[0.98] transition-all duration-200">批量删除</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="active:scale-[0.98] transition-all duration-200">取消选择</Button>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border min-w-0"><Table
          columns={columns}
          data={filteredPlaques}
          loading={loading}
          emptyText="暂无牌位"
        />
        </div>
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
                label="牌位主体"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                required
              />
              <Input
                label="信人"
                value={formData.yangShang}
                onChange={(e) => setFormData({ ...formData, yangShang: e.target.value })}
                placeholder="请输入信人姓名"
              />
              <Select
                label="性别"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...genderOptions]}
              />
              <Input
                label="年龄"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="请输入年龄"
              />
              <Input
                label="属相"
                value={formData.zodiac}
                onChange={(e) => setFormData({ ...formData, zodiac: e.target.value })}
                placeholder="请输入属相"
              />
              <Input
                label="生日"
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

              <div className="md:col-span-2">
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入地址"
                />
              </div>
              <Input
                label="联系电话"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="祈福祝福语"
                value={formData.blessingText}
                onChange={(e) => setFormData({ ...formData, blessingText: e.target.value, message: e.target.value })}
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
              <Input
                label="阴庚（干支纪年）"
                value={formData.yinGeng}
                onChange={(e) => setFormData({ ...formData, yinGeng: e.target.value })}
                placeholder="如：戊午年正月初三日建生"
              />
              <Input
                label="信人"
                value={formData.yangShang}
                onChange={(e) => setFormData({ ...formData, yangShang: e.target.value })}
                placeholder="请输入信人姓名"
              />
              <Select
                label="性别"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...genderOptions]}
              />
              <Input
                label="年龄"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="请输入年龄"
              />
              <Input
                label="属相"
                value={formData.zodiac}
                onChange={(e) => setFormData({ ...formData, zodiac: e.target.value })}
                placeholder="请输入属相"
              />
              <Input
                label="生日"
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
            
            {/* 亡者二 - 可选择显示 */}
            {!showSecondDeceased ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowSecondDeceased(true)}
                  className="text-sm text-vermilion hover:text-vermilion-dark flex items-center gap-1"
                >
                  <span>+</span> 增加亡者二
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-[#E8E0D0]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-tea">亡者二</p>
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
                    label="亡者二姓名"
                    value={formData.deceasedName2}
                    onChange={(e) => setFormData({ ...formData, deceasedName2: e.target.value })}
                    placeholder="请输入亡者二姓名"
                  />
                  <Input
                    label="阴庚（干支纪年）"
                    value={formData.yinGeng2}
                    onChange={(e) => setFormData({ ...formData, yinGeng2: e.target.value })}
                    placeholder="如：甲子年五月初八日建生"
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
                label="寄语"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value, blessingText: e.target.value })}
                placeholder="请输入寄语"
              />

              <div className="md:col-span-2">
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入地址"
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
                label="牌位主体"
                value={formData.dedicationType}
                onChange={(e) => setFormData({ ...formData, dedicationType: e.target.value })}
                options={getDedicationTypeOptions()}
              />
              {formData.dedicationType === 'custom' && (
                <Input
                  label="新增牌位主体"
                  value={formData.customDedicationType}
                  onChange={(e) => setFormData({ ...formData, customDedicationType: e.target.value })}
                  placeholder="请输入新的牌位主体名称"
                />
              )}
              <Select
                label="规格"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                options={[{ value: '', label: '请选择' }, ...sizeOptions]}
              />
              <Input
                label="亡者"
                value={formData.deceasedName}
                onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                placeholder="请输入亡者姓名"
              />
              <Input
                label="阴庚"
                value={formData.yinGeng}
                onChange={(e) => setFormData({ ...formData, yinGeng: e.target.value })}
                placeholder="如：戊午年正月初三日建生"
              />
              <Input
                label="生日"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                placeholder="如：1978-01-15"
              />
              <Input
                label="忌日"
                value={formData.deathDate}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                placeholder="如：2020-03-15"
              />
            </div>

            {/* 亡者二 - 可选择显示 */}
            {!showSecondDeceased ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowSecondDeceased(true)}
                  className="text-sm text-vermilion hover:text-vermilion-dark flex items-center gap-1"
                >
                  <span>+</span> 增加亡者二
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-[#E8E0D0]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-tea">亡者二</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecondDeceased(false)
                      setFormData({ ...formData, deceasedName2: '', yinGeng2: '', birthDate2: '', deathDate2: '' })
                    }}
                    className="text-sm text-tea/60 hover:text-vermilion"
                  >
                    移除
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="亡者二"
                    value={formData.deceasedName2}
                    onChange={(e) => setFormData({ ...formData, deceasedName2: e.target.value })}
                    placeholder="请输入亡者二姓名"
                  />
                  <Input
                    label="阴庚"
                    value={formData.yinGeng2}
                    onChange={(e) => setFormData({ ...formData, yinGeng2: e.target.value })}
                    placeholder="如：甲子年五月初八日建生"
                  />
                  <Input
                    label="生日"
                    value={formData.birthDate2}
                    onChange={(e) => setFormData({ ...formData, birthDate2: e.target.value })}
                    placeholder="如：1965-08-10"
                  />
                  <Input
                    label="忌日"
                    value={formData.deathDate2}
                    onChange={(e) => setFormData({ ...formData, deathDate2: e.target.value })}
                    placeholder="如：2021-05-20"
                  />
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
                label="寄语"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value, blessingText: e.target.value })}
                placeholder="请输入寄语"
              />
              <div className="md:col-span-2">
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入地址"
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
          <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }} className="active:scale-[0.98] transition-all duration-200">取消</Button>
          <Button onClick={handleSubmit} className="active:scale-[0.98] transition-all duration-200">保存</Button>
        </div>
      </Modal>

      {/* 打印模板选择弹窗 */}
      <Modal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="选择打印模板"
        size="half"
      >
        <div className="space-y-4">
          <div className="text-sm text-tea">
            已选择 {printTargetIds.length} 个牌位。
          </div>

          {printableTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {printableTemplates.map((template: any) => {
                const preview = templatePreview(template)
                return (
                  <label
                    key={template.id}
                    className={`block border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-vermilion bg-vermilion-light/20'
                        : 'border-[#E8E0D0] hover:border-vermilion'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className="w-20 h-28 shrink-0 rounded border border-[#E8E0D0] bg-paper overflow-hidden flex items-center justify-center"
                        style={{ aspectRatio: preview.ratio }}
                      >
                        {preview.background ? (
                          <img src={preview.background} alt={`${template.name}缩略图`} className="w-full h-full object-contain bg-white" />
                        ) : (
                          <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-2 px-2">
                            <div className="h-12 w-1.5 bg-vermilion/70 rounded" />
                            <div className="h-8 w-1 bg-tea/30 rounded" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="printTemplate"
                            checked={selectedTemplateId === template.id}
                            onChange={() => setSelectedTemplateId(template.id)}
                            className="mt-1"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-ink truncate">{template.name}</div>
                            <div className="text-xs text-tea/60 mt-1">{preview.typeLabel}</div>
                            <div className="text-xs text-tea/50 mt-1">{preview.sizeLabel}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              当前类型还没有可用模板，请先新增模板。
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="secondary" onClick={openNewTemplateForPrint}>
              新建模板
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPrintModalOpen(false)}>
                取消
              </Button>
              <Button onClick={confirmPrintWithTemplate} disabled={printableTemplates.length > 0 && !selectedTemplateId}>
                预览
              </Button>
            </div>
          </div>
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

      {/* 导入弹窗 */}
      <Modal open={importModalOpen} onClose={closeImportModal} title="批量导入牌位" size="md">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-2">导入说明</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>日期格式：YYYY-MM-DD，如 2024-01-15；农历列填"是"或"否"；规格填 大/中/小</li>
              <li><strong>延生禄位</strong>：必填"牌位主体"</li>
              <li><strong>往生莲位</strong>：必填"亡者姓名"；可选填"阴庚"、"亡者二"等</li>
              <li><strong>超度牌位</strong>（3种版式自动切换）：</li>
              <li className="ml-4">版式一 — 只填"牌位主体"、"阳上"、"地址"，无需亡者信息</li>
              <li className="ml-4">版式二 — 加填"亡者"（阴庚/生日/忌日选填）</li>
              <li className="ml-4">版式三 — 再加填"亡者二"（对应阴庚/生日/忌日选填）</li>
            </ul>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={downloadLongevityTemplate} className="active:scale-[0.98] transition-all duration-200">
              下载延生禄位模板
            </Button>
            <Button variant="secondary" onClick={downloadRebirthTemplate} className="active:scale-[0.98] transition-all duration-200">
              下载往生莲位模板
            </Button>
            <Button variant="secondary" onClick={downloadDeliveranceTemplate} className="active:scale-[0.98] transition-all duration-200">
              下载超度牌位模板
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
            <Button
              className="flex-1 min-w-[160px]"
              loading={importing}
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? '导入中...' : '选择文件'}
            </Button>
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
            <Button variant="secondary" onClick={closeImportModal} className="active:scale-[0.98] transition-all duration-200">
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title={batchAction === 'associate' ? '批量关联法会' : batchAction === 'clear' ? '批量清空法会' : batchAction === 'archive' ? '批量归档' : batchAction === 'delete' ? '批量删除' : '批量延期'}
        size="sm"
      >
        <div className="space-y-4">
          {batchAction === 'associate' && (
            <div>
              <p className="text-sm text-tea mb-3">将 {selectedIds.size} 个牌位关联到以下法会：</p>
              <Select
                value={batchRitualId}
                onChange={(e) => setBatchRitualId(e.target.value)}
                options={ritualOptions}
              />
            </div>
          )}
          {batchAction === 'extend' && (
            <div>
              <p className="text-sm text-tea mb-3">为 {selectedIds.size} 个牌位设置新的结束日期：</p>
              <Input
                label="新的结束日期"
                type="date"
                value={batchExtendDate}
                onChange={(e) => setBatchExtendDate(e.target.value)}
              />
            </div>
          )}
          {batchAction === 'archive' && (
            <div>
              <p className="text-sm text-tea mb-3">归档后牌位状态会变为“已过期”，并保留原法会关联。可选填写归档日期；留空时会优先使用法会日期。</p>
              <Input
                label="归档日期（可选）"
                type="date"
                value={batchExtendDate}
                onChange={(e) => setBatchExtendDate(e.target.value)}
              />
            </div>
          )}
          {batchAction === 'clear' && (
            <div>
              <p className="text-sm text-tea mb-3">将清空 {selectedIds.size} 个牌位的法会关联，牌位本身不会删除。</p>
            </div>
          )}
          {batchAction === 'delete' && (
            <div>
              <p className="text-sm text-tea mb-3">确定删除 {selectedIds.size} 个牌位吗？此操作不可恢复。</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBatchModalOpen(false)} className="active:scale-[0.98] transition-all duration-200">取消</Button>
            <Button
              onClick={async () => {
                try {
                  await businessAPI.batchUpdatePlaques(token!, {
                    ids: Array.from(selectedIds),
                    action: batchAction,
                    ritualId: batchAction === 'associate' ? batchRitualId : undefined,
                    endDate: batchAction === 'extend' || batchAction === 'archive' ? (batchExtendDate || undefined) : undefined,
                  })
                  setBatchModalOpen(false)
                  setSelectedIds(new Set())
                  setBatchExtendDate('')
                  setBatchRitualId('')
                  loadPlaques()
                } catch (error) {
                  console.error('批量操作失败:', error)
                  alert('批量操作失败')
                }
              }}
              className="active:scale-[0.98] transition-all duration-200"
            >
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
