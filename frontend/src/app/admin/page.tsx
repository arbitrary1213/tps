'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import type { DashboardRegistrationItem, DashboardStats } from '@/types/api'

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

const statusMap: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'danger' | 'gray' }> = {
  PENDING: { label: '待审批', variant: 'warning' },
  APPROVED: { label: '已通过', variant: 'success' },
  REJECTED: { label: '已拒绝', variant: 'danger' },
}

const lunarDayMap: Record<string, number> = {
  初一: 1, 初二: 2, 初三: 3, 初四: 4, 初五: 5, 初六: 6, 初七: 7, 初八: 8, 初九: 9, 初十: 10,
  十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15, 十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
  廿一: 21, 廿二: 22, 廿三: 23, 廿四: 24, 廿五: 25, 廿六: 26, 廿七: 27, 廿八: 28, 廿九: 29, 三十: 30,
}

const lunarMonthMap: Record<string, number> = {
  正月: 1, 二月: 2, 三月: 3, 四月: 4, 五月: 5, 六月: 6, 七月: 7, 八月: 8, 九月: 9, 十月: 10, 冬月: 11, 腊月: 12,
}

const solarFestivalMap: Record<string, string> = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-8': '妇女节',
  '4-1': '愚人节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
  '12-24': '平安夜',
  '12-25': '圣诞节',
}

const lunarFestivalMap: Record<string, string> = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-8': '腊八节',
  '12-23': '北方小年',
  '12-24': '南方小年',
}

const solarTermNames = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
]

const solarTermInfo = [
  0, 21208, 42467, 63836, 85337, 107014,
  128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494,
  397447, 419210, 440795, 462224, 483532, 504758,
]

const buddhistDays = [
  { month: 1, day: 1, name: '弥勒菩萨圣诞' },
  { month: 2, day: 8, name: '释迦牟尼佛出家' },
  { month: 2, day: 15, name: '释迦牟尼佛涅槃' },
  { month: 2, day: 19, name: '观世音菩萨圣诞' },
  { month: 4, day: 4, name: '文殊菩萨圣诞' },
  { month: 4, day: 8, name: '释迦牟尼佛圣诞' },
  { month: 6, day: 19, name: '观世音菩萨成道' },
  { month: 7, day: 15, name: '佛欢喜日' },
  { month: 7, day: 30, name: '地藏菩萨圣诞' },
  { month: 9, day: 19, name: '观世音菩萨出家' },
  { month: 11, day: 17, name: '阿弥陀佛圣诞' },
  { month: 12, day: 8, name: '释迦牟尼佛成道' },
]

function formatLunarDay(day: number) {
  const names = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  return names[day] || ''
}

function parseLunarDay(value: string) {
  if (lunarDayMap[value]) return lunarDayMap[value]
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function getLunarParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('zh-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' })
  const parts = formatter.formatToParts(date)
  const monthText = parts.find((part) => part.type === 'month')?.value || ''
  const dayText = parts.find((part) => part.type === 'day')?.value || ''
  const day = parseLunarDay(dayText)
  return {
    monthText,
    dayText: lunarDayMap[dayText] ? dayText : formatLunarDay(day),
    month: lunarMonthMap[monthText.replace('闰', '')] || 0,
    day,
    isLeapMonth: monthText.includes('闰'),
  }
}

function getSolarTerm(date: Date) {
  const year = date.getFullYear()
  const base = Date.UTC(1900, 0, 6, 2, 5)
  for (let index = 0; index < solarTermNames.length; index += 1) {
    const termDate = new Date(base + 31556925974.7 * (year - 1900) + solarTermInfo[index] * 60000)
    if (termDate.getUTCMonth() === date.getMonth() && termDate.getUTCDate() === date.getDate()) {
      return solarTermNames[index]
    }
  }
  return ''
}

function getSolarFestival(date: Date) {
  return solarFestivalMap[`${date.getMonth() + 1}-${date.getDate()}`] || ''
}

function getBuddhistEvents(lunar: ReturnType<typeof getLunarParts>) {
  return buddhistDays.filter((event) => event.month === lunar.month && event.day === lunar.day).map((event) => event.name)
}

function calendarLabels(date: Date, lunar: ReturnType<typeof getLunarParts>) {
  const labels = [
    getSolarFestival(date),
    !lunar.isLeapMonth ? lunarFestivalMap[`${lunar.month}-${lunar.day}`] : '',
    getSolarTerm(date),
    ...getBuddhistEvents(lunar),
  ].filter(Boolean)
  return Array.from(new Set(labels))
}

function lunarCellText(lunar: ReturnType<typeof getLunarParts>) {
  return `${lunar.isLeapMonth ? '闰' : ''}${lunar.day === 1 ? lunar.monthText : lunar.dayText}`
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function BuddhistCalendar() {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const start = new Date(monthStart)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const lunar = getLunarParts(date)
    return { date, lunar, labels: calendarLabels(date, lunar), events: getBuddhistEvents(lunar) }
  })
  const todayLunar = getLunarParts(today)
  const todayLabels = calendarLabels(today, todayLunar)
  const upcoming = days.filter((item) => item.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && item.labels.length).slice(0, 5)

  return (
    <section className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-medium text-ink">万年历 / 佛教日历</h3>
          <p className="text-sm text-tea/60 mt-1">
            {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 · 农历{todayLunar.isLeapMonth ? '闰' : ''}{todayLunar.monthText}{todayLunar.dayText}
          </p>
        </div>
        <div className="rounded border border-[#E8E0D0] bg-[#FBF8F1] px-4 py-3 min-w-[240px]">
          <div className="font-medium text-ink">{todayLabels.length ? todayLabels.join(' / ') : lunarCellText(todayLunar)}</div>
          <div className="text-xs text-tea/60 mt-1">显示公历节日、农历节日、节气和佛教日历</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <div className="grid grid-cols-7 gap-1.5">
          {['一', '二', '三', '四', '五', '六', '日'].map((week) => (
            <div key={week} className="text-center text-xs text-tea/60 py-1">{week}</div>
          ))}
          {days.map((item) => {
            const active = dateKey(item.date) === dateKey(today)
            const inMonth = item.date.getMonth() === today.getMonth()
            return (
              <div
                key={dateKey(item.date)}
                className={`min-h-[76px] rounded border p-2 ${active ? 'border-vermilion ring-1 ring-vermilion' : 'border-[#E8E0D0]'} ${inMonth ? 'bg-white' : 'bg-[#F8F4EA] opacity-50'} ${item.labels.length ? 'bg-[#FFF8F1]' : ''}`}
              >
                <div className="font-medium text-ink leading-none">{item.date.getDate()}</div>
                <div className={`text-xs mt-1 truncate ${item.labels.length ? 'text-vermilion' : 'text-tea/60'}`}>
                  {item.labels[0] || lunarCellText(item.lunar)}
                </div>
                {item.labels[1] && <div className="text-[11px] text-tea/70 mt-0.5 truncate">{item.labels[1]}</div>}
              </div>
            )
          })}
        </div>

        <div>
          <h4 className="font-medium text-ink mb-3">近期佛教日历</h4>
          <div className="space-y-2">
            {upcoming.map((item) => (
              <div key={dateKey(item.date)} className="rounded border border-[#E8E0D0] p-3">
                <div className="text-sm font-medium text-ink">{item.date.getMonth() + 1}/{item.date.getDate()} · {item.lunar.monthText}{item.lunar.dayText}</div>
                <div className="text-sm text-tea/70 mt-1">{item.labels.join(' / ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AdminDashboard() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<Pick<DashboardStats, 'pendingCount' | 'volunteerCount' | 'plaqueCount' | 'ritualCount'>>({
    pendingCount: 0,
    volunteerCount: 0,
    plaqueCount: 0,
    ritualCount: 0,
  })
  const [recentRegistrations, setRecentRegistrations] = useState<DashboardRegistrationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) loadDashboardData()
  }, [token])

  const loadDashboardData = async () => {
    try {
      const data = await businessAPI.getStats(token!)
      setStats({
        pendingCount: data.pendingCount || 0,
        volunteerCount: data.volunteerCount || 0,
        plaqueCount: data.plaqueCount || 0,
        ritualCount: data.ritualCount || 0,
      })
      setRecentRegistrations(data.recentRegistrations || [])
    } catch (error) {
      console.error('加载工作台数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: '待审批登记', value: stats.pendingCount, hint: '线上提交后需要处理', color: 'bg-gold-pale' },
    { label: '信众与义工', value: stats.volunteerCount, hint: '人员档案与服务记录', color: 'bg-paper-dark' },
    { label: '牌位总数', value: stats.plaqueCount, hint: '延生、往生、超度', color: 'bg-vermilion-light' },
    { label: '法会场次', value: stats.ritualCount, hint: '法会与报名管理', color: 'bg-bamboo/10' },
  ]

  const quickActions = [
    { title: '处理登记审批', desc: '查看线上登记、通过或拒绝申请', href: '/admin/approvals' },
    { title: '新增牌位', desc: '录入延生、往生、超度牌位', href: '/admin/plaques' },
    { title: '维护信众档案', desc: '管理信众联系方式与历史记录', href: '/admin/devotees' },
    { title: '进入模板中心', desc: '统一选择打印入口、模板和预览流程', href: '/admin/print-center' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-vermilion border-t-transparent rounded-full" />
          <p className="mt-4 text-tea/60">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-ink">寺院管理工作台</h2>
        <p className="text-sm text-tea/60 mt-1">集中处理登记、信众、牌位、法会和模板打印等日常事务。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-5 ${stat.color}`}>
            <div className="text-2xl font-bold text-ink">{stat.value}</div>
            <div className="text-sm text-tea/80 mt-1 tracking-wide">{stat.label}</div>
            <div className="text-xs text-tea/50 mt-2">{stat.hint}</div>
          </div>
        ))}
      </div>

      <BuddhistCalendar />

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
        <section className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-ink">最近登记</h3>
            <Link href="/admin/approvals" className="text-sm text-vermilion hover:underline tracking-wide">
              查看全部
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <div className="text-center py-8 text-tea/60">暂无登记记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5F0E6] text-tea text-sm font-medium border-b border-[#E8E0D0]">
                    <th className="text-left py-3 px-4">姓名</th>
                    <th className="text-left py-3 px-4">类型</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">日期</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.slice(0, 8).map((item) => (
                    <tr key={item.id} className="border-b border-[#F5F0E6] hover:bg-[#F5F0E6]/50 transition-colors">
                      <td className="py-3 px-4 text-ink">{item.submitterName}</td>
                      <td className="py-3 px-4 text-tea">{taskTypeMap[item.taskType] || item.taskType}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusMap[item.status]?.variant || 'info'}>
                          {statusMap[item.status]?.label || item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-tea/70">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-classic border border-[#E8E0D0] p-6">
          <h3 className="text-lg font-medium text-ink mb-4">常用操作</h3>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded border border-[#E8E0D0] p-4 hover:border-vermilion hover:bg-paper transition-colors"
              >
                <div className="font-medium text-ink tracking-wide">{action.title}</div>
                <div className="text-sm text-tea/60 mt-1">{action.desc}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
