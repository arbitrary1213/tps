'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Button } from '@/components/ui'
import { PlaqueTemplate, TemplateElement, PlaqueType } from '@/types/template'
import { systemAPI } from '@/lib/api'

interface Plaque {
  id: string
  plaqueType: string
  holderName?: string
  deceasedName?: string
  deceasedName2?: string
  gender?: string
  birthDate?: string
  deathDate?: string
  yangShang?: string
  dedicationType?: string
  longevitySubtype?: string
  blessingText?: string
  startDate: string
  endDate: string
}

interface Props {
  plaque: Plaque
  template: PlaqueTemplate | null
  open: boolean
  onClose: () => void
}

export function PlaquePrintPreview({ plaque, template, open, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await systemAPI.getSettings()
      setSettings(data)
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const getFieldValue = (fieldKey: string): string => {
    switch (fieldKey) {
      case 'holderName':
        return plaque.holderName || ''
      case 'deceasedName':
        return plaque.deceasedName || ''
      case 'deceasedName2':
        return plaque.deceasedName2 || ''
      case 'gender':
        return plaque.gender || ''
      case 'birthDate':
        return plaque.birthDate || ''
      case 'deathDate':
        return plaque.deathDate || ''
      case 'yangShang':
        return plaque.yangShang || ''
      case 'dedicationType':
        return plaque.dedicationType || ''
      case 'longevitySubtype':
        return plaque.longevitySubtype || ''
      case 'blessingText':
        return plaque.blessingText || ''
      case 'templeName':
        return settings?.templeName || '仙顶寺'
      case 'plaqueTypeLabel':
        return getPlaqueTypeLabel(plaque.plaqueType as PlaqueType)
      case 'startDate':
        return plaque.startDate ? new Date(plaque.startDate).toLocaleDateString('zh-CN') : ''
      case 'endDate':
        return plaque.endDate ? new Date(plaque.endDate).toLocaleDateString('zh-CN') : ''
      case 'serialNo':
        return plaque.id.slice(-8).toUpperCase()
      default:
        return ''
    }
  }

  const getPlaqueTypeLabel = (type: PlaqueType): string => {
    const labels: Record<PlaqueType, string> = {
      LONGEVITY: '延生禄位',
      REBIRTH: '往生莲位',
      DELIVERANCE: '超度牌位',
    }
    return labels[type] || type
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: el.style.align === 'left' ? 'flex-start' : el.style.align === 'right' ? 'flex-end' : 'center',
    }

    switch (el.type) {
      case 'text':
        return <div style={style}>{el.staticText}</div>
      case 'field':
        return <div style={style}>{getFieldValue(el.fieldKey || '')}</div>
      case 'line':
        return (
          <div style={{
            position: 'absolute',
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.lineWidth || 1,
            backgroundColor: el.style.color,
          }} />
        )
      case 'rect':
        return (
          <div style={{
            position: 'absolute',
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            backgroundColor: el.fillColor || 'transparent',
            borderColor: el.borderColor || '#000',
            borderWidth: 1,
            borderStyle: 'solid',
          }} />
        )
      case 'image':
        return el.src ? (
          <img
            src={el.src}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              objectFit: 'contain',
            }}
          />
        ) : null
      default:
        return null
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>牌位打印</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div style="width: 400px; height: 600px; position: relative; background: white;">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Modal open={open} onClose={onClose} title="牌位预览" size="lg">
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <div
            ref={printRef}
            className="relative mx-auto bg-white"
            style={{ width: 400, height: 600 }}
          >
            {template?.elements?.map((el) => renderElement(el))}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>关闭</Button>
          <Button onClick={handlePrint}>打印</Button>
        </div>
      </div>
    </Modal>
  )
}