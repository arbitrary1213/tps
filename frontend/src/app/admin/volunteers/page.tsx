'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Badge, Modal, Input, Select, Textarea, SearchBar, Empty } from '@/components/ui'

const rankOptions = [
  { value: '一星', label: '一星' },
  { value: '二星', label: '二星' },
  { value: '三星', label: '三星' },
  { value: '四星', label: '四星' },
  { value: '五星', label: '五星' },
]

const statusOptions = [
  { value: 'ACTIVE', label: '在职' },
  { value: 'INACTIVE', label: '离职' },
]

const genderOptions = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
]

const ethnicityOptions = [
  { value: '汉族', label: '汉族' },
  { value: '藏族', label: '藏族' },
  { value: '蒙古族', label: '蒙古族' },
  { value: '回族', label: '回族' },
  { value: '维吾尔族', label: '维吾尔族' },
  { value: '其他', label: '其他' },
]

const educationOptions = [
  { value: '小学', label: '小学' },
  { value: '初中', label: '初中' },
  { value: '高中/中专', label: '高中/中专' },
  { value: '大专', label: '大专' },
  { value: '本科', label: '本科' },
  { value: '硕士', label: '硕士' },
  { value: '博士', label: '博士' },
]

const healthStatusOptions = [
  { value: '健康', label: '健康' },
  { value: '良好', label: '良好' },
  { value: '一般', label: '一般' },
  { value: '较差', label: '较差' },
]

const yesNoOptions = [
  { value: '是', label: '是' },
  { value: '否', label: '否' },
]

const skillOptions = [
  '撰稿写作', '书法', '摄影摄像', '网站维护', '翻译', '文字编辑',
  '活动策划', '活动主持', '乐器', '音乐舞蹈', '医疗护理', '驾驶',
  '园艺', '水电维修', '消防安全', '心理咨询', '导游解说', '其他'
]

const volunteerProjectOptions = [
  '道场清洁', '斋堂协助', '种菜养花', '寺院导游', '弘法事务',
  '活动主持策划', '慈善活动', '车辆协助', '秩序维安', '消防安全',
  '水电维修', '撰稿摄影', '文字编辑校对', '其他'
]

const preceptsOptions = ['五戒', '菩萨戒']
const willingLearnOptions = [{value: '非常乐意', label: '非常乐意'}, {value: '可有可无', label: '可有可无'}, {value: '不接受', label: '不接受'}]

interface Volunteer {
  id: string
  name: string
  dharmaName?: string
  gender?: string
  birthDate?: string
  phone: string
  address?: string
  ethnicity?: string
  education?: string
  emergencyContact?: string
  emergencyPhone?: string
  currentOccupation?: string
  previousOccupation?: string
  healthStatus?: string
  hasInfectiousDisease?: string
  diseaseHistory?: string
  hasAllergy?: string
  allergyHistory?: string
  hasSpecialNeeds?: string
  specialNeedsDetail?: string
  firstContactBuddhism?: string
  hasTakenRefuge?: string
  refugeTime?: string
  preceptsHeld?: string[]
  willingToLearn?: string
  guidanceHope?: string
  hasVolunteerExperience?: string
  volunteerTimes?: number
  lastVolunteerDate?: string
  lastVolunteerLocation?: string
  lastVolunteerContent?: string
  skills?: string[]
  volunteerProjects?: string[]
  serviceStartDate?: string
  serviceEndDate?: string
  serviceDuration?: string
  commitment?: string
  signature?: string
  totalHours: number
  rank: string
  status: string
  remarks?: string
  createdAt: string
}

const defaultForm = {
  name: '',
  dharmaName: '',
  gender: '',
  birthDate: '',
  phone: '',
  address: '',
  ethnicity: '',
  education: '',
  emergencyContact: '',
  emergencyPhone: '',
  currentOccupation: '',
  previousOccupation: '',
  healthStatus: '',
  hasInfectiousDisease: '',
  diseaseHistory: '',
  hasAllergy: '',
  allergyHistory: '',
  hasSpecialNeeds: '',
  specialNeedsDetail: '',
  firstContactBuddhism: '',
  hasTakenRefuge: '',
  refugeTime: '',
  preceptsHeld: [] as string[],
  willingToLearn: '',
  guidanceHope: '',
  hasVolunteerExperience: '',
  volunteerTimes: 0,
  lastVolunteerDate: '',
  lastVolunteerLocation: '',
  lastVolunteerContent: '',
  skills: [] as string[],
  volunteerProjects: [] as string[],
  serviceStartDate: '',
  serviceEndDate: '',
  serviceDuration: '',
  commitment: '',
  signature: '',
  rank: '一星',
  status: 'ACTIVE',
  remarks: '',
}

export default function VolunteersPage() {
  const { token } = useAuthStore()
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editing, setEditing] = useState<Volunteer | null>(null)
  const [viewing, setViewing] = useState<Volunteer | null>(null)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    loadVolunteers()
  }, [])

  const loadVolunteers = async () => {
    try {
      const data = await businessAPI.getVolunteers(token!)
      setVolunteers(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVolunteers = volunteers.filter(v =>
    v.name.includes(search) || v.phone.includes(search)
  )

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
        refugeTime: formData.refugeTime ? new Date(formData.refugeTime) : undefined,
        lastVolunteerDate: formData.lastVolunteerDate ? new Date(formData.lastVolunteerDate) : undefined,
        serviceStartDate: formData.serviceStartDate ? new Date(formData.serviceStartDate) : undefined,
        serviceEndDate: formData.serviceEndDate ? new Date(formData.serviceEndDate) : undefined,
      }
      if (editing) {
        await businessAPI.updateVolunteer(token!, editing.id, submitData)
      } else {
        await businessAPI.createVolunteer(token!, submitData)
      }
      setModalOpen(false)
      setEditing(null)
      setFormData(defaultForm)
      loadVolunteers()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleEdit = (volunteer: Volunteer) => {
    setEditing(volunteer)
    setFormData({
      name: volunteer.name || '',
      dharmaName: volunteer.dharmaName || '',
      gender: volunteer.gender || '',
      birthDate: volunteer.birthDate ? volunteer.birthDate.split('T')[0] : '',
      phone: volunteer.phone,
      address: volunteer.address || '',
      ethnicity: (volunteer as any).ethnicity || '',
      education: (volunteer as any).education || '',
      emergencyContact: volunteer.emergencyContact || '',
      emergencyPhone: volunteer.emergencyPhone || '',
      currentOccupation: volunteer.currentOccupation || '',
      previousOccupation: volunteer.previousOccupation || '',
      healthStatus: volunteer.healthStatus || '',
      hasInfectiousDisease: volunteer.hasInfectiousDisease || '',
      diseaseHistory: volunteer.diseaseHistory || '',
      hasAllergy: volunteer.hasAllergy || '',
      allergyHistory: volunteer.allergyHistory || '',
      hasSpecialNeeds: volunteer.hasSpecialNeeds || '',
      specialNeedsDetail: volunteer.specialNeedsDetail || '',
      firstContactBuddhism: volunteer.firstContactBuddhism || '',
      hasTakenRefuge: volunteer.hasTakenRefuge || '',
      refugeTime: volunteer.refugeTime ? volunteer.refugeTime.split('T')[0] : '',
      preceptsHeld: volunteer.preceptsHeld || [],
      willingToLearn: volunteer.willingToLearn || '',
      guidanceHope: volunteer.guidanceHope || '',
      hasVolunteerExperience: volunteer.hasVolunteerExperience || '',
      volunteerTimes: volunteer.volunteerTimes || 0,
      lastVolunteerDate: volunteer.lastVolunteerDate ? volunteer.lastVolunteerDate.split('T')[0] : '',
      lastVolunteerLocation: volunteer.lastVolunteerLocation || '',
      lastVolunteerContent: volunteer.lastVolunteerContent || '',
      skills: volunteer.skills || [],
      volunteerProjects: volunteer.volunteerProjects || [],
      serviceStartDate: volunteer.serviceStartDate ? volunteer.serviceStartDate.split('T')[0] : '',
      serviceEndDate: volunteer.serviceEndDate ? volunteer.serviceEndDate.split('T')[0] : '',
      serviceDuration: volunteer.serviceDuration || '',
      commitment: volunteer.commitment || '',
      signature: volunteer.signature || '',
      rank: volunteer.rank || '一星',
      status: volunteer.status || 'ACTIVE',
      remarks: volunteer.remarks || '',
    })
    setModalOpen(true)
  }

  const handleView = (volunteer: Volunteer) => {
    setViewing(volunteer)
    setDetailModalOpen(true)
  }

  const resetForm = () => {
    setFormData(defaultForm)
    setEditing(null)
  }

  const toggleArrayField = (field: 'skills' | 'preceptsHeld' | 'volunteerProjects', value: string) => {
    const arr = formData[field]
    if (arr.includes(value)) {
      setFormData({ ...formData, [field]: arr.filter((v: string) => v !== value) })
    } else {
      setFormData({ ...formData, [field]: [...arr, value] })
    }
  }

  const columns = [
    { key: 'name', label: '姓名' },
    { key: 'phone', label: '电话' },
    { key: 'gender', label: '性别' },
    { key: 'rank', label: '等级' },
    { key: 'status', label: '状态' },
    { key: 'totalHours', label: '服务时长' },
    { key: 'actions', label: '操作' },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">义工管理</h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>+ 新建义工</Button>
      </div>

      <Card>
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索姓名或电话..."
            className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : filteredVolunteers.length === 0 ? (
          <Empty title="暂无义工记录" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map(col => (
                  <th key={col.key} className="text-left py-3 px-4 text-sm text-gray-600">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map(volunteer => (
                <tr key={volunteer.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">{volunteer.name}</td>
                  <td className="py-3 px-4">{volunteer.phone}</td>
                  <td className="py-3 px-4">{volunteer.gender || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={volunteer.rank === '五星' ? 'success' : 'gray'}>{volunteer.rank}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={volunteer.status === 'ACTIVE' ? 'success' : 'gray'}>
                      {volunteer.status === 'ACTIVE' ? '在职' : '离职'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{volunteer.totalHours}小时</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleView(volunteer)} className="text-blue-600 hover:underline mr-3">查看</button>
                    <button onClick={() => handleEdit(volunteer)} className="text-vermilion hover:underline">编辑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* 新建/编辑弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-medium">{editing ? '编辑义工' : '新建义工'}</h2>
              <button onClick={() => { setModalOpen(false); setEditing(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">姓名 <span className="text-red-500">*</span></label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">法名</label>
                      <Input value={formData.dharmaName} onChange={e => setFormData({...formData, dharmaName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">性别</label>
                      <Select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} options={genderOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">出生日期</label>
                      <Input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">电话 <span className="text-red-500">*</span></label>
                      <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">民族</label>
                      <Select value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})} options={ethnicityOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">学历</label>
                      <Select value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} options={educationOptions} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">通讯地址</label>
                      <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 紧急联系 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">紧急联系</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">紧急联系人</label>
                      <Input value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">紧急联系人电话</label>
                      <Input value={formData.emergencyPhone} onChange={e => setFormData({...formData, emergencyPhone: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 职业信息 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">职业信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">从事职业</label>
                      <Input value={formData.currentOccupation} onChange={e => setFormData({...formData, currentOccupation: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">曾经从事职业</label>
                      <Input value={formData.previousOccupation} onChange={e => setFormData({...formData, previousOccupation: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 健康状况 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">健康状况</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">健康状况</label>
                      <Select value={formData.healthStatus} onChange={e => setFormData({...formData, healthStatus: e.target.value})} options={healthStatusOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">有无传染病史</label>
                      <Select value={formData.hasInfectiousDisease} onChange={e => setFormData({...formData, hasInfectiousDisease: e.target.value})} options={yesNoOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">病史</label>
                      <Input value={formData.diseaseHistory} onChange={e => setFormData({...formData, diseaseHistory: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">有无过敏史</label>
                      <Select value={formData.hasAllergy} onChange={e => setFormData({...formData, hasAllergy: e.target.value})} options={yesNoOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">过敏史</label>
                      <Input value={formData.allergyHistory} onChange={e => setFormData({...formData, allergyHistory: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">有无特殊照顾需求</label>
                      <Select value={formData.hasSpecialNeeds} onChange={e => setFormData({...formData, hasSpecialNeeds: e.target.value})} options={yesNoOptions} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">特殊照顾详情</label>
                      <Textarea value={formData.specialNeedsDetail} onChange={e => setFormData({...formData, specialNeedsDetail: e.target.value})} rows={2} />
                    </div>
                  </div>
                </div>

                {/* 学佛经历 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">学佛经历</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">最初接触佛教时间</label>
                      <Input value={formData.firstContactBuddhism} onChange={e => setFormData({...formData, firstContactBuddhism: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">是否受过皈依</label>
                      <Select value={formData.hasTakenRefuge} onChange={e => setFormData({...formData, hasTakenRefuge: e.target.value})} options={yesNoOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">皈依时间</label>
                      <Input type="date" value={formData.refugeTime} onChange={e => setFormData({...formData, refugeTime: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">是否愿意接受佛法学习</label>
                      <Select value={formData.willingToLearn} onChange={e => setFormData({...formData, willingToLearn: e.target.value})} options={willingLearnOptions} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">受持戒法</label>
                      <div className="flex gap-4">
                        {preceptsOptions.map(opt => (
                          <label key={opt} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.preceptsHeld.includes(opt)}
                              onChange={() => toggleArrayField('preceptsHeld', opt)}
                              className="w-4 h-4"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">希望得到的指导</label>
                      <Textarea value={formData.guidanceHope} onChange={e => setFormData({...formData, guidanceHope: e.target.value})} rows={2} />
                    </div>
                  </div>
                </div>

                {/* 义工经历 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">义工经历</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">是否参加过义工活动</label>
                      <Select value={formData.hasVolunteerExperience} onChange={e => setFormData({...formData, hasVolunteerExperience: e.target.value})} options={yesNoOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">参与次数</label>
                      <Input type="number" value={formData.volunteerTimes} onChange={e => setFormData({...formData, volunteerTimes: parseInt(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">最后一次参与日期</label>
                      <Input type="date" value={formData.lastVolunteerDate} onChange={e => setFormData({...formData, lastVolunteerDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">最后一次参与地点</label>
                      <Input value={formData.lastVolunteerLocation} onChange={e => setFormData({...formData, lastVolunteerLocation: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">最后一次活动内容</label>
                      <Textarea value={formData.lastVolunteerContent} onChange={e => setFormData({...formData, lastVolunteerContent: e.target.value})} rows={2} />
                    </div>
                  </div>
                </div>

                {/* 专长 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">专长</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map(skill => (
                      <label key={skill} className="px-3 py-1 border rounded cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => toggleArrayField('skills', skill)}
                          className="mr-1"
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 义工项目 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">拟参与义工项目</h3>
                  <div className="flex flex-wrap gap-2">
                    {volunteerProjectOptions.map(proj => (
                      <label key={proj} className="px-3 py-1 border rounded cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={formData.volunteerProjects.includes(proj)}
                          onChange={() => toggleArrayField('volunteerProjects', proj)}
                          className="mr-1"
                        />
                        {proj}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 服务时间 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">服务时间</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">开始日期</label>
                      <Input type="date" value={formData.serviceStartDate} onChange={e => setFormData({...formData, serviceStartDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">结束日期</label>
                      <Input type="date" value={formData.serviceEndDate} onChange={e => setFormData({...formData, serviceEndDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">持续时间</label>
                      <Input value={formData.serviceDuration} onChange={e => setFormData({...formData, serviceDuration: e.target.value})} placeholder="如：7天" />
                    </div>
                  </div>
                </div>

                {/* 本人承诺 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">本人承诺</h3>
                  <Textarea value={formData.commitment} onChange={e => setFormData({...formData, commitment: e.target.value})} rows={4} />
                </div>

                {/* 管理信息 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3 border-b pb-1">管理信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">等级</label>
                      <Select value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} options={rankOptions} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">状态</label>
                      <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} options={statusOptions} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">备注</label>
                      <Textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} rows={2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>取消</Button>
              <Button onClick={handleSubmit}>{editing ? '保存' : '创建'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* 查看详情弹窗 */}
      {detailModalOpen && viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-medium">义工详情 - {viewing.name}</h2>
              <button onClick={() => setDetailModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">姓名：</span>{viewing.name}</div>
                <div><span className="text-gray-500">法名：</span>{viewing.dharmaName || '-'}</div>
                <div><span className="text-gray-500">性别：</span>{viewing.gender || '-'}</div>
                <div><span className="text-gray-500">出生日期：</span>{viewing.birthDate ? new Date(viewing.birthDate).toLocaleDateString() : '-'}</div>
                <div><span className="text-gray-500">电话：</span>{viewing.phone}</div>
                <div><span className="text-gray-500">民族：</span>{viewing.ethnicity || '-'}</div>
                <div><span className="text-gray-500">学历：</span>{viewing.education || '-'}</div>
                <div><span className="text-gray-500">地址：</span>{viewing.address || '-'}</div>
                <div><span className="text-gray-500">紧急联系人：</span>{viewing.emergencyContact || '-'}</div>
                <div><span className="text-gray-500">紧急联系电话：</span>{viewing.emergencyPhone || '-'}</div>
                <div><span className="text-gray-500">当前职业：</span>{viewing.currentOccupation || '-'}</div>
                <div><span className="text-gray-500">曾经职业：</span>{viewing.previousOccupation || '-'}</div>
                <div><span className="text-gray-500">健康状况：</span>{viewing.healthStatus || '-'}</div>
                <div><span className="text-gray-500">传染病史：</span>{viewing.hasInfectiousDisease || '-'}</div>
                <div><span className="text-gray-500">过敏史：</span>{viewing.hasAllergy || '-'}</div>
                <div><span className="text-gray-500">特殊需求：</span>{viewing.hasSpecialNeeds || '-'}</div>
                <div><span className="text-gray-500">接触佛教：</span>{viewing.firstContactBuddhism || '-'}</div>
                <div><span className="text-gray-500">皈依：</span>{viewing.hasTakenRefuge || '-'}</div>
                <div><span className="text-gray-500">戒法：</span>{viewing.preceptsHeld?.join(', ') || '-'}</div>
                <div><span className="text-gray-500">学习意愿：</span>{viewing.willingToLearn || '-'}</div>
                <div><span className="text-gray-500">义工经历：</span>{viewing.hasVolunteerExperience || '-'}</div>
                <div><span className="text-gray-500">参与次数：</span>{viewing.volunteerTimes || 0}</div>
                <div><span className="text-gray-500">专长：</span>{viewing.skills?.join(', ') || '-'}</div>
                <div><span className="text-gray-500">义工项目：</span>{viewing.volunteerProjects?.join(', ') || '-'}</div>
                <div><span className="text-gray-500">服务开始：</span>{viewing.serviceStartDate ? new Date(viewing.serviceStartDate).toLocaleDateString() : '-'}</div>
                <div><span className="text-gray-500">服务结束：</span>{viewing.serviceEndDate ? new Date(viewing.serviceEndDate).toLocaleDateString() : '-'}</div>
                <div><span className="text-gray-500">等级：</span>{viewing.rank}</div>
                <div><span className="text-gray-500">状态：</span>{viewing.status === 'ACTIVE' ? '在职' : '离职'}</div>
                <div><span className="text-gray-500">服务时长：</span>{viewing.totalHours}小时</div>
                <div><span className="text-gray-500">备注：</span>{viewing.remarks || '-'}</div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
