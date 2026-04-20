import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export interface SearchParams {
  q?: string
  status?: string
  type?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface SearchResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface VolunteerSearchResult {
  id: string
  name: string
  dharmaName: string | null
  phone: string
  address: string | null
  status: string
  rank: string
  gender: string | null
  createdAt: Date
  relevanceScore: number
}

export interface DevoteeSearchResult {
  id: string
  name: string
  phone: string
  address: string | null
  level: string
  wechat: string | null
  email: string | null
  createdAt: Date
  relevanceScore: number
}

export interface PlaqueSearchResult {
  id: string
  plaqueType: string
  holderName: string | null
  deceasedName: string | null
  yangShang: string | null
  phone: string | null
  address: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  relevanceScore: number
}

export interface RequestSearchResult {
  id: string
  submitterName: string
  submitterPhone: string
  taskType: string
  status: string
  formData: Prisma.JsonValue
  createdAt: Date
  relevanceScore: number
}

const calculateRelevanceScore = (item: any, searchTerm: string): number => {
  if (!searchTerm) return 1
  const term = searchTerm.toLowerCase()
  let score = 0

  const name = (item.name || item.submitterName || item.holderName || '').toLowerCase()
  const phone = (item.phone || item.submitterPhone || '').toLowerCase()
  const address = (item.address || '').toLowerCase()
  const yangShang = (item.yangShang || '').toLowerCase()
  const dharmaName = (item.dharmaName || '').toLowerCase()

  if (name === term) score += 50
  else if (name.startsWith(term)) score += 30
  else if (name.includes(term)) score += 20

  if (phone === term) score += 40
  else if (phone.includes(term)) score += 20

  if (dharmaName.includes(term)) score += 15
  if (yangShang.includes(term)) score += 15
  if (address.includes(term)) score += 10

  return score
}

const buildTextSearchFilter = (searchTerm: string): Prisma.VolunteerWhereInput => {
  const term = searchTerm.trim()
  if (!term) return {}

  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { dharmaName: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } },
      { emergencyContact: { contains: term, mode: 'insensitive' } },
      { emergencyPhone: { contains: term, mode: 'insensitive' } },
      { currentOccupation: { contains: term, mode: 'insensitive' } },
      { previousOccupation: { contains: term, mode: 'insensitive' } },
      { skills: { has: term } },
      { volunteerProjects: { has: term } }
    ]
  }
}

const buildDevoteeSearchFilter = (searchTerm: string): Prisma.DevoteeWhereInput => {
  const term = searchTerm.trim()
  if (!term) return {}

  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { wechat: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } },
      { idCard: { contains: term, mode: 'insensitive' } },
      { zodiac: { contains: term, mode: 'insensitive' } }
    ]
  }
}

const buildPlaqueSearchFilter = (searchTerm: string, plaqueType?: string): Prisma.MemorialPlaqueWhereInput => {
  const term = searchTerm.trim()
  const baseFilter: Prisma.MemorialPlaqueWhereInput = {}

  if (plaqueType) {
    baseFilter.plaqueType = plaqueType
  }

  if (!term) return baseFilter

  return {
    ...baseFilter,
    OR: [
      { holderName: { contains: term, mode: 'insensitive' } },
      { deceasedName: { contains: term, mode: 'insensitive' } },
      { yangShang: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { address: { contains: term, mode: 'insensitive' } },
      { dedicationType: { contains: term, mode: 'insensitive' } },
      { zodiac: { contains: term, mode: 'insensitive' } },
      { zodiac2: { contains: term, mode: 'insensitive' } }
    ]
  }
}

const buildRequestSearchFilter = (searchTerm: string, status?: string): Prisma.RegistrationRequestWhereInput => {
  const term = searchTerm.trim()
  const baseFilter: Prisma.RegistrationRequestWhereInput = {}

  if (status) {
    baseFilter.status = status
  }

  if (!term) return baseFilter

  return {
    ...baseFilter,
    OR: [
      { submitterName: { contains: term, mode: 'insensitive' } },
      { submitterPhone: { contains: term, mode: 'insensitive' } },
      { taskType: { contains: term, mode: 'insensitive' } },
      { rejectReason: { contains: term, mode: 'insensitive' } }
    ]
  }
}

export async function searchVolunteers(params: SearchParams): Promise<SearchResult<VolunteerSearchResult>> {
  const { q, status, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.VolunteerWhereInput = {
    ...buildTextSearchFilter(q || ''),
    ...(status ? { status } : {})
  }

  const [volunteers, total] = await Promise.all([
    prisma.volunteer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.volunteer.count({ where })
  ])

  const list: VolunteerSearchResult[] = volunteers.map(v => ({
    ...v,
    relevanceScore: calculateRelevanceScore(v, q || '')
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function searchDevotees(params: SearchParams): Promise<SearchResult<DevoteeSearchResult>> {
  const { q, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where = buildDevoteeSearchFilter(q || '')

  const [devotees, total] = await Promise.all([
    prisma.devotee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.devotee.count({ where })
  ])

  const list: DevoteeSearchResult[] = devotees.map(d => ({
    ...d,
    relevanceScore: calculateRelevanceScore(d, q || '')
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function searchPlaques(params: SearchParams): Promise<SearchResult<PlaqueSearchResult>> {
  const { q, type, status, startDate, endDate, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.MemorialPlaqueWhereInput = {
    ...buildPlaqueSearchFilter(q || '', type),
    ...(status ? { status } : {}),
    ...(startDate || endDate ? {
      startDate: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {})
      }
    } : {})
  }

  const [plaques, total] = await Promise.all([
    prisma.memorialPlaque.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.memorialPlaque.count({ where })
  ])

  const list: PlaqueSearchResult[] = plaques.map(p => ({
    ...p,
    relevanceScore: calculateRelevanceScore(p, q || '')
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function searchRequests(params: SearchParams): Promise<SearchResult<RequestSearchResult>> {
  const { q, status, startDate, endDate, page = 1, pageSize = 20 } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.RegistrationRequestWhereInput = {
    ...buildRequestSearchFilter(q || '', status),
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {})
      }
    } : {})
  }

  const [requests, total] = await Promise.all([
    prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.registrationRequest.count({ where })
  ])

  const list: RequestSearchResult[] = requests.map(r => ({
    ...r,
    relevanceScore: calculateRelevanceScore(r, q || '')
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}
