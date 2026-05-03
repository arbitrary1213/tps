'use client'

import { useSearchParams } from 'next/navigation'

export default function PlaqueTemplatePage() {
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const src = query ? `/print-api/?${query}` : '/print-api/'

  return (
    <div className="-m-4 h-[calc(100vh-3.5rem)] bg-white sm:-m-6 sm:h-[calc(100vh-4rem)]">
      <iframe
        title="牌位套打"
        src={src}
        className="h-full w-full border-0"
      />
    </div>
  )
}
