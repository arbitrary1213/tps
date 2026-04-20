'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI } from '@/lib/api'
import { Button, Card, Input, Select, Modal, Table } from '@/components/ui'
import {
  PlaqueTemplate,
  TemplateElement,
  TextStyle,
  createElement,
  DEFAULT_TEXT_STYLE,
  FIELD_DEFINITIONS,
  FONT_OPTIONS,
  ALIGN_OPTIONS,
  PLAQUE_TYPE_OPTIONS,
  FieldType,
} from '@/types/template'

export default function PlaqueTemplateDesigner() {
  const { token } = useAuthStore()
  const [templates, setTemplates] = useState<PlaqueTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<PlaqueTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null)
  const [showList, setShowList] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<string>('ALL')

  const canvasRef = useRef<HTMLDivElement>(null)
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const dragState = useRef<{ dragging: boolean; resizing: boolean; startX: number; startY: number; elementStart: { x: number; y: number; width: number; height: number } } | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])


  const loadTemplates = async () => {
    try {
      const data = await businessAPI.getPlaqueTemplates(token!)
      setTemplates(data)
    } catch (error) {
      console.error('加载模板失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!editName.trim()) {
      alert('请输入模板名称')
      return
    }
    try {
      const data = await businessAPI.createPlaqueTemplate(token!, {
        name: editName,
        type: editType,
        elements: [],
      })
      setTemplates([data, ...templates])
      setEditModalOpen(false)
      setEditName('')
      setEditType('ALL')
      setCurrentTemplate(data)
      setShowList(false)
    } catch (error) {
      console.error('创建模板失败:', error)
    }
  }

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return
    setSaving(true)
    try {
      await businessAPI.updatePlaqueTemplate(token!, currentTemplate.id, {
        name: currentTemplate.name,
        type: currentTemplate.type,
        backgroundImage: currentTemplate.backgroundImage,
        elements: currentTemplate.elements,
      })
      await loadTemplates()
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定要删除此模板吗？')) return
    try {
      await businessAPI.deletePlaqueTemplate(token!, id)
      setTemplates(templates.filter(t => t.id !== id))
      if (currentTemplate?.id === id) {
        setCurrentTemplate(null)
        setShowList(true)
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSelectTemplate = (template: PlaqueTemplate) => {
    setCurrentTemplate(template)
    setShowList(false)
    setSelectedElement(null)
  }

  const addElement = (type: TemplateElement['type']) => {
    if (!currentTemplate) return
    const el = createElement(type)
    if (type === 'text') {
      el.staticText = '双击编辑文本'
    }
    const newElements = [...currentTemplate.elements, el]
    setCurrentTemplate({ ...currentTemplate, elements: newElements })
    setSelectedElement(el)
  }

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    if (!currentTemplate) return
    const newElements = currentTemplate.elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    )
    setCurrentTemplate({ ...currentTemplate, elements: newElements })
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates })
    }
  }

  const updateElementStyle = (id: string, styleUpdates: Partial<TextStyle>) => {
    if (!currentTemplate) return
    const newElements = currentTemplate.elements.map(el =>
      el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
    )
    setCurrentTemplate({ ...currentTemplate, elements: newElements })
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, style: { ...selectedElement.style, ...styleUpdates } })
    }
  }

  const deleteElement = (id: string) => {
    if (!currentTemplate) return
    const newElements = currentTemplate.elements.filter(el => el.id !== id)
    setCurrentTemplate({ ...currentTemplate, elements: newElements })
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, el: TemplateElement) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return
    e.stopPropagation()
    setSelectedElement(el)

    const rect = elementRefs.current.get(el.id)?.getBoundingClientRect()
    if (!rect) return

    dragState.current = {
      dragging: true,
      resizing: false,
      startX: e.clientX,
      startY: e.clientY,
      elementStart: { x: el.x, y: el.y, width: el.width, height: el.height },
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current || !selectedElement) return

    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY

    if (dragState.current.dragging) {
      updateElement(selectedElement.id, {
        x: dragState.current.elementStart.x + dx,
        y: dragState.current.elementStart.y + dy,
      })
    }
  }, [selectedElement])

  const handleMouseUp = useCallback(() => {
    dragState.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleResizeStart = (e: React.MouseEvent, el: TemplateElement, direction: string) => {
    e.stopPropagation()
    const rect = elementRefs.current.get(el.id)?.getBoundingClientRect()
    if (!rect) return

    dragState.current = {
      dragging: false,
      resizing: true,
      startX: e.clientX,
      startY: e.clientY,
      elementStart: { x: el.x, y: el.y, width: el.width, height: el.height },
    }

    const handleResizeMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY

      let newWidth = dragState.current.elementStart.width
      let newHeight = dragState.current.elementStart.height
      let newX = dragState.current.elementStart.x
      let newY = dragState.current.elementStart.y

      if (direction.includes('e')) newWidth = Math.max(20, dragState.current.elementStart.width + dx)
      if (direction.includes('w')) { newWidth = Math.max(20, dragState.current.elementStart.width - dx); newX = dragState.current.elementStart.x + dx }
      if (direction.includes('s')) newHeight = Math.max(20, dragState.current.elementStart.height + dy)
      if (direction.includes('n')) { newHeight = Math.max(20, dragState.current.elementStart.height - dy); newY = dragState.current.elementStart.y + dy }

      updateElement(el.id, { x: newX, y: newY, width: newWidth, height: newHeight })
    }

    const handleResizeEnd = () => {
      dragState.current = null
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentTemplate) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const backgroundImage = ev.target?.result as string
      setCurrentTemplate({ ...currentTemplate, backgroundImage })
    }
    reader.readAsDataURL(file)
  }

  const renderElement = (el: TemplateElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      fontFamily: el.style.fontFamily,
      fontSize: el.style.fontSize,
      fontWeight: el.style.fontWeight ? 'bold' : 'normal',
      fontStyle: el.style.italic ? 'italic' : 'normal',
      color: el.style.color,
      textAlign: el.style.align,
      lineHeight: el.style.lineHeight,
      letterSpacing: el.style.letterSpacing,
      textDecoration: el.style.underline ? 'underline' : 'none',
      writingMode: el.style.vertical ? 'vertical-rl' : 'horizontal-tb',
      overflow: 'hidden',
      cursor: 'move',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: el.style.align === 'left' ? 'flex-start' : el.style.align === 'right' ? 'flex-end' : 'center',
    }

    const renderContent = () => {
      switch (el.type) {
        case 'text':
          return el.staticText || '文本'
        case 'field':
          return el.fieldLabel || '字段'
        case 'line':
          return null
        case 'rect':
          return null
        case 'image':
          return el.src ? <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null
        default:
          return null
      }
    }

    return (
      <div
        key={el.id}
        ref={(ref) => { if (ref) elementRefs.current.set(el.id, ref) }}
        style={{
          ...style,
          border: selectedElement?.id === el.id ? '2px solid #dc2626' : el.type === 'line' ? 'none' : '1px dashed #999',
          backgroundColor: el.type === 'rect' ? (el.fillColor || 'transparent') : 'transparent',
          borderColor: el.type === 'rect' ? (el.borderColor || '#000') : undefined,
          borderWidth: el.type === 'line' ? 0 : undefined,
          height: el.type === 'line' ? (el.height || 2) : style.height,
          borderTopWidth: el.type === 'line' ? (el.lineWidth || 1) : style.borderWidth,
          borderTopColor: el.type === 'line' ? (el.style.color || '#000') : undefined,
        }}
        onMouseDown={(e) => handleMouseDown(e, el)}
      >
        {renderContent()}
        {selectedElement?.id === el.id && !['line'].includes(el.type) && (
          <>
            <div className="resize-handle" style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, backgroundColor: '#dc2626', cursor: 'se-resize' }} onMouseDown={(e) => handleResizeStart(e, el, 'se')} />
            <div className="resize-handle" style={{ position: 'absolute', left: -4, bottom: -4, width: 8, height: 8, backgroundColor: '#dc2626', cursor: 'sw-resize' }} onMouseDown={(e) => handleResizeStart(e, el, 'sw')} />
            <div className="resize-handle" style={{ position: 'absolute', right: -4, top: -4, width: 8, height: 8, backgroundColor: '#dc2626', cursor: 'ne-resize' }} onMouseDown={(e) => handleResizeStart(e, el, 'ne')} />
            <div className="resize-handle" style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, backgroundColor: '#dc2626', cursor: 'nw-resize' }} onMouseDown={(e) => handleResizeStart(e, el, 'nw')} />
          </>
        )}
      </div>
    )
  }

  const getFieldOptions = (type: FieldType) => {
    const fields = FIELD_DEFINITIONS[type] || []
    return [
      { value: '', label: '选择字段' },
      ...fields.map(f => ({ value: f.key, label: f.label }))
    ]
  }

  const getFilteredFieldOptions = () => {
    const tplType = currentTemplate?.type as string || 'ALL'
    let fields: {key: string, label: string, type: string}[] = []
    if (tplType === 'ALL') {
      fields = Object.values(FIELD_DEFINITIONS).flat()
    } else if (['LONGEVITY', 'REBIRTH', 'DELIVERANCE'].includes(tplType)) {
      // Show template-specific fields + COMMON fields
      fields = [...((FIELD_DEFINITIONS as Record<string, typeof fields>)[tplType] || []), ...FIELD_DEFINITIONS.COMMON]
    } else {
      fields = Object.values(FIELD_DEFINITIONS).flat()
    }
    return [
      { value: '', label: '选择字段' },
      ...fields.map(f => ({ value: f.key, label: `${f.label} (${f.type})` }))
    ]
  }

  const renderFieldSelector = (el: TemplateElement, onChange: (key: string, label: string, type: FieldType) => void) => {
    const allFields = Object.values(FIELD_DEFINITIONS).flat()
    const selectedField = allFields.find(f => f.key === el.fieldKey)

    return (
      <Select
        label="绑定字段"
        value={el.fieldKey || ''}
        onChange={(e) => {
          const field = allFields.find(f => f.key === e.target.value)
          if (field) {
            onChange(field.key, field.label, (currentTemplate?.type || 'ALL') as FieldType)
          } else {
            onChange('', '', (currentTemplate?.type || 'ALL') as FieldType)
          }
        }}
        options={getFilteredFieldOptions()}
      />
    )
  }

  if (showList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-ink">牌位模板设计</h2>
            <p className="text-sm text-tea/60 mt-1">可视化设计牌位打印模板</p>
          </div>
          <Button onClick={() => { setEditName(''); setEditType('ALL'); setEditModalOpen(true); }}>
            新建模板
          </Button>
        </div>

        <Card>
          <Table
            columns={[
              { key: 'name', title: '模板名称' },
              { key: 'type', title: '类型', render: (row: PlaqueTemplate) => PLAQUE_TYPE_OPTIONS.find(t => t.value === row.type)?.label || row.type },
              { key: 'elements', title: '元素数量', render: (row: PlaqueTemplate) => row.elements?.length || 0 },
              { key: 'createdAt', title: '创建时间', render: (row: PlaqueTemplate) => new Date(row.createdAt).toLocaleDateString('zh-CN') },
              { key: 'actions', title: '操作', render: (row: PlaqueTemplate) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleSelectTemplate(row)}>编辑</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteTemplate(row.id)}>删除</Button>
                </div>
              )},
            ]}
            data={templates}
            loading={loading}
            emptyText="暂无模板，点击新建按钮创建"
          />
        </Card>

        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="新建模板">
          <div className="space-y-4">
            <Input
              label="模板名称"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="请输入模板名称"
            />
            <Select
              label="模板类型"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              options={PLAQUE_TYPE_OPTIONS}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>取消</Button>
              <Button onClick={handleCreateTemplate}>创建</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  if (!currentTemplate) {
    return <div>加载中...</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="h-14 bg-white border-b border-[#E8E0D0] px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setShowList(true); setCurrentTemplate(null); }}>
            返回列表
          </Button>
          <span className="text-lg font-medium text-ink">{currentTemplate.name}</span>
          <span className="text-sm text-tea/60">
            ({PLAQUE_TYPE_OPTIONS.find(t => t.value === currentTemplate.type)?.label})
          </span>
        </div>
        <Button onClick={handleSaveTemplate} loading={saving}>
          保存模板
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbox */}
        <div className="w-48 bg-white border-r border-[#E8E0D0] p-4 space-y-2">
          <p className="text-sm font-medium text-tea mb-2">工具箱</p>
          <button
            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded text-left"
            onClick={() => addElement('text')}
          >
            文本
          </button>
          <button
            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded text-left"
            onClick={() => addElement('field')}
          >
            动态字段
          </button>
          <button
            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded text-left"
            onClick={() => addElement('line')}
          >
            线条
          </button>
          <button
            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded text-left"
            onClick={() => addElement('rect')}
          >
            矩形
          </button>
          <button
            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded text-left"
            onClick={() => addElement('image')}
          >
            图片
          </button>

          <div className="border-t border-[#E8E0D0] pt-4 mt-4">
            <p className="text-sm font-medium text-tea mb-2">底图</p>
            <label className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded text-left cursor-pointer block">
              上传底图
              <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
            </label>
            {currentTemplate.backgroundImage && (
              <button
                className="w-full mt-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded"
                onClick={() => setCurrentTemplate({ ...currentTemplate, backgroundImage: undefined })}
              >
                移除底图
              </button>
            )}
            <p className="text-xs text-tea/50 mt-1">底图仅作设计参考，打印时不输出</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-gray-200">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg mx-auto"
            style={{
              width: 400,
              height: 600,
              backgroundImage: currentTemplate.backgroundImage ? `url(${currentTemplate.backgroundImage})` : undefined,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            onClick={() => setSelectedElement(null)}
          >
            {currentTemplate.elements.map(renderElement)}
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-72 bg-white border-l border-[#E8E0D0] p-4 overflow-y-auto">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">
                  {selectedElement.type === 'text' ? '文本' :
                   selectedElement.type === 'field' ? '动态字段' :
                   selectedElement.type === 'line' ? '线条' :
                   selectedElement.type === 'rect' ? '矩形' : '图片'}
                </p>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => deleteElement(selectedElement.id)}
                >
                  删除
                </button>
              </div>

              {selectedElement.type === 'text' && (
                <Input
                  label="文本内容"
                  value={selectedElement.staticText || ''}
                  onChange={(e) => updateElement(selectedElement.id, { staticText: e.target.value })}
                />
              )}

              {selectedElement.type === 'field' && (
                renderFieldSelector(selectedElement, (key, label, type) => {
                  updateElement(selectedElement.id, { fieldKey: key, fieldLabel: label, fieldType: type })
                })
              )}

              {selectedElement.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-tea mb-2">选择图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          updateElement(selectedElement.id, { src: ev.target?.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
              )}

              <div className="border-t border-[#E8E0D0] pt-4">
                <p className="text-sm font-medium text-tea mb-2">样式</p>
                <div className="space-y-3">
                  <Select
                    label="字体"
                    value={selectedElement.style.fontFamily}
                    onChange={(e) => updateElementStyle(selectedElement.id, { fontFamily: e.target.value })}
                    options={FONT_OPTIONS}
                  />
                  <div>
                    <label className="block text-sm text-tea mb-1">字号: {selectedElement.style.fontSize}px</label>
                    <input
                      type="range"
                      min="10"
                      max="72"
                      value={selectedElement.style.fontSize}
                      onChange={(e) => updateElementStyle(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <Select
                    label="对齐"
                    value={selectedElement.style.align}
                    onChange={(e) => updateElementStyle(selectedElement.id, { align: e.target.value as TextStyle['align'] })}
                    options={ALIGN_OPTIONS}
                  />
                  <div>
                    <label className="block text-sm text-tea mb-1">颜色</label>
                    <input
                      type="color"
                      value={selectedElement.style.color}
                      onChange={(e) => updateElementStyle(selectedElement.id, { color: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedElement.style.fontWeight}
                        onChange={(e) => updateElementStyle(selectedElement.id, { fontWeight: e.target.checked })}
                      />
                      <span className="text-sm">加粗</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedElement.style.italic}
                        onChange={(e) => updateElementStyle(selectedElement.id, { italic: e.target.checked })}
                      />
                      <span className="text-sm">斜体</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedElement.style.underline}
                        onChange={(e) => updateElementStyle(selectedElement.id, { underline: e.target.checked })}
                      />
                      <span className="text-sm">下划线</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedElement.style.vertical}
                      onChange={(e) => updateElementStyle(selectedElement.id, { vertical: e.target.checked })}
                    />
                    <span className="text-sm">竖排</span>
                  </label>
                  <div>
                    <label className="block text-sm text-tea mb-1">行高: {selectedElement.style.lineHeight}</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={selectedElement.style.lineHeight}
                      onChange={(e) => updateElementStyle(selectedElement.id, { lineHeight: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-tea mb-1">字间距: {selectedElement.style.letterSpacing}px</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={selectedElement.style.letterSpacing}
                      onChange={(e) => updateElementStyle(selectedElement.id, { letterSpacing: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {selectedElement.type === 'line' && (
                <div className="border-t border-[#E8E0D0] pt-4">
                  <div>
                    <label className="block text-sm text-tea mb-1">线条粗细: {selectedElement.lineWidth || 1}px</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedElement.lineWidth || 1}
                      onChange={(e) => updateElement(selectedElement.id, { lineWidth: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === 'rect' && (
                <div className="border-t border-[#E8E0D0] pt-4 space-y-3">
                  <div>
                    <label className="block text-sm text-tea mb-1">填充色</label>
                    <input
                      type="color"
                      value={selectedElement.fillColor || 'transparent'}
                      onChange={(e) => updateElement(selectedElement.id, { fillColor: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-tea mb-1">边框颜色</label>
                    <input
                      type="color"
                      value={selectedElement.borderColor || '#000000'}
                      onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-[#E8E0D0] pt-4">
                <p className="text-sm font-medium text-tea mb-2">位置和大小</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="X"
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                  />
                  <Input
                    label="Y"
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                  />
                  <Input
                    label="宽度"
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                  />
                  <Input
                    label="高度"
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-tea/50 py-12">
              点击画布中的元素编辑属性
            </div>
          )}
        </div>
      </div>
    </div>
  )
}