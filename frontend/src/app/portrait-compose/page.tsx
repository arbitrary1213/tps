'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function PortraitComposePage() {
  const baseInputRef = useRef<HTMLInputElement>(null)
  const portraitInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [baseUrl, setBaseUrl] = useState<string | null>(null)
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(50)
  const [offsetY, setOffsetY] = useState(40)
  const [scale, setScale] = useState(35)
  const [error, setError] = useState('')
  const [previewReady, setPreviewReady] = useState(false)

  const readFile = (file: File | undefined, setter: (url: string) => void) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件（JPG / PNG / WEBP）')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('图片请控制在 12MB 以内')
      return
    }
    setError('')
    setter(URL.createObjectURL(file))
  }

  const renderCompose = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !baseUrl || !portraitUrl) {
      setPreviewReady(false)
      return
    }

    try {
      const [base, portrait] = await Promise.all([loadImage(baseUrl), loadImage(portraitUrl)])
      const maxW = 900
      const ratio = Math.min(1, maxW / base.naturalWidth)
      canvas.width = Math.round(base.naturalWidth * ratio)
      canvas.height = Math.round(base.naturalHeight * ratio)

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height)

      const portraitW = (canvas.width * scale) / 100
      const portraitH = (portrait.naturalHeight / portrait.naturalWidth) * portraitW
      const x = (canvas.width * offsetX) / 100 - portraitW / 2
      const y = (canvas.height * offsetY) / 100 - portraitH / 2

      ctx.save()
      ctx.beginPath()
      const rx = portraitW / 2
      const ry = portraitH / 2
      ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(portrait, x, y, portraitW, portraitH)
      ctx.restore()

      setPreviewReady(true)
    } catch {
      setError('合成预览失败，请换图重试')
      setPreviewReady(false)
    }
  }, [baseUrl, portraitUrl, offsetX, offsetY, scale])

  useEffect(() => {
    renderCompose()
  }, [renderCompose])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas || !previewReady) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/jpeg', 0.92)
    a.download = `人像合成-${Date.now()}.jpg`
    a.click()
  }

  const reset = () => {
    setBaseUrl(null)
    setPortraitUrl(null)
    setOffsetX(50)
    setOffsetY(40)
    setScale(35)
    setPreviewReady(false)
    setError('')
    if (baseInputRef.current) baseInputRef.current.value = ''
    if (portraitInputRef.current) portraitInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      <header className="px-6 py-5 border-b border-[#E8E0D0]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-tea hover:text-vermilion text-sm tracking-wide">
            ← 返回首页
          </Link>
          <span className="font-serif text-ink tracking-widest">仙顶寺</span>
        </div>
      </header>

      <main className="flex-1 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-widest text-center mb-3">
            人像合成
          </h1>
          <p className="text-center text-tea/70 text-sm sm:text-base mb-10 tracking-wide">
            将人像融入底图，调整位置与大小后导出合影
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => baseInputRef.current?.click()}
              className="rounded-xl border border-[#E8E0D0] bg-white px-5 py-8 text-left transition-all hover:border-vermilion hover:-translate-y-0.5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div className="text-ink font-medium tracking-wide mb-1">底图照片</div>
              <div className="text-tea/50 text-sm">{baseUrl ? '已选择，点击可更换' : '点击上传全家福 / 场景照'}</div>
              <input
                ref={baseInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readFile(e.target.files?.[0], setBaseUrl)}
              />
            </button>
            <button
              type="button"
              onClick={() => portraitInputRef.current?.click()}
              className="rounded-xl border border-[#E8E0D0] bg-white px-5 py-8 text-left transition-all hover:border-vermilion hover:-translate-y-0.5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div className="text-ink font-medium tracking-wide mb-1">人像照片</div>
              <div className="text-tea/50 text-sm">{portraitUrl ? '已选择，点击可更换' : '点击上传需要合成的人像'}</div>
              <input
                ref={portraitInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readFile(e.target.files?.[0], setPortraitUrl)}
              />
            </button>
          </div>

          {baseUrl && portraitUrl && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E8E0D0] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-4 py-2 text-sm text-tea/70 border-b border-[#F0EDE8] tracking-wide">合成预览</div>
                <div className="p-4 bg-[#F5F0E6] flex justify-center">
                  <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8E0D0] p-5 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <label className="block text-sm text-tea">
                  <span className="tracking-wide">水平位置 {offsetX}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                    className="mt-2 w-full accent-vermilion"
                  />
                </label>
                <label className="block text-sm text-tea">
                  <span className="tracking-wide">垂直位置 {offsetY}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    className="mt-2 w-full accent-vermilion"
                  />
                </label>
                <label className="block text-sm text-tea">
                  <span className="tracking-wide">人像大小 {scale}%</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="mt-2 w-full accent-vermilion"
                  />
                </label>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={download}
                  disabled={!previewReady}
                  className="bg-vermilion text-white px-8 py-3 rounded-lg text-sm font-medium tracking-wider hover:bg-vermilion-dark disabled:opacity-50"
                >
                  下载合成图
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="border border-[#E8E0D0] text-tea px-8 py-3 rounded-lg text-sm font-medium tracking-wider hover:border-vermilion hover:text-vermilion bg-white"
                >
                  重新开始
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-6 text-center text-vermilion text-sm">{error}</p>
          )}
        </div>
      </main>

      <footer className="py-6" style={{ backgroundColor: '#F0EDE8' }}>
        <div className="text-center text-gray-500 text-sm tracking-wide">
          <p>浙江省湖州市吴兴区栖贤山仙顶禅寺</p>
        </div>
      </footer>
    </div>
  )
}
