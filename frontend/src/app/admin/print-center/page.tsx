'use client'

import Link from 'next/link'
import { Card } from '@/components/ui'

const actions = [
  {
    title: '从牌位管理打印',
    desc: '适合打印单个牌位或已选中的牌位。先在牌位管理页筛选和勾选，再进入模板预览和打印。',
    href: '/admin/plaques',
  },
  {
    title: '打开打印工具',
    desc: '适合导入表格、粘贴 Excel 数据，或在网页端直接读取系统牌位数据后打印。',
    href: '/print-api/',
  },
  {
    title: '模板库',
    desc: '查看服务器已保存的模板、底图状态、单张/通名类型和最近修改时间。',
    href: '/admin/plaque-templates',
  },
  {
    title: '旧批量打印页',
    desc: '这是历史入口，仍可使用，但后续会逐步并入统一打印流程。',
    href: '/admin/plaques/batch-print',
  },
]

export default function PrintCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-ink">模板中心</h2>
        <p className="text-sm text-tea/60 mt-1">
          先确定数据来源，再选模板，再预览，再选择打印机。不要在多个入口之间来回切换。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card hover className="h-full">
              <div className="space-y-2">
                <div className="text-lg font-medium text-ink tracking-wide">{action.title}</div>
                <p className="text-sm text-tea/70 leading-6">{action.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <div className="space-y-2">
          <div className="text-base font-medium text-ink">推荐流程</div>
          <p className="text-sm text-tea/70 leading-6">
            牌位已在系统里：去“牌位管理”筛选并打印。临时表格数据：去“打开打印工具”导入后打印。需要确认模板是否上传：先看“模板库”，再进入设计器调整。
          </p>
        </div>
      </Card>
    </div>
  )
}
