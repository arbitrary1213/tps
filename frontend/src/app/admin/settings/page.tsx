'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { systemAPI } from '@/lib/api'
import { Button, Card, Input, Textarea, Modal } from '@/components/ui'

interface Settings {
  templeName: string
  templeAddress: string
  templePhone: string
  templeLogo: string
  wechatQrcode: string
  dedicationTypes: string
}

export default function SettingsPage() {
  const { token } = useAuthStore()
  const [settings, setSettings] = useState<Settings>({
    templeName: '仙顶寺',
    templeAddress: '',
    templePhone: '',
    templeLogo: '',
    wechatQrcode: '',
    dedicationTypes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 超度类型管理
  const [dedicationTypes, setDedicationTypes] = useState<string[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<string>('')
  const [editingIndex, setEditingIndex] = useState<number>(-1)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await systemAPI.getSettings()
      if (data) {
        setSettings(data)
        if (data.dedicationTypes) {
          setDedicationTypes(data.dedicationTypes.split(',').filter(Boolean))
        } else {
          setDedicationTypes(['冤亲债主', '堕胎婴灵', '历代宗亲', '新建地基主', '地基主'])
        }
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      await systemAPI.updateSettings(token!, {
        ...settings,
        dedicationTypes: dedicationTypes.join(',')
      })
      alert('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 超度类型管理
  const handleAddType = () => {
    setEditingType('')
    setEditingIndex(-1)
    setEditModalOpen(true)
  }

  const handleEditType = (index: number, type: string) => {
    setEditingType(type)
    setEditingIndex(index)
    setEditModalOpen(true)
  }

  const handleSaveType = () => {
    if (!editingType.trim()) return
    
    const newTypes = [...dedicationTypes]
    if (editingIndex >= 0) {
      newTypes[editingIndex] = editingType.trim()
    } else {
      newTypes.push(editingType.trim())
    }
    setDedicationTypes(newTypes)
    setEditModalOpen(false)
    
    // 自动保存
    saveDedicationTypes(newTypes)
  }

  const handleDeleteType = (index: number) => {
    if (!confirm('确定要删除这个超度类型吗？')) return
    const newTypes = dedicationTypes.filter((_, i) => i !== index)
    setDedicationTypes(newTypes)
    saveDedicationTypes(newTypes)
  }

  const saveDedicationTypes = async (types: string[]) => {
    try {
      await systemAPI.updateSettings(token!, {
        dedicationTypes: types.join(',')
      })
    } catch (error) {
      console.error('保存超度类型失败:', error)
    }
  }

  // 图片上传处理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSettings({ ...settings, wechatQrcode: ev.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-tea/60">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">系统设置</h2>
          <p className="text-sm text-tea/60 mt-1">配置寺院基本信息和联系方式</p>
        </div>
        <Button onClick={handleSubmit} loading={saving}>
          保存设置
        </Button>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="border-b border-[#E8E0D0] pb-4">
            <h3 className="text-lg font-medium text-ink mb-4">寺院信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="寺院名称"
                value={settings.templeName}
                onChange={(e) => setSettings({ ...settings, templeName: e.target.value })}
              />
              <Input
                label="联系电话"
                value={settings.templePhone}
                onChange={(e) => setSettings({ ...settings, templePhone: e.target.value })}
              />
              <div className="col-span-2">
                <Input
                  label="地址"
                  value={settings.templeAddress}
                  onChange={(e) => setSettings({ ...settings, templeAddress: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-ink mb-4">公众号设置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-tea mb-2">微信公众号二维码</label>
                <div 
                  className="border-2 border-dashed border-[#E8E0D0] rounded-lg p-4 text-center cursor-pointer hover:border-vermilion transition-colors relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {settings.wechatQrcode ? (
                    <div className="relative inline-block">
                      <img src={settings.wechatQrcode} alt="微信公众号二维码" className="max-h-32 mx-auto" />
                      <div className="mt-2 text-sm text-tea/60">点击更换图片</div>
                    </div>
                  ) : (
                    <div className="text-tea/40 py-8">
                      <div className="text-4xl mb-2">+</div>
                      <div className="text-sm">点击上传二维码图片</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                {settings.wechatQrcode && (
                  <button
                    onClick={() => setSettings({ ...settings, wechatQrcode: '' })}
                    className="mt-2 text-sm text-vermilion hover:text-vermilion-dark"
                  >
                    移除图片
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 超度类型管理 */}
          <div className="border-t border-[#E8E0D0] pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-ink">超度类型预设</h3>
              <Button size="sm" onClick={handleAddType}>+ 新增类型</Button>
            </div>
            <p className="text-sm text-tea/60 mb-4">管理超度牌位中可选的超度类型预设</p>
            
            <div className="space-y-2">
              {dedicationTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-paper rounded border border-[#E8E0D0]">
                  <span className="text-ink">{type}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditType(index, type)}
                      className="text-sm text-vermilion hover:text-vermilion-dark"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteType(index)}
                      className="text-sm text-tea/60 hover:text-vermilion"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              {dedicationTypes.length === 0 && (
                <div className="text-center text-tea/50 py-4">暂无超度类型，请点击"新增类型"添加</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 编辑/新增弹窗 */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingIndex >= 0 ? '编辑超度类型' : '新增超度类型'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="超度类型名称"
            value={editingType}
            onChange={(e) => setEditingType(e.target.value)}
            placeholder="请输入超度类型名称"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveType}>保存</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
