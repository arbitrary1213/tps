'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { registrationAPI, systemAPI } from '@/lib/api'

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

// ============================================================
// 字段定义配置（所有字段的元数据）
// ============================================================
type FieldType = 'text' | 'tel' | 'date' | 'select' | 'checkbox' | 'textarea'

interface FieldDef {
  type: FieldType
  label: string
  options?: { label: string; value: string }[]
  placeholder?: string
  hint?: string
  group?: string // 可选分组标识
}

const fieldDefs: Record<string, FieldDef> = {
  // --- 通用字段 ---
  name:            { type: 'text',  label: '姓名' },
  dharmaName:      { type: 'text',  label: '法名', hint: '（没有可留空）' },
  gender:          { type: 'select', label: '性别', options: [{ label:'男',value:'男' },{ label:'女',value:'女' }] },
  birthDate:       { type: 'date',  label: '出生年月' },
  phone:           { type: 'tel',   label: '联系电话' },
  address:         { type: 'textarea', label: '通讯地址' },
  emergencyContact:{ type: 'tel',  label: '紧急联络人电话', hint: '（供突发状况联系）' },

  // --- 义工相关 ---
  ethnicity:        { type: 'select', label: '民族', options: [{ label:'汉族',value:'汉族' },{ label:'藏族',value:'藏族' },{ label:'蒙古族',value:'蒙古族' },{ label:'回族',value:'回族' },{ label:'维吾尔族',value:'维吾尔族' },{ label:'其他',value:'其他' }] },
  education:       { type: 'select', label: '学历', options: [{ label:'小学',value:'小学' },{ label:'初中',value:'初中' },{ label:'高中/中专',value:'高中/中专' },{ label:'大专',value:'大专' },{ label:'本科',value:'本科' },{ label:'硕士',value:'硕士' },{ label:'博士',value:'博士' }] },
  currentOccupation:{ type: 'text', label: '从事职业' },
  healthStatus:    { type: 'select', label: '健康状况', options: [{ label:'健康',value:'健康' },{ label:'良好',value:'良好' },{ label:'一般',value:'一般' },{ label:'较差',value:'较差' }], hint: '（为了您和他人的健康，请您如实填写）' },
  hasInfectiousDisease:{ type:'select', label:'有无传染病史', options:[{ label:'有',value:'有' },{ label:'无',value:'无' }] },
  hasAllergy:      { type: 'select', label: '有无过敏史', options:[{ label:'有',value:'有' },{ label:'无',value:'无' }] },
  hasSpecialNeeds: { type: 'select', label: '有无特殊需求', options:[{ label:'有',value:'有' },{ label:'无',value:'无' }] },

  // --- 学佛经历 ---
  firstContactBuddhism: { type: 'text', label: '最初接触佛教的时间' },
  hasTakenRefuge:  { type: 'select', label: '是否皈依', options:[{ label:'是',value:'是' },{ label:'否',value:'否' }] },
  refugeTime:      { type: 'date', label: '皈依时间' },
  preceptsHeld:    { type: 'select', label: '受持戒法', options:[{ label:'五戒',value:'五戒' },{ label:'菩萨戒',value:'菩萨戒' },{ label:'未受戒',value:'未受戒' }] },
  willingToLearn:  { type: 'select', label: '是否愿意学佛', options:[{ label:'非常乐意',value:'非常乐意' },{ label:'可有可无',value:'可有可无' },{ label:'不接受',value:'不接受' }] },
  guidanceHope:    { type: 'textarea', label: '希望得到哪些方面的指导' },

  // --- 义工经历 ---
  hasVolunteerExperience:{ type:'select', label:'有无义工经历', options:[{ label:'是',value:'是' },{ label:'否',value:'否' }] },
  volunteerTimes:  { type: 'text', label: '义工次数' },
  lastVolunteerDate:{ type:'date', label:'最近义工日期' },
  lastVolunteerLocation:{ type:'text', label:'义工地点' },
  lastVolunteerContent:{ type:'textarea', label:'义工内容' },

  serviceStartDate:{ type:'date', label:'服务开始日期' },
  serviceEndDate: { type:'date', label:'服务结束日期' },
  serviceDuration:{ type:'text', label:'持续时间' },
  
  longevitySubtype: { type: 'select', label: '禄位类型', options:[
    { label:'普通禄位',value:'普通' },{ label:'祈福禄位',value:'祈福' },
    { label:'化太岁禄位',value:'化太岁' },{ label:'财神禄位',value:'财神' },
    { label:'文殊禄位',value:'文殊' },
  ]},
  size:            { type: 'select', label: '规格', options:[
    { label:'小',value:'小' },{ label:'中',value:'中' },{ label:'大',value:'大' },
  ]},
  birthLunar:      { type: 'checkbox', label: '农历', options:[{ label:'农历',value:'1' }] },
  blessingText:    { type: 'text', label: '祈福祝福语', placeholder:'如：心想事成 万事如意' },

  // --- 往生莲位 ---
  deceasedName:    { type: 'text', label: '亡者姓名' },
  deathDate:       { type: 'date', label: '忌日' },
  deathLunar:      { type: 'checkbox', label: '农历', options:[{ label:'农历',value:'1' }] },
  yangShang:       { type: 'text', label: '阳上人（建档人）' },

  // --- 超度牌位 ---
  dedicationType:   { type: 'select', label: '超度类型', options:[
    { label:'冤亲债主',value:'冤亲债主' },{ label:'堕胎婴灵',value:'堕胎婴灵' },
    { label:'历代宗亲',value:'历代宗亲' },{ label:'无缘殊胜',value:'无缘殊胜' },
    { label:'生日超度',value:'生日超度' },{ label:'忌日超度',value:'忌日超度' },
    { label:'新建地基主',value:'新建地基主' },{ label:'地基主',value:'地基主' },
    { label:'自定义',value:'custom' },
  ]},
  customDedicationType: { type: 'text', label: '新增超度类型', placeholder:'请输入新的超度类型名称' },
  deceasedName2: { type: 'text', label: '第二亡者姓名' },
  birthDate2: { type: 'date', label: '第二亡者出生日期' },
  birthLunar2: { type: 'checkbox', label: '农历', options:[{ label:'农历',value:'1' }] },
  deathDate2: { type: 'date', label: '第二亡者忌日' },
  deathLunar2: { type: 'checkbox', label: '农历', options:[{ label:'农历',value:'1' }] },

  // --- 供灯 ---
  lampType:        { type: 'select', label: '灯类型', options:[
    { label:'平安灯',value:'平安灯' },{ label:'智慧灯',value:'智慧灯' },
    { label:'光明灯',value:'光明灯' },{ label:'药师灯',value:'药师灯' },
    { label:'往生灯',value:'往生灯' },{ label:'其他',value:'其他' },
  ]},
  location:        { type: 'select', label: '位置', options:[
    { label:'一楼',value:'一楼' },{ label:'二楼',value:'二楼' },
    { label:'三楼',value:'三楼' },{ label:'其他',value:'其他' },
  ]},
  blessingName:    { type: 'text', label: '祈福人姓名' },

  // --- 法会 ---
  ritualId:        { type: 'select', label: '选择法会', options:[] }, // 动态加载
  volunteerTaskId: { type: 'select', label: '选择义工任务', options:[] }, // 动态加载

  // --- 住宿 ---
  checkInDate:     { type: 'date', label: '入住日期' },
  checkOutDate:    { type: 'date', label: '退房日期' },
  roomCount:       { type: 'text', label: '房间数量' },
  accommodationType: { type: 'select', label: '住宿类型', options:[
    { label:'挂单',value:'挂单' },{ label:'住宿',value:'住宿' },
    { label:'朝山',value:'朝山' },
  ]},

  // --- 用餐 ---
  mealType:        { type: 'select', label: '用餐类型', options:[
    { label:'早斋',value:'BREAKFAST' },{ label:'午斋',value:'LUNCH' },
    { label:'药石',value:'DINNER' },{ label:'法会素斋',value:'RITUAL' },
  ]},
  mealCount:       { type:'text', label:'用餐人数' },
  mealDate:       { type: 'date', label: '预约时间' },
  contactName:     { type: 'text', label: '联系人姓名' },
  contactPhone:    { type: 'tel', label: '联系人电话' },

  // --- 住宿房间 ---
  roomId:          { type: 'select', label: '选择房间', options:[] },
}

// ============================================================
// 字段分组配置（用于 VOLUNTEER 等复杂表单）
// ============================================================
interface FieldGroup {
  title: string
  fields: string[]
}

const VOLUNTEER_GROUPS: FieldGroup[] = [
  { title: '基本信息', fields: ['name', 'dharmaName', 'gender', 'birthDate', 'phone', 'emergencyContact', 'address'] },
  { title: '补充信息', fields: ['ethnicity', 'education', 'currentOccupation'] },
  { title: '健康状况', fields: ['healthStatus', 'hasInfectiousDisease', 'hasAllergy', 'hasSpecialNeeds'] },
  { title: '学佛经历', fields: ['firstContactBuddhism', 'hasTakenRefuge', 'refugeTime', 'preceptsHeld', 'willingToLearn', 'guidanceHope'] },
  { title: '义工经历', fields: ['hasVolunteerExperience', 'volunteerTimes', 'lastVolunteerDate', 'lastVolunteerLocation', 'lastVolunteerContent'] },
    { title: '服务时间', fields: ['serviceStartDate', 'serviceEndDate', 'serviceDuration'] },
  { title: '本人承诺', fields: ['signature'] },
]

// ============================================================
// API 返回类型
// ============================================================

interface Task {
  id: string
  name: string
  taskType: string
  description: string
  enabled?: boolean
  formConfig: string[]
}

interface Ritual {
  id: string
  name: string
  date?: string
}

interface Room {
  id: string
  roomNumber: string
  type: string
  floor?: string
  capacity: number
  status: string
}

interface VolunteerTask {
  id: string
  name: string
  taskType: string
  location?: string
  taskDate?: string
  startTime?: string
  endTime?: string
  status: string
}

// ============================================================
// 主组件
// ============================================================
export default function RegisterPage() {
  const searchParams = useSearchParams()
  const taskIdFromUrl = searchParams.get('taskId')
  const taskTypeFromUrl = searchParams.get('taskType')

  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [plaqueType, setPlaqueType] = useState<'LONGEVITY' | 'DELIVERANCE'>('LONGEVITY')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [volunteerTasks, setVolunteerTasks] = useState<VolunteerTask[]>([])
  const [isPlaqueMode, setIsPlaqueMode] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    loadTasks()
    loadSettings()
  }, [])

  // 切换任务时加载 rituals（法会列表）
  useEffect(() => {
    if (activeTask?.taskType === 'RITUAL') {
      loadRituals()
    }
    if (activeTask?.taskType === 'ACCOMMODATION') {
      loadAvailableRooms()
    }
    if (activeTask?.taskType === 'VOLUNTEER') {
      loadVolunteerTasks()
    }
  }, [activeTask])

  const loadTasks = async () => {
    try {
      const data = await registrationAPI.getTasks()
      const enabledTasks = (Array.isArray(data) ? data : []).filter((t: Task) => t.enabled !== false)
      setTasks(enabledTasks)

      if (taskIdFromUrl) {
        const task = enabledTasks.find(t => t.id === taskIdFromUrl)
        if (task) {
          setActiveTask(task)
          setFormData({})
          return
        }
      }

      if (taskTypeFromUrl === 'PLAQUE') {
        setIsPlaqueMode(true)
        setActiveTask({
          id: 'PLAQUE',
          name: '牌位登记',
          taskType: 'PLAQUE',
          description: '延生禄位、往生莲位、超度牌位',
          formConfig: ['holderName', 'longevitySubtype', 'size', 'gender', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'blessingText', 'startDate', 'dedicationType'],
        })
        setFormData({})
        return
      }

      if (enabledTasks.length > 0 && !activeTask) {
        setActiveTask(enabledTasks[0])
        setFormData({})
      }
    } catch (error) {
      console.error('加载任务失败:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const data = await systemAPI.getSettings()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  // Group tasks by taskType for tabs display
  const groupedTasks = tasks.reduce((groups: Record<string, Task[]>, task) => {
    const key = task.taskType
    if (!groups[key]) groups[key] = []
    groups[key].push(task)
    return groups
  }, {})

  // Build flat tabs list (PLAQUE becomes single "牌位登记" tab)
  const tabs = tasks.map(task => ({
    task,
    label: ['LONGEVITY','REBIRTH','DELIVERANCE','PLAQUE'].includes(task.taskType) ? '牌位登记' : task.name,
    key: ['LONGEVITY','REBIRTH','DELIVERANCE','PLAQUE'].includes(task.taskType) ? 'PLAQUE' : `${task.taskType}-${task.id}`,
  }))
  // Deduplicate by key to avoid double rendering PLAQUE
  const uniqueTabs = tabs.reduce((acc: typeof tabs, tab) => {
    if (!acc.find(t => t.key === tab.key)) acc.push(tab)
    return acc
  }, [])

  const loadRituals = async () => {
    try {
      // 尝试从 registrationAPI 获取，如果不存在则用 fetch
      let ritualList: Ritual[] = []
      if ((registrationAPI as any).getRituals) {
        ritualList = await (registrationAPI as any).getRituals()
      } else {
        const res = await fetch('/api/rituals')
        if (res.ok) {
          ritualList = await res.json()
        }
      }
      setRituals(ritualList)
      // 更新 ritualId 的 options
      fieldDefs.ritualId.options = ritualList.map(r => ({ label: r.name, value: r.id }))
    } catch (error) {
      console.error('加载法会列表失败:', error)
    }
  }

  const loadVolunteerTasks = async () => {
    try {
      const res = await fetch('/api/volunteer-tasks')
      if (res.ok) {
        const data = await res.json()
        const taskList: VolunteerTask[] = data.data || []
        const recruitingTasks = taskList.filter(t => t.status === 'RECRUITING' || t.status === 'IN_PROGRESS')
        setVolunteerTasks(recruitingTasks)
        fieldDefs.volunteerTaskId.options = recruitingTasks.map(t => ({
          label: `${t.name} - ${t.location || '待定'} (${t.taskDate ? new Date(t.taskDate).toLocaleDateString('zh-CN') : '待定'})`,
          value: t.id
        }))
      }
    } catch (error) {
      console.error('加载义工任务列表失败:', error)
    }
  }

  const loadAvailableRooms = async () => {
    try {
      const res = await fetch('/api/rooms/available')
      if (res.ok) {
        const result = await res.json()
        const roomList: Room[] = result.data || []
        setAvailableRooms(roomList)
        // 更新 roomId 的 options
        fieldDefs.roomId.options = roomList.map(r => ({
          label: `${r.roomNumber} (${r.type}, ${r.floor || 'N/A'})`,
          value: r.id
        }))
      }
    } catch (error) {
      console.error('加载可用房间失败:', error)
    }
  }

  const handleTabChange = (task: Task) => {
    setActiveTask(task)
    setFormData({})
    setSubmitted(false)
    // Reset plaque type when switching away from PLAQUE tab
    if (!['LONGEVITY','DELIVERANCE','PLAQUE'].includes(task.taskType)) {
      setPlaqueType('LONGEVITY')
      setIsPlaqueMode(false)
    }
    // PLAQUE type tasks enter plaque mode directly
    if (task.taskType === 'PLAQUE') {
      setIsPlaqueMode(true)
      setPlaqueType('LONGEVITY')
    }
    // REBIRTH tasks now use DELIVERANCE plaque type
    if (task.taskType === 'REBIRTH') {
      setPlaqueType('DELIVERANCE')
      setIsPlaqueMode(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTask) return

    setSubmitting(true)
    try {
      let taskId = activeTask.id
      let taskType = activeTask.taskType

      // PLAQUE 类型的任务直接使用 activeTask
      if (isPlaqueMode && activeTask.taskType !== 'PLAQUE') {
        const plaqueTask = tasks.find(t => t.taskType === plaqueType)
        if (!plaqueTask) {
          alert('未找到对应的登记任务')
          setSubmitting(false)
          return
        }
        taskId = plaqueTask.id
        taskType = plaqueType
      }

      // 只提交当前 formConfig.fields 中包含的字段
      const fieldsToSubmit = activeTask.formConfig || []
      const filteredData: Record<string, any> = {}
      for (const key of fieldsToSubmit) {
        if (formData[key] !== undefined && formData[key] !== '') {
          filteredData[key] = formData[key]
        }
      }

      if (isPlaqueMode) {
        filteredData.plaqueType = plaqueType
      }

      const getSubmitterName = () => {
        if (taskType === 'LONGEVITY' || taskType === 'LAMP') return formData.blessingName || formData.holderName || ''
        if (taskType === 'DELIVERANCE') return formData.yangShang || ''
        if (taskType === 'DINING') return formData.contactName || ''
        return formData.name || ''
      }
      const getSubmitterPhone = () => {
        if (taskType === 'DINING') return formData.contactPhone || ''
        return formData.phone || ''
      }
      await registrationAPI.submitRequest({
        taskId,
        submitterName: getSubmitterName(),
        submitterPhone: getSubmitterPhone(),
        formData: filteredData,
      })
      setSubmitted(true)
    } catch (error) {
      console.error('提交失败:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // 动态渲染单个字段
  // ============================================================
  const renderField = (fieldKey: string) => {
    const def = fieldDefs[fieldKey]
    if (!def) return null

    let { type, label, options, placeholder, hint } = def
    const value = formData[fieldKey] ?? ''

    // 动态超度类型选项
    let fieldOptions = options || []
    if (fieldKey === 'dedicationType' && settings?.dedicationTypes) {
      fieldOptions = settings.dedicationTypes.split(',').map((t: string) => ({ label: t, value: t }))
      fieldOptions.push({ label: '自定义', value: 'custom' })
    }

    if (type === 'select') {
      return (
        <div key={fieldKey} className=''>
          <label className="block text-sm font-medium text-tea mb-1 tracking-wide">
            {label}
            {hint && <span className="text-xs text-tea/60 ml-1">{hint}</span>}
          </label>
          <select
            className="w-full h-11 px-4 border border-[#E8E0D0] rounded bg-white focus:outline-none focus:border-vermilion text-base"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
          >
            <option value="">请选择</option>
            {fieldOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (type === 'checkbox') {
      return (
        <div key={fieldKey} className=''>
          <label className="block text-sm font-medium text-tea mb-2 tracking-wide">{label}</label>
          <div className="flex flex-wrap gap-2">
            {(options || []).map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-tea cursor-pointer py-1 px-2 border border-[#E8E0D0] rounded hover:bg-paper-dark">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={(value || []).includes(opt.value)}
                  onChange={(e) => {
                    const curr: string[] = value || []
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, [fieldKey]: [...curr, opt.value] }))
                    } else {
                      setFormData(prev => ({ ...prev, [fieldKey]: curr.filter(v => v !== opt.value) }))
                    }
                  }}
                  className="w-4 h-4 text-vermilion border-[#E8E0D0] rounded"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div key={fieldKey} className=''>
          <label className="block text-sm font-medium text-tea mb-1 tracking-wide">
            {label}
            {hint && <span className="text-xs text-tea/60 ml-1">{hint}</span>}
          </label>
          <textarea
            className="w-full px-4 py-3 border border-[#E8E0D0] rounded bg-white focus:outline-none focus:border-vermilion text-base min-h-[80px] resize-y"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            rows={3}
          />
        </div>
      )
    }

    // text, tel, date
    return (
      <div key={fieldKey} className=''>
        <label className="block text-sm font-medium text-tea mb-1 tracking-wide">
          {label}
          {hint && <span className="text-xs text-tea/60 ml-1">{hint}</span>}
        </label>
        <input
          type={type === 'tel' ? 'tel' : type === 'date' ? 'date' : 'text'}
          className="w-full h-11 px-4 border border-[#E8E0D0] rounded bg-white focus:outline-none focus:border-vermilion text-base"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))}
        />
      </div>
    )
  }

  // ============================================================
  // 根据 taskType 渲染不同表单布局
  // ============================================================
  const renderFormByTaskType = () => {
    if (!activeTask) return null
    const { taskType, formConfig } = activeTask
    const fields: string[] = formConfig || []

    // ---- VOLUNTEER: 分组渲染 ----
    if (taskType === 'VOLUNTEER') {
      return (
        <>
          {fields.includes('volunteerTaskId') && (
            <div className="mb-6 p-4 bg-paper-dark rounded border border-[#E8E0D0]">
              <h3 className="text-sm font-medium text-tea mb-3">选择义工任务</h3>
              <select
                className="w-full h-11 px-4 border border-[#E8E0D0] rounded bg-white focus:outline-none focus:border-vermilion text-base"
                value={formData.volunteerTaskId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, volunteerTaskId: e.target.value }))}
              >
                <option value="">请选择义工任务</option>
                {(fieldDefs.volunteerTaskId.options || []).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          {VOLUNTEER_GROUPS.map(group => {
            // 只渲染 formConfig 中出现的字段
            const groupFields = group.fields.filter(f => fields.includes(f))
            if (groupFields.length === 0) return null

            // 承诺区单独处理
            if (group.title === '本人承诺') {
              return (
                <div key={group.title} className="pt-4 border-t border-[#E8E0D0]">
                  <h3 className="text-sm font-medium text-tea mb-3 tracking-wide">{group.title}</h3>
                  <div className="bg-paper-dark p-4 rounded text-xs text-tea/80 leading-relaxed space-y-1">
                    <p>义工工作服务要求及注意事项：</p>
                    <p>1.本人承诺以上填写的所有信息内容属实。</p>
                    <p>2.本人具有相应民事行为能力，身体健康，无不良嗜好。</p>
                    <p>3.做到爱国爱教，拥护中国共产党的领导，遵守国家相关法律、法规。</p>
                    <p>4.自愿参加仙顶寺义工服务，并能遵守义工相关规则，有自利利他、慈悲喜舍的精神。</p>
                    <p>5.入寺后需学习佛门礼仪并遵守。</p>
                    <p>6.爱惜寺院公共财产，节约水电、随手关灯、不乱涂乱画，保持环境整洁。</p>
                    <p>7.行为端正，不随意走动，不进人他人房间，不拿别人物品。</p>
                    <p>8.严格遵守"不准拍摄寺院佛像、佛事，尊重他人肖像权，未经他人同意不拍摄他人"等相关规定。不随意添加僧人及其他人联系方式。</p>
                    <p>9.早晚课诵、二时供斋、出坡不随众者罚，不服者责离寺院。</p>
                    <p>10.服从安排，完成本职工作。</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {groupFields.map(f => renderField(f))}
                  </div>
                </div>
              )
            }

            // 义工经历的条件显示
            if (group.title === '义工经历') {
              const hasExp = formData['hasVolunteerExperience']
              return (
                <div key={group.title} className="pt-4 border-t border-[#E8E0D0]">
                  <h3 className="text-sm font-medium text-tea mb-3 tracking-wide">{group.title}</h3>
                  <div className="space-y-4">
                    {renderField('hasVolunteerExperience')}
                    {hasExp === '是' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {['volunteerTimes', 'lastVolunteerDate', 'lastVolunteerLocation'].map(f => renderField(f))}
                        </div>
                        {renderField('lastVolunteerContent')}
                      </>
                    )}
                  </div>
                </div>
              )
            }

            // 基本信息两列布局
            const twoCol = ['基本信息', '补充信息', '学佛经历', '服务时间'].includes(group.title)
            return (
              <div key={group.title} className="pt-4 border-t border-[#E8E0D0]">
                <h3 className="text-sm font-medium text-tea mb-3 tracking-wide">{group.title}</h3>
                <div className={twoCol ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {groupFields.map(f => renderField(f))}
                </div>
              </div>
            )
          })}
        </>
      )
    }

    // ---- PLAQUE (延生 / 超度): 合并为一个登记页 ----
    if (isPlaqueMode || ['LONGEVITY','DELIVERANCE'].includes(taskType)) {
      const PLAQUE_SUBTYPES = [
        {
          value: 'LONGEVITY',
          label: '延生禄位',
          desc: '法喜充满 六时吉祥',
          fields: ['holderName', 'longevitySubtype', 'size', 'gender', 'birthDate', 'birthLunar', 'phone', 'address', 'blessingText', 'startDate'],
        },
        {
          value: 'DELIVERANCE',
          label: '超度牌位',
          desc: '超度冤亲债主、堕胎婴灵、历代宗亲',
          fields: ['dedicationType', 'size', 'yangShang', 'phone', 'address', 'startDate'],
        },
      ]
      const isDeliveranceWithName = plaqueType === 'DELIVERANCE' && formData.deceasedType === 'specific'
      const currentSubtype = PLAQUE_SUBTYPES.find(s => s.value === plaqueType) || PLAQUE_SUBTYPES[0]
      return (
        <div className="space-y-4">
          {/* 牌位类型选择 */}
          <div className="bg-paper-dark p-4 rounded border border-[#E8E0D0]">
            <label className="block text-sm font-medium text-tea mb-2 tracking-wide">牌位类型</label>
            <div className="flex gap-3">
              {PLAQUE_SUBTYPES.map(st => (
                <label key={st.value} className={`flex items-center gap-2 text-sm cursor-pointer py-2 px-4 border rounded transition-all ${
                  plaqueType === st.value
                    ? 'border-vermilion bg-white text-ink font-medium'
                    : 'border-[#E8E0D0] bg-white text-tea hover:border-vermilion/50'
                }`}>
                  <input
                    type="radio"
                    name="plaqueType"
                    value={st.value}
                    checked={plaqueType === st.value}
                    onChange={() => { setPlaqueType(st.value as typeof plaqueType); setFormData({}) }}
                    className="sr-only"
                  />
                  {st.label}
                </label>
              ))}
            </div>
          </div>
          {/* 超度牌位 - 子类型选择：具体亡者 / 一般超度 */}
          {plaqueType === 'DELIVERANCE' && (
            <div className="bg-paper-dark p-4 rounded border border-[#E8E0D0]">
              <label className="block text-sm font-medium text-tea mb-2 tracking-wide">超度类型</label>
              <div className="flex gap-3">
                <label className={`flex items-center gap-2 text-sm cursor-pointer py-2 px-4 border rounded transition-all ${
                  formData.deceasedType !== 'specific' ? 'border-vermilion bg-white text-ink font-medium' : 'border-[#E8E0D0] bg-white text-tea hover:border-vermilion/50'
                }`}>
                  <input
                    type="radio"
                    name="deceasedType"
                    value="general"
                    checked={formData.deceasedType !== 'specific'}
                    onChange={() => setFormData(prev => ({ ...prev, deceasedType: 'general', deceasedName: undefined, gender: undefined, birthDate: undefined, birthLunar: undefined, deathDate: undefined, deathLunar: undefined, showSecondDeceased: undefined }))}
                    className="sr-only"
                  />
                  无记名超度
                </label>
                <label className={`flex items-center gap-2 text-sm cursor-pointer py-2 px-4 border rounded transition-all ${
                  formData.deceasedType === 'specific' ? 'border-vermilion bg-white text-ink font-medium' : 'border-[#E8E0D0] bg-white text-tea hover:border-vermilion/50'
                }`}>
                  <input
                    type="radio"
                    name="deceasedType"
                    value="specific"
                    checked={formData.deceasedType === 'specific'}
                    onChange={() => setFormData(prev => ({ ...prev, deceasedType: 'specific', dedicationType: undefined }))}
                    className="sr-only"
                  />
                  记名超度
                </label>
              </div>
            </div>
          )}
          {/* 渲染超度牌位字段 */}
          {plaqueType === 'DELIVERANCE' && formData.deceasedType === 'specific' && (
            <>
              {['deceasedName', 'gender', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar'].map(f => renderField(f))}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, showSecondDeceased: true }))}
                className="text-sm text-vermilion hover:text-vermilion-dark flex items-center gap-1"
              >
                <span>+</span> 增加第二亡者
              </button>
            </>
          )}
          {plaqueType === 'DELIVERANCE' && formData.deceasedType !== 'specific' && (
            <>
              {renderField('dedicationType')}
              {formData.dedicationType === 'custom' && renderField('customDedicationType')}
            </>
          )}
          {plaqueType === 'DELIVERANCE' && formData.deceasedType === 'specific' && (
            <>
              {renderField('size')}
              {renderField('yangShang')}
              {renderField('phone')}
              {renderField('address')}
              {renderField('startDate')}
            </>
          )}
          {plaqueType === 'DELIVERANCE' && formData.deceasedType !== 'specific' && (
            <>
              {renderField('yangShang')}
              {renderField('phone')}
              {renderField('address')}
              {renderField('startDate')}
            </>
          )}
          {/* 超度牌位 - 第二亡者 */}
          {plaqueType === 'DELIVERANCE' && formData.deceasedType === 'specific' && formData.showSecondDeceased && (
            <div className="pt-4 border-t border-[#E8E0D0] space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-tea">第二亡者</p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => {
                    const n = { ...prev }
                    delete n.showSecondDeceased
                    delete n.deceasedName2
                    delete n.birthDate2
                    delete n.birthLunar2
                    delete n.deathDate2
                    delete n.deathLunar2
                    return n
                  })}
                  className="text-sm text-tea/60 hover:text-vermilion"
                >
                  移除
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('deceasedName2')}
                {renderField('birthDate2')}
                {renderField('birthLunar2')}
                {renderField('deathDate2')}
                {renderField('deathLunar2')}
              </div>
            </div>
          )}
          {/* 延生禄位字段 */}
          {plaqueType === 'LONGEVITY' && currentSubtype.fields.map(f => renderField(f))}
        </div>
      )
    }

    // ---- LAMP (供灯) ----
    if (taskType === 'LAMP') {
      return (
        <div className="space-y-4">
          {fields.filter(f => f !== 'location').map(f => renderField(f))}
        </div>
      )
    }

    // ---- RITUAL (法会) ----
    if (taskType === 'RITUAL') {
      return (
        <div className="space-y-4">
          {fields.map(f => renderField(f))}
        </div>
      )
    }

    // ---- ACCOMMODATION (住宿) ----
    if (taskType === 'ACCOMMODATION') {
      return (
        <div className="space-y-4">
          {fields.map(f => renderField(f))}
        </div>
      )
    }

    // ---- DINING (用餐) ----
    if (taskType === 'DINING') {
      return (
        <div className="space-y-4">
          {fields.map(f => renderField(f))}
        </div>
      )
    }

    // ---- 默认: 按 fields 顺序渲染 ----
    return (
      <div className="space-y-4">
        {fields.map(f => renderField(f))}
      </div>
    )
  }

  // ============================================================
  // 提交成功页
  // ============================================================
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="text-center">
          <div className="text-5xl mb-4"></div>
          <h2 className="text-2xl font-serif font-medium text-ink mb-2 tracking-wider">提交成功</h2>
          <p className="text-tea/70 mb-8 tracking-wide">请等待审核，我们会尽快与您联系</p>

          <Link href="/" className="inline-block border border-vermilion text-vermilion px-8 py-3 rounded text-sm font-medium tracking-wider hover:bg-vermilion hover:text-white">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  // ============================================================
  // 无任务页
  // ============================================================
  if (tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="text-center">
          <h2 className="text-xl font-medium text-ink mb-2">暂无可用登记</h2>
          <p className="text-tea/60 mb-8">当前没有开放的登记项目</p>
          <Link href="/" className="inline-block bg-vermilion text-white px-8 py-3 rounded text-sm font-medium tracking-wider hover:bg-vermilion-dark shadow-classic">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  // ============================================================
  // 主表单页
  // ============================================================
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E0D0] sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="text-sm sm:text-base text-tea hover:text-vermilion tracking-wide">
            返回首页
          </Link>
          <h1 className="text-base sm:text-lg font-medium text-ink tracking-wide">{activeTask?.name || '在线登记'}</h1>

        </div>
      </header>

      {/* Task Tabs - 仅在未指定任务时显示 */}
      {!taskIdFromUrl && !isPlaqueMode && (
        <div className="bg-white border-b border-[#E8E0D0] overflow-x-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex gap-2 min-w-max">
              {uniqueTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.task)}
                  className={`px-4 sm:px-5 py-2 rounded text-sm font-medium tracking-wide transition-all whitespace-nowrap ${
                    activeTask?.id === tab.task.id
                      ? 'bg-vermilion text-white'
                      : 'bg-paper-dark text-tea hover:bg-paper-dark/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-classic p-4 sm:p-8">
          {/* 标题 */}
          <div className="text-center mb-6 pb-4 border-b border-[#E8E0D0]">
            <h2 className="text-xl font-medium text-ink mb-2 tracking-wide">
              {activeTask?.name || '在线登记'}
            </h2>
            <p className="text-sm text-tea/70">
              {activeTask?.description || '感恩您的参与和护持，请如实填写以下信息'}
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {renderFormByTaskType()}

            {/* 提交按钮 */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-vermilion text-white px-8 py-4 rounded text-base font-medium tracking-wider hover:bg-vermilion-dark shadow-classic disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {submitting ? '提交中...' : '确认提交登记'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}
