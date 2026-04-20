'use client'

export function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="inline-block animate-spin h-10 w-10 border-4 border-vermilion border-t-transparent rounded-full" />
      <p className="mt-4 text-tea/60">{text}</p>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin h-12 w-12 border-4 border-vermilion border-t-transparent rounded-full" />
        <p className="mt-4 text-tea/60">页面加载中...</p>
      </div>
    </div>
  )
}