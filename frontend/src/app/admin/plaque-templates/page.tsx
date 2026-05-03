'use client'

export default function PlaqueTemplatePage() {
  return (
    <div className="-m-4 h-[calc(100vh-3.5rem)] bg-white sm:-m-6 sm:h-[calc(100vh-4rem)]">
      <iframe
        title="牌位套打"
        src="/print-api/"
        className="h-full w-full border-0"
      />
    </div>
  )
}
