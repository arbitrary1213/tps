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
  code?: string
  plaqueType: string
  longevitySubtype?: string
  size?: string
  holderName?: string
  deceasedName?: string
  gender?: string
  zodiac?: string
  age?: string
  message?: string
  birthDate?: string
  birthLunar: boolean
  deathDate?: string
  deathLunar: boolean
  yinGeng?: string
  deceasedName2?: string
  yinGeng2?: string
  birthDate2?: string
  birthLunar2?: boolean
  deathDate2?: string
  deathLunar2?: boolean
  yangShang?: string
  phone?: string
  address?: string
  dedicationType?: string
  customDedicationType?: string
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
  printClientId?: string
  templateId?: string
  templateName?: string
  createdAt?: string
}

export interface PrintClientRecord {
  id: string
  name: string
  clientCode: string
  status: string
  defaultPrinter?: string
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
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
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
  accessPassword?: string | null
}

// ============================================
// 人员管理
// ============================================

export interface MonkRecord {
  id: string
  dharmaName: string
  name?: string
  gender?: string
  birthDate?: string
  origin?: string
  ordinationDate?: string
  ordinationType?: string
  rank: number
  position?: string
  hallId?: string
  phone?: string
  idCard?: string
  photo?: string
  status: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface VolunteerRecord {
  id: string
  name: string
  dharmaName?: string
  gender?: string
  birthDate?: string
  photo?: string
  ethnicity?: string
  education?: string
  phone: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  currentOccupation?: string
  previousOccupation?: string
  healthStatus?: string
  hasInfectiousDisease?: string
  diseaseHistory?: string
  hasAllergy?: string
  allergyHistory?: string
  hasSpecialNeeds?: string
  specialNeedsDetail?: string
  firstContactBuddhism?: string
  hasTakenRefuge?: string
  refugeTime?: string
  preceptsHeld: string[]
  willingToLearn?: string
  guidanceHope?: string
  hasVolunteerExperience?: string
  volunteerTimes: number
  lastVolunteerDate?: string
  lastVolunteerLocation?: string
  lastVolunteerContent?: string
  skills: string[]
  volunteerProjects: string[]
  serviceStartDate?: string
  serviceEndDate?: string
  serviceDuration?: string
  commitment?: string
  signature?: string
  totalHours: number
  rank: string
  status: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface VolunteerTaskRecord {
  id: string
  name: string
  description?: string
  taskType: string
  location?: string
  taskDate?: string
  startTime?: string
  endTime?: string
  requiredCount: number
  currentCount: number
  status: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  _count?: { signups: number }
}

export interface VolunteerSignupRecord {
  id: string
  taskId: string
  volunteerId?: string
  volunteerName: string
  volunteerPhone: string
  status: string
  checkInTime?: string
  checkOutTime?: string
  serviceHours: number
  createdAt: string
  updatedAt: string
}

// ============================================
// 佛事管理
// ============================================

export interface RitualParticipantRecord {
  id: string
  ritualId: string
  name: string
  phone: string
  checkedIn: boolean
  checkInTime?: string
  createdAt: string
  updatedAt: string
}

export interface HallRecord {
  id: string
  name: string
  location?: string
  description?: string
  capacity: number
  openTime?: string
  status: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface LampOfferingRecord {
  id: string
  name: string
  phone: string
  lampType: string
  location?: string
  duration: number
  blessingName?: string
  blessingType?: string
  blessingContent?: string
  amount: number
  startDate: string
  endDate: string
  status: string
  createdAt: string
  updatedAt: string
}

// ============================================
// 财务管理
// ============================================

export interface DonationRecord {
  id: string
  devoteeId?: string
  donorName: string
  donorPhone?: string
  type: string
  amount: number
  paymentMethod?: string
  donationDate: string
  receiptNumber?: string
  operator?: string
  remarks?: string
  createdAt: string
  updatedAt: string
  devotee?: { id: string; name: string; phone: string }
}

export interface WarehouseItemRecord {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  price: number
  location?: string
  supplier?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface WarehouseInRecord {
  id: string
  itemId: string
  quantity: number
  price?: number
  supplier?: string
  operator?: string
  inDate: string
  remarks?: string
  createdAt: string
}

export interface WarehouseOutRecord {
  id: string
  itemId: string
  quantity: number
  purpose?: string
  operator?: string
  outDate: string
  remarks?: string
  createdAt: string
}

// ============================================
// 后勤管理
// ============================================

export interface RoomRecord {
  id: string
  roomNumber: string
  type: string
  floor?: string
  location?: string
  capacity: number
  price: number
  status: string
  facilities: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface AccommodationItem {
  id: string
  roomId: string
  guestName: string
  guestPhone: string
  guestIdCard?: string
  accommodationType: string
  checkInDate: string
  checkOutDate?: string
  deposit: number
  totalFee: number
  status: string
  operator?: string
  remarks?: string
  createdAt: string
  updatedAt: string
  room?: RoomRecord
}

export interface DiningReservationItem {
  id: string
  mealType: string
  date: string
  mealCount: number
  contactName: string
  contactPhone: string
  amount: number
  paymentStatus: string
  remarks?: string
  operator?: string
  createdAt: string
  updatedAt: string
}

export interface VisitItem {
  id: string
  visitorName: string
  visitorPhone: string
  visitorType: string
  groupName?: string
  groupSize: number
  visitDate: string
  visitTime?: string
  visitPurpose?: string
  visitedPerson?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// 微信集成
// ============================================

export interface WechatIntegrationRecord {
  id: string
  templeCode: string
  templeName?: string
  serverUrl?: string
  authorizerAppId?: string
  authorizerNickName?: string
  status: string
  syncToken: string
  boundAt?: string
  createdAt: string
  updatedAt: string
}

export interface WechatMessageItem {
  id: string
  integrationId: string
  authorizerAppId?: string
  openId?: string
  direction: string
  msgType: string
  eventType?: string
  content?: string
  rawPayload?: unknown
  aiSuggestion?: string
  status: string
  repliedAt?: string
  createdAt: string
  updatedAt: string
}

export interface WechatArticleRecord {
  id: string
  integrationId: string
  authorizerAppId?: string
  title: string
  author?: string
  digest?: string
  content: string
  thumbMediaId?: string
  remoteDraftId?: string
  remotePublishId?: string
  status: string
  lastError?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface WechatTemplateMessageRecord {
  id: string
  integrationId: string
  authorizerAppId?: string
  openId: string
  businessType: string
  templateId?: string
  title?: string
  payload?: unknown
  status: string
  remoteMsgId?: string
  errorMessage?: string
  sentAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// Query parameter types
// ============================================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface MonkQueryParams {
  status?: string
  position?: string
}

export interface VolunteerQueryParams {
  status?: string
  rank?: string
  keyword?: string
}

export interface VolunteerTaskQueryParams {
  status?: string
  taskDate?: string
}

export interface DevoteeQueryParams {
  keyword?: string
  tag?: string
  updatedSince?: string
}

export interface PlaqueQueryParams {
  plaqueType?: string
  status?: string
  keyword?: string
  ritualId?: string
}

export interface RitualQueryParams {
  status?: string
  ritualType?: string
}

export interface LampOfferingQueryParams {
  status?: string
}

export interface DonationQueryParams {
  type?: string
  startDate?: string
  endDate?: string
}

export interface WarehouseItemQueryParams {
  category?: string
}

export interface VisitQueryParams {
  visitorType?: string
  startDate?: string
  endDate?: string
}

export interface PrintJobQueryParams {
  status?: string
  clientId?: string
}

export interface LogQueryParams {
  action?: string
  targetType?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface BatchUpdatePlaquesResult {
  success: boolean
  data?: { updated: number; failed: number }
}

export interface PlaqueImportResult {
  success: boolean
  data?: { total: number; imported: number; skipped: number; errors: string[] }
}

export interface WechatAuthUrlResult {
  configured: boolean
  authUrl: string
  templeCode: string
  message: string
}

// ============================================
// API response wrappers (for POST/PUT/DELETE)
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
