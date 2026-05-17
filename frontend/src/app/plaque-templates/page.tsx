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

  if (resolved.designer === '1' || resolved.desktopWindow === 'template-designer') {
    query.delete('designer')
    query.delete('desktopWindow')
    redirect(query.toString() ? `/print-api/designer.html?${query.toString()}` : '/print-api/designer.html')
  }
  redirect(query.toString() ? `/print-api/index.html?${query.toString()}` : '/print-api/index.html')
}
