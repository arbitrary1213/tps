'use client'

interface LoadingOverlayProps {
  fullScreen?: boolean
  text?: string
}

export function LoadingOverlay({ fullScreen = false, text = '加载中...' }: LoadingOverlayProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="animate-spin h-10 w-10 border-4 border-vermilion border-t-transparent rounded-full" />
      <p className="text-tea/70 text-sm">{text}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      {spinner}
    </div>
  )
}

interface PageSkeletonProps {
  rows?: number
}

export function PageSkeleton({ rows = 5 }: PageSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-[#F5F0E6] rounded animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-lg border border-[#E8E0D0] animate-pulse">
            <div className="flex items-center gap-4 p-4">
              <div className="h-4 w-24 bg-[#F5F0E6] rounded animate-pulse" />
              <div className="h-4 flex-1 bg-[#F5F0E6] rounded animate-pulse" />
              <div className="h-4 w-20 bg-[#F5F0E6] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}