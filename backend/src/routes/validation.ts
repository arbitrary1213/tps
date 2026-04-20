import { z } from 'zod'

export const submitRequestSchema = z.object({
  taskId: z.string().min(1, '任务ID不能为空'),
  submitterName: z.string().optional(),
  submitterPhone: z.string().optional(),
  formData: z.record(z.any()).optional(),
})

export const approveRequestSchema = z.object({
  approvedById: z.string().optional(),
})

const baseFields = {
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
}

const plaqueFields = {
  plaqueType: z.enum(['LONGEVITY', 'REBIRTH', 'DELIVERANCE']).optional(),
  holderName: z.string().optional(),
  deceasedName: z.string().optional(),
  gender: z.string().optional(),
  zodiac: z.string().optional(),
  birthDate: z.string().optional(),
  birthLunar: z.array(z.string()).optional(),
  deathDate: z.string().optional(),
  deathLunar: z.array(z.string()).optional(),
  yangShang: z.string().optional(),
  dedicationType: z.string().optional(),
  longevitySubtype: z.string().optional(),
  size: z.string().optional(),
  blessingText: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}

export const volunteerFormSchema = z.object({
  ...baseFields,
  skills: z.array(z.string()).optional(),
})

export const plaqueFormSchema = z.object({
  ...plaqueFields,
  deceasedName2: z.string().optional(),
  birthDate2: z.string().optional(),
  deathDate2: z.string().optional(),
  zodiac2: z.string().optional(),
  gender2: z.string().optional(),
})

export const lampFormSchema = z.object({
  lampType: z.string().optional(),
  location: z.string().optional(),
  blessingName: z.string().optional(),
  blessingType: z.string().optional(),
  amount: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const ritualFormSchema = z.object({
  ritualId: z.string().optional(),
  ...baseFields,
})

export const accommodationFormSchema = z.object({
  ...baseFields,
  roomId: z.string().optional(),
  accommodationType: z.enum(['挂单', '住宿', '朝山']).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
})

export const diningFormSchema = z.object({
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'RITUAL']).optional(),
  date: z.string().optional(),
  mealCount: z.number().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
})

export type SubmitRequestInput = z.infer<typeof submitRequestSchema>
