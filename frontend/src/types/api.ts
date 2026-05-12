export interface ApiUser {
  id: string
  username: string
  email?: string
  name?: string
  role: string
}

export interface DashboardRegistrationItem {
  id: string
  taskType: string
  status: string
  submitterName: string
  createdAt: string
}

export interface DashboardStats {
  pendingCount: number
  volunteerCount: number
  plaqueCount: number
  ritualCount: number
  recentRegistrations: DashboardRegistrationItem[]
}

export interface RegistrationTaskRecord {
  id: string
  name: string
  taskType: string
  description: string
  enabled: boolean
  formConfig: string[]
  sort?: number
  createdAt: string
}

export interface RegistrationRequestRecord {
  id: string
  taskId: string
  taskType: string
  status: string
  submitterName: string
  submitterPhone: string
  formData: Record<string, unknown>
  rejectReason?: string
  approvedAt?: string
  createdAt: string
  task?: { name: string }
}

export interface RegistrationRequestList {
  list: RegistrationRequestRecord[]
  total?: number
  page?: number
  pageSize?: number
}

export interface DevoteeRecord {
  id: string
  name: string
  phone: string
  wechat?: string
  email?: string
  idCard?: string
  birthday?: string
  zodiac?: string
  address?: string
  tags: string[]
  totalDonation: number
  firstVisitDate?: string
  lastVisitDate?: string
  remarks?: string
  createdAt: string
}

export interface RitualRecord {
  id: string
  name: string
  ritualType: string
  description?: string
  ritualDate: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  fee: number
  registrationDeadline?: string
  allowOnlineRegistration: boolean
  status: string
  createdAt: string
}

export interface PlaqueRecord {
  id: string
  plaqueType: string
  longevitySubtype?: string
  size?: string
  holderName?: string
  deceasedName?: string
  gender?: string
  birthDate?: string
  birthLunar: boolean
  deathDate?: string
  deathLunar: boolean
  deceasedName2?: string
  birthDate2?: string
  birthLunar2?: boolean
  deathDate2?: string
  deathLunar2?: boolean
  yangShang?: string
  phone?: string
  address?: string
  dedicationType?: string
  blessingText?: string
  startDate: string
  endDate: string
  status: string
  remarks?: string
  templateId?: string
  devoteeId?: string
  ritualId?: string
  createdAt: string
}

export interface PrintJobRecord {
  id: string
  jobNo: string
  status: string
  sourceType?: string
  totalCount: number
  printedCount?: number
  failedCount?: number
  printClientId?: string | null
  templateId?: string | null
  templateName?: string | null
  createdAt?: string
}

export interface PrintClientRecord {
  id: string
  name: string
  clientCode: string
  status: string
  defaultPrinter?: string | null
}

export interface UserRecord {
  id: string
  username: string
  name?: string
  email?: string
  role: string
  createdAt: string
}

export interface OperationLogRecord {
  id: string
  userId: string
  username: string
  action: string
  targetType: string
  targetId: string
  beforeValue?: Record<string, unknown> | null
  afterValue?: Record<string, unknown> | null
  createdAt: string
}

export interface OperationLogList {
  list: OperationLogRecord[]
  total: number
  page: number
  pageSize: number
}

export interface SystemSettingsRecord {
  templeName: string
  templeAddress: string
  templePhone: string
  templeLogo: string
  wechatQrcode: string
  dedicationTypes: string
}
