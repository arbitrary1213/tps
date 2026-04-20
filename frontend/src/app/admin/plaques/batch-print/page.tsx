'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Table, Select, Input, Checkbox } from '@/components/ui'
import { PlaqueTemplate, TemplateElement } from '@/types/template'

interface Plaque {
  id: string
  plaqueType: string
  holderName?: string
  deceasedName?: string
  dedicationType?: string
  yangShang?: string
  address?: string
  startDate: string
  endDate: string
  templateId?: string
}

const paperSizes = [
  { value: 'A4', label: 'A4 (210×297mm)', width: 210, height: 297 },
  { value: 'A3', label: 'A3 (297×420mm)', width: 297, height: 420 },
  { value: 'A5', label: 'A5 (148×210mm)', width: 148, height: 210 },
  { value: 'CUSTOM', label: '自定义尺寸', width: 0, height: 0 },
]

export default function BatchPrintPage() {
  const { token } = useAuthStore()
  const [plaques, setPlaques] = useState<Plaque[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [paperSize, setPaperSize] = useState('A4')
  const [customWidth, setCustomWidth] = useState(210)
  const [customHeight, setCustomHeight] = useState(297)
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(4)
  const [printType, setPrintType] = useState<'LONGEVITY' | 'REBIRTH' | 'DELIVERANCE' | 'ALL'>('ALL')

  const [templates, setTemplates] = useState<PlaqueTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const [layoutDirection, setLayoutDirection] = useState<'vertical' | 'horizontal'>('vertical')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center')
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('bold')
  const [fontSize, setFontSize] = useState<number>(12)
  const [horizontalAlign, setHorizontalAlign] = useState<'start' | 'center' | 'end' | 'space-between' | 'space-around'>('center')
  const [verticalAlign, setVerticalAlign] = useState<'start' | 'center' | 'end' | 'space-between' | 'space-around'>('center')
  const [autoScale, setAutoScale] = useState<boolean>(true)
  const [minFontSize, setMinFontSize] = useState<number>(12)
  const [autoColumnWidth, setAutoColumnWidth] = useState<boolean>(false)

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPlaques()
    loadTemplates()
  }, [])

  const loadPlaques = async () => {
    try {
      const params: any = { status: 'ACTIVE' }
      if (printType !== 'ALL') params.plaqueType = printType
      const data = await businessAPI.getPlaques(token!, params)
      setPlaques(data)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    loadPlaques()
  }, [printType])

  const filteredPlaques = plaques.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      p.holderName?.toLowerCase().includes(s) ||
      p.deceasedName?.toLowerCase().includes(s) ||
      p.yangShang?.toLowerCase().includes(s) ||
      p.dedicationType?.toLowerCase().includes(s) ||
      p.address?.toLowerCase().includes(s)
    )
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPlaques.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  const getTemplate = (plaque: Plaque): PlaqueTemplate | undefined => {
    if (selectedTemplate) {
      return templates.find(t => t.id === selectedTemplate)
    }
    if (plaque.templateId) {
      return templates.find(t => t.id === plaque.templateId)
    }
    return templates.find(t => t.type === plaque.plaqueType) || templates.find(t => t.type === 'ALL')
  }

  const getPaperDimensions = () => {
    if (paperSize === 'CUSTOM') {
      return { width: customWidth, height: customHeight }
    }
    const paper = paperSizes.find(p => p.value === paperSize)
    return paper ? { width: paper.width, height: paper.height } : { width: 210, height: 297 }
  }

  const measureTextWidth = (text: string, fontSize: number, fontWeight: string, fontFamily: string = '宋体'): number => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return text.length * fontSize * 0.6
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    return ctx.measureText(text).width
  }

  const getAutoScaledFontSize = (text: string, containerWidth: number, containerHeight: number, isVertical: boolean, baseFontSize: number, fontWeight: string) => {
    if (!autoScale) return baseFontSize

    const charWidth = measureTextWidth(text, baseFontSize, fontWeight)
    const effectiveWidth = isVertical ? containerHeight : containerWidth
    const effectiveHeight = isVertical ? containerWidth : containerHeight

    const charHeight = baseFontSize * 1.2
    const charsPerLine = Math.floor(effectiveWidth / charWidth)
    const linesNeeded = Math.ceil(text.length / charsPerLine)

    if (linesNeeded * charHeight > effectiveHeight * 0.9) {
      const scaleDown = (effectiveHeight * 0.9) / (linesNeeded * charHeight)
      return Math.max(minFontSize, Math.floor(baseFontSize * scaleDown))
    }

    if (charWidth > effectiveWidth * 0.9) {
      const scaleDown = (effectiveWidth * 0.9) / charWidth
      return Math.max(minFontSize, Math.floor(baseFontSize * scaleDown))
    }

    return baseFontSize
  }

  const calculateOptimalColumnWidth = () => {
    if (!autoColumnWidth || selectedPlaques.length === 0) return 120

    let maxTextLength = 0
    selectedPlaques.forEach(plaque => {
      const name = plaque.holderName || plaque.deceasedName || plaque.dedicationType || ''
      if (name.length > maxTextLength) maxTextLength = name.length
      if (plaque.yangShang && plaque.yangShang.length > maxTextLength) {
        maxTextLength = plaque.yangShang.length
      }
    })

    const avgCharWidth = 14
    const minWidth = maxTextLength * avgCharWidth + 40
    return Math.max(120, Math.min(250, minWidth))
  }

  const optimalColumnWidth = calculateOptimalColumnWidth()

  const renderPlaqueContent = (plaque: Plaque) => {
    const template = getTemplate(plaque)
    if (!template) {
      return renderSimpleContent(plaque)
    }

    return (
      <div className="relative w-full h-full">
        {template.elements.map((el: TemplateElement) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${(el.x / 400) * 100}%`,
            top: `${(el.y / 600) * 100}%`,
            width: `${(el.width / 400) * 100}%`,
            height: `${(el.height / 600) * 100}%`,
            fontFamily: el.style.fontFamily,
            fontSize: el.style.fontSize * 0.5,
            fontWeight: el.style.fontWeight ? 'bold' : 'normal',
            fontStyle: el.style.italic ? 'italic' : 'normal',
            color: el.style.color,
            textAlign: el.style.align,
            lineHeight: el.style.lineHeight,
            letterSpacing: el.style.letterSpacing,
            textDecoration: el.style.underline ? 'underline' : 'none',
            writingMode: el.style.vertical ? 'vertical-rl' : 'horizontal-tb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: el.style.align === 'left' ? 'flex-start' : el.style.align === 'right' ? 'flex-end' : 'center',
            overflow: 'hidden',
          }

          if (el.type === 'text') {
            return <div style={style}>{el.staticText}</div>
          }

          if (el.type === 'field') {
            let value = ''
            switch (el.fieldKey) {
              case 'holderName': value = plaque.holderName || ''; break
              case 'deceasedName': value = plaque.deceasedName || ''; break
              case 'dedicationType': value = plaque.dedicationType || ''; break
              case 'yangShang': value = plaque.yangShang || ''; break
              case 'address': value = plaque.address || ''; break
              case 'plaqueTypeLabel':
                const labels: Record<string, string> = { LONGEVITY: '延生禄位', REBIRTH: '往生莲位', DELIVERANCE: '超度牌位' }
                value = labels[plaque.plaqueType] || plaque.plaqueType
                break
              default: value = ''
            }
            return <div style={style}>{value}</div>
          }

          return null
        })}
      </div>
    )
  }

  const renderSimpleContent = (plaque: Plaque) => {
    const getName = () => {
      if (plaque.plaqueType === 'LONGEVITY') return plaque.holderName || ''
      if (plaque.plaqueType === 'REBIRTH') return plaque.deceasedName || ''
      if (plaque.plaqueType === 'DELIVERANCE') return plaque.dedicationType || ''
      return ''
    }

    const labels: Record<string, string> = {
      LONGEVITY: '延生禄位',
      REBIRTH: '往生莲位',
      DELIVERANCE: '超度牌位'
    }

    const isVertical = layoutDirection === 'vertical'

    const plaqueContainerWidth = 120
    const plaqueContainerHeight = 180

    const nameText = getName()
    const yangShangText = plaque.yangShang ? `${plaque.yangShang} 荐` : ''

    const scaledNameSize = getAutoScaledFontSize(
      nameText,
      plaqueContainerWidth,
      plaqueContainerHeight,
      isVertical,
      fontSize,
      fontWeight
    )

    const scaledYangSize = yangShangText ? getAutoScaledFontSize(
      yangShangText,
      plaqueContainerWidth,
      plaqueContainerHeight,
      isVertical,
      Math.floor(fontSize * 0.8),
      fontWeight
    ) : fontSize * 0.8

    const mainAxis = isVertical ? 'column' : 'row'

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: mainAxis,
      alignItems: isVertical ? horizontalAlign : (textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'),
      justifyContent: isVertical ? (textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center') : verticalAlign,
      height: '100%',
      width: '100%',
      gap: '2px',
      writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
      textAlign: textAlign,
      fontWeight: fontWeight,
      fontSize: `${fontSize}px`,
      padding: '4px',
      overflow: 'hidden',
    }

    const textStyle: React.CSSProperties = {
      fontSize: `${scaledNameSize}px`,
      fontWeight: fontWeight,
      color: '#000',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }

    const labelStyle: React.CSSProperties = {
      fontSize: `${Math.min(scaledNameSize * 0.75, scaledYangSize)}px`,
      color: '#666',
      fontWeight: fontWeight,
      whiteSpace: 'nowrap',
    }

    return (
      <div style={containerStyle}>
        <div style={labelStyle}>{labels[plaque.plaqueType]}</div>
        {plaque.plaqueType === 'DELIVERANCE' && (
          <div style={labelStyle}>佛力超荐</div>
        )}
        <div style={textStyle}>{getName()}</div>
        {plaque.yangShang && (
          <>
            <div style={labelStyle}>阳上</div>
            <div style={{ ...labelStyle, fontSize: `${scaledYangSize}px` }}>{plaque.yangShang} 荐</div>
          </>
        )}
      </div>
    )
  }

  const selectedPlaques = plaques.filter(p => selectedIds.has(p.id))

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const paper = getPaperDimensions()

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>批量打印</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { padding: 20px; }
            @media print {
              body { padding: 0; }
              @page {
                size: ${paperSize};
                margin: 0;
              }
            }
            .print-page {
              width: ${paper.width}mm;
              height: ${paper.height}mm;
              display: grid;
              grid-template-columns: ${autoColumnWidth
                ? `repeat(${cols}, ${optimalColumnWidth}px)`
                : `repeat(${cols}, 1fr)`};
              grid-template-rows: repeat(${rows}, 1fr);
              gap: 0;
              page-break-after: always;
              border: 1px solid #ccc;
            }
            .plaque-item {
              border: 1px solid #999;
              position: relative;
              overflow: hidden;
            }
            .plaque-content {
              width: 100%;
              height: 100%;
              transform: scale(0.5);
              transform-origin: top left;
              width: 200%;
              height: 200%;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const columns = [
    {
      key: 'select',
      title: <input type="checkbox" checked={selectedIds.size === filteredPlaques.length && filteredPlaques.length > 0} onChange={(e) => handleSelectAll(e.target.checked)} />,
      render: (row: Plaque) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => handleSelectOne(row.id, e.target.checked)}
        />
      ),
    },
    { key: 'plaqueType', title: '类型', render: (row: Plaque) => (
      <span className="text-xs">{row.plaqueType === 'LONGEVITY' ? '延生禄位' : row.plaqueType === 'REBIRTH' ? '往生莲位' : '超度牌位'}</span>
    )},
    { key: 'name', title: '姓名', render: (row: Plaque) => row.holderName || row.deceasedName || '-' },
    { key: 'dedicationType', title: '超度类型', render: (row: Plaque) => row.dedicationType || '-' },
    { key: 'yangShang', title: '阳上', render: (row: Plaque) => row.yangShang || '-' },
    { key: 'address', title: '地址', render: (row: Plaque) => row.address ? <span className="text-xs truncate max-w-[200px] block">{row.address}</span> : '-' },
  ]

  const totalSlots = cols * rows
  const pages = Math.ceil(selectedPlaques.length / totalSlots)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">批量打印</h2>
          <p className="text-sm text-tea/60 mt-1">选择牌位并批量打印</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.history.back()}>
            返回
          </Button>
          <Button onClick={handlePrint} disabled={selectedIds.size === 0}>
            打印 ({selectedIds.size} 张)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <div className="flex flex-wrap gap-4 mb-4">
              <Input
                placeholder="搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
              <Select
                value={printType}
                onChange={(e) => setPrintType(e.target.value as any)}
                options={[
                  { value: 'ALL', label: '全部类型' },
                  { value: 'LONGEVITY', label: '延生禄位' },
                  { value: 'REBIRTH', label: '往生莲位' },
                  { value: 'DELIVERANCE', label: '超度牌位' },
                ]}
              />
              <div className="text-sm text-tea/60 flex items-center">
                已选择: {selectedIds.size} / {plaques.length}
              </div>
            </div>
            <Table
              columns={columns}
              data={filteredPlaques}
              loading={loading}
              emptyText="暂无牌位"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-medium text-ink mb-4">打印设置</h3>
            <div className="space-y-4">
              <Select
                label="纸张大小"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                options={paperSizes.map(p => ({ value: p.value, label: p.label }))}
              />
              {paperSize === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    label="宽度(mm)"
                    type="number"
                    min={50}
                    max={500}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Math.max(50, Math.min(500, parseInt(e.target.value) || 210)))}
                  />
                  <Input
                    label="高度(mm)"
                    type="number"
                    min={50}
                    max={500}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Math.max(50, Math.min(500, parseInt(e.target.value) || 297)))}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="列数"
                  type="number"
                  min={1}
                  max={10}
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                />
                <Input
                  label="行数"
                  type="number"
                  min={1}
                  max={10}
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                />
              </div>
              <Select
                label="模板 (可选)"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                options={[
                  { value: '', label: '使用默认模板' },
                  ...templates.map(t => ({ value: t.id, label: t.name }))
                ]}
              />
              <div className="border-t border-[#E8E0D0] pt-4 mt-4">
                <p className="text-sm font-medium text-tea mb-3">排版设置</p>
                <div className="space-y-3">
                  <Select
                    label="文字方向"
                    value={layoutDirection}
                    onChange={(e) => setLayoutDirection(e.target.value as 'vertical' | 'horizontal')}
                    options={[
                      { value: 'vertical', label: '竖排' },
                      { value: 'horizontal', label: '横排' },
                    ]}
                  />
                  <Select
                    label="对齐方式"
                    value={textAlign}
                    onChange={(e) => setTextAlign(e.target.value as 'left' | 'center' | 'right')}
                    options={[
                      { value: 'left', label: '左对齐' },
                      { value: 'center', label: '居中' },
                      { value: 'right', label: '右对齐' },
                    ]}
                  />
                  <div>
                    <label className="block text-sm text-tea mb-1">字号: {fontSize}px</label>
                    <input
                      type="range"
                      min={8}
                      max={24}
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={fontWeight === 'bold'}
                        onChange={(e) => setFontWeight(e.target.checked ? 'bold' : 'normal')}
                      />
                      <span className="text-sm">加粗</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoScale}
                        onChange={(e) => setAutoScale(e.target.checked)}
                      />
                      <span className="text-sm">自动缩小</span>
                    </label>
                  </div>
                  {autoScale && (
                    <div>
                      <label className="block text-sm text-tea mb-1">最小字号: {minFontSize}px</label>
                      <input
                        type="range"
                        min={10}
                        max={16}
                        value={minFontSize}
                        onChange={(e) => setMinFontSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 mt-3">
                    <input
                      type="checkbox"
                      checked={autoColumnWidth}
                      onChange={(e) => setAutoColumnWidth(e.target.checked)}
                    />
                    <span className="text-sm">自适应列宽</span>
                  </label>
                  <p className="text-xs text-tea/50 mt-1">自动根据内容调整列宽</p>
                  <Select
                    label="水平分布"
                    value={horizontalAlign}
                    onChange={(e) => setHorizontalAlign(e.target.value as any)}
                    options={[
                      { value: 'start', label: '靠左/上' },
                      { value: 'center', label: '居中' },
                      { value: 'end', label: '靠右/下' },
                      { value: 'space-between', label: '两端对齐' },
                      { value: 'space-around', label: '等距分布' },
                    ]}
                  />
                  <Select
                    label="垂直分布"
                    value={verticalAlign}
                    onChange={(e) => setVerticalAlign(e.target.value as any)}
                    options={[
                      { value: 'start', label: '靠上/左' },
                      { value: 'center', label: '居中' },
                      { value: 'end', label: '靠下/右' },
                      { value: 'space-between', label: '两端对齐' },
                      { value: 'space-around', label: '等距分布' },
                    ]}
                  />
                </div>
              </div>
              <div className="text-sm text-tea/60 mt-4">
                <p>每页 {cols} × {rows} = {totalSlots} 张</p>
                <p>共 {selectedPlaques.length} 张，需要 {pages} 页</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-medium text-ink mb-2">预览</h3>
            <div
              className="border rounded bg-gray-100 p-2 overflow-hidden"
              style={{
                aspectRatio: `${getPaperDimensions().width}/${getPaperDimensions().height}`
              }}
            >
              <div
                className="w-full h-full grid gap-px bg-gray-400"
                style={{
                  gridTemplateColumns: autoColumnWidth
                    ? `repeat(${cols}, ${optimalColumnWidth}px)`
                    : `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
                {Array.from({ length: Math.min(totalSlots, selectedPlaques.length) }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white flex items-center justify-center text-xs p-1 overflow-hidden"
                    style={{
                      writingMode: layoutDirection === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
                      textAlign: textAlign,
                    }}
                  >
                    <span className="truncate" style={{ fontWeight: fontWeight, fontSize: `${Math.max(10, fontSize * 0.7)}px` }}>
                      {selectedPlaques[i]?.holderName || selectedPlaques[i]?.deceasedName || selectedPlaques[i]?.dedicationType || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="hidden">
        <div
          ref={printRef}
          className="print-container"
        >
          {Array.from({ length: pages }).map((_, pageIndex) => (
            <div
              key={pageIndex}
              className="print-page"
              style={{
                display: 'grid',
                gridTemplateColumns: autoColumnWidth
                  ? `repeat(${cols}, ${optimalColumnWidth}px)`
                  : `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
              }}
            >
              {Array.from({ length: totalSlots }).map((_, slotIndex) => {
                const plaqueIndex = pageIndex * totalSlots + slotIndex
                const plaque = selectedPlaques[plaqueIndex]
                if (!plaque) {
                  return <div key={slotIndex} className="plaque-item" />
                }
                return (
                  <div key={slotIndex} className="plaque-item">
                    <div className="plaque-content">
                      {renderPlaqueContent(plaque)}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}