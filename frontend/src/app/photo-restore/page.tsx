'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function enhanceImage(source: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = source.naturalWidth
  canvas.height = source.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return source.src

  ctx.drawImage(source, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const contrast = 1.18
  const brightness = 12
  const mid = 128

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r = (r - mid) * contrast + mid + brightness
    g = (g - mid) * contrast + mid + brightness
    b = (b - mid) * contrast + mid + brightness

    // Soft color lift for faded prints
    r = r * 1.04 + 4
    g = g * 1.02 + 2
    b = b * 0.98

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}

export default function PhotoRestorePage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [original, setOriginal] = useState<string | null>(null)
  const [restored, setRestored] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(async (file: File | undefined) => {
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
    setProcessing(true)
    setRestored(null)

    try {
      const url = URL.createObjectURL(file)
      setOriginal(url)
      const img = await loadImage(url)
      const result = enhanceImage(img)
      setRestored(result)
    } catch {
      setError('处理失败，请换一张照片重试')
    } finally {
      setProcessing(false)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  const download = () => {
    if (!restored) return
    const a = document.createElement('a')
    a.href = restored
    a.download = `老照片修复-${Date.now()}.jpg`
    a.click()
  }

  const reset = () => {
    setOriginal(null)
    setRestored(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
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
            老照片修复
          </h1>
          <p className="text-center text-tea/70 text-sm sm:text-base mb-10 tracking-wide">
            上传泛黄、褪色的旧照，一键提升清晰度与色彩
          </p>

          {!original ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer rounded-xl border border-dashed border-[#D4C8B0] bg-white px-6 py-16 text-center transition-all hover:border-vermilion hover:-translate-y-0.5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <p className="text-ink font-medium mb-2 tracking-wide">点击或拖拽上传照片</p>
              <p className="text-tea/50 text-sm">支持 JPG、PNG、WEBP，最大 12MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <figure className="bg-white rounded-xl border border-[#E8E0D0] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="px-4 py-2 text-sm text-tea/70 border-b border-[#F0EDE8] tracking-wide">原图</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={original} alt="原图" className="w-full object-contain max-h-80 bg-[#F5F0E6]" />
                </figure>
                <figure className="bg-white rounded-xl border border-[#E8E0D0] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="px-4 py-2 text-sm text-tea/70 border-b border-[#F0EDE8] tracking-wide">修复后</div>
                  {processing || !restored ? (
                    <div className="h-80 flex items-center justify-center text-tea/50 text-sm bg-[#F5F0E6]">
                      正在修复...
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={restored} alt="修复后" className="w-full object-contain max-h-80 bg-[#F5F0E6]" />
                  )}
                </figure>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={download}
                  disabled={!restored || processing}
                  className="bg-vermilion text-white px-8 py-3 rounded-lg text-sm font-medium tracking-wider hover:bg-vermilion-dark disabled:opacity-50"
                >
                  下载修复图
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="border border-[#E8E0D0] text-tea px-8 py-3 rounded-lg text-sm font-medium tracking-wider hover:border-vermilion hover:text-vermilion bg-white"
                >
                  换一张
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
