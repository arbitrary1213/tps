'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Empty, Loading } from '@/components/ui'
import { businessAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { PlaqueTemplate } from '@/types/template'

type TemplateElements = PlaqueTemplate['elements'] & {
  source?: string
  template?: {
    id?: string
    name?: string
    mode?: string
    dataGroup?: string
    width?: number
    height?: number
  }
  layout?: {
    background?: string
    paper?: {
      width?: number
      height?: number
    }
  }
}

const typeLabels: Record<string, string> = {
  LONGEVITY: '延生',
  REBIRTH: '往生',
  DELIVERANCE: '超度',
  ALL: '通用',
}

function templateElements(template: PlaqueTemplate): TemplateElements {
  return (template.elements || {}) as TemplateElements
}

function templateMode(template: PlaqueTemplate) {
  const elements = templateElements(template)
  if (elements.template?.mode === 'summary') return '通名/汇总'
  if (template.repeatRegion?.enabled) return '多格套打'
  return '单张'
}

function templateSource(template: PlaqueTemplate) {
  const elements = templateElements(template)
  return elements.source === 'tablet-print' ? '新版打印工具' : '旧模板结构'
}

function templateHasBackground(template: PlaqueTemplate) {
  const elements = templateElements(template)
  return Boolean(template.backgroundImage || elements.layout?.background)
}

function templateSize(template: PlaqueTemplate) {
  const elements = templateElements(template)
  const width = elements.layout?.paper?.width || elements.template?.width || template.paperWidth
  const height = elements.layout?.paper?.height || elements.template?.height || template.paperHeight
  return `${width || '-'} x ${height || '-'} mm`
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PlaqueTemplatesPage() {
  const { token } = useAuthStore()
  const [templates, setTemplates] = useState<PlaqueTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    businessAPI.getPlaqueTemplates(token, { preferRemote: true })
      .then((data) => {
        if (!cancelled) setTemplates(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '模板读取失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) return <Loading text="正在读取服务器模板..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">模板库</h2>
          <p className="text-sm text-tea/60 mt-1">
            这里显示服务器已保存的模板。浏览器本地草稿和桌面缓存不算服务器模板。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/print-api/designer.html"
            className="inline-flex items-center justify-center rounded bg-vermilion px-6 py-2.5 text-sm font-medium tracking-wider text-white shadow-classic hover:bg-vermilion-dark"
          >
            新建/设计模板
          </Link>
          <Link
            href="/admin/print-center"
            className="inline-flex items-center justify-center rounded border border-vermilion px-6 py-2.5 text-sm font-medium tracking-wider text-vermilion hover:bg-vermilion-light"
          >
            返回模板中心
          </Link>
        </div>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 text-sm text-tea/70 md:grid-cols-3">
          <div>
            <div className="font-medium text-ink">服务器主库</div>
            <div className="mt-1">模板保存成功后会出现在这里。</div>
          </div>
          <div>
            <div className="font-medium text-ink">桌面本地缓存</div>
            <div className="mt-1">桌面端同步后用于离线预览和打印。</div>
          </div>
          <div>
            <div className="font-medium text-ink">浏览器本地配置</div>
            <div className="mt-1">只表示当前浏览器有草稿，不等于服务器已保存。</div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && templates.length === 0 ? (
        <Empty title="服务器还没有模板" description="进入模板设计后保存，模板会同步到服务器并显示在这里。" />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {templates.map((template) => {
            const elements = templateElements(template)
            const designerUrl = `/print-api/designer.html?templateId=${encodeURIComponent(template.id)}`
            return (
              <Card key={template.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-[#E8E0D0] bg-paper">
                    {templateHasBackground(template) ? (
                      <img
                        src={template.backgroundImage || elements.layout?.background}
                        alt={`${template.name}底图`}
                        className="h-full w-full object-contain bg-white"
                      />
                    ) : (
                      <div className="text-xs text-tea/50">无底图</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-medium text-ink">{template.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge>{typeLabels[template.type] || template.type}</Badge>
                          <Badge variant="gray">{templateMode(template)}</Badge>
                          <Badge variant={templateHasBackground(template) ? 'success' : 'warning'}>
                            {templateHasBackground(template) ? '有底图' : '无底图'}
                          </Badge>
                          <Badge variant="success">服务器已保存</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(designerUrl, '_blank')}
                      >
                        打开设计
                      </Button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-tea/70 sm:grid-cols-2">
                      <div>来源：{templateSource(template)}</div>
                      <div>尺寸：{templateSize(template)}</div>
                      <div>修改：{formatDate(template.updatedAt)}</div>
                      <div>编号：{template.id}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
