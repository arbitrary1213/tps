import { redirect } from 'next/navigation'

export default async function PlaqueTemplateStandalonePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) || {}
  const query = new URLSearchParams()

  Object.entries(resolved).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) query.append(key, item)
      })
      return
    }
    if (value) query.set(key, value)
  })

  redirect(query.toString() ? `/print-api/index.html?${query.toString()}` : '/print-api/index.html')
}
