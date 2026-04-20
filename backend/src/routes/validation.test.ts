import { describe, it, expect } from 'vitest'
import {
  submitRequestSchema,
  volunteerFormSchema,
  plaqueFormSchema,
  lampFormSchema,
  accommodationFormSchema,
  diningFormSchema
} from './validation'

describe('Validation Schemas', () => {
  describe('submitRequestSchema', () => {
    it('should validate valid request', () => {
      const result = submitRequestSchema.safeParse({
        taskId: 'test-task-id',
        submitterName: '张三',
        submitterPhone: '13800138000',
        formData: { name: 'test' }
      })
      expect(result.success).toBe(true)
    })

    it('should fail with empty taskId', () => {
      const result = submitRequestSchema.safeParse({
        taskId: '',
        submitterName: '张三',
        submitterPhone: '13800138000'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('volunteerFormSchema', () => {
    it('should validate volunteer form with skills', () => {
      const result = volunteerFormSchema.safeParse({
        name: '李四',
        phone: '13900139000',
        skills: ['摄影', '驾驶']
      })
      expect(result.success).toBe(true)
    })

    it('should validate empty volunteer form', () => {
      const result = volunteerFormSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('plaqueFormSchema', () => {
    it('should validate longevity plaque', () => {
      const result = plaqueFormSchema.safeParse({
        plaqueType: 'LONGEVITY',
        holderName: '王五',
        zodiac: '龙'
      })
      expect(result.success).toBe(true)
    })

    it('should validate rebirth plaque', () => {
      const result = plaqueFormSchema.safeParse({
        plaqueType: 'REBIRTH',
        deceasedName: '亡者',
        yangShang: '阳上人'
      })
      expect(result.success).toBe(true)
    })

    it('should validate deliverance plaque', () => {
      const result = plaqueFormSchema.safeParse({
        plaqueType: 'DELIVERANCE',
        dedicationType: '冤亲债主'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('lampFormSchema', () => {
    it('should validate lamp offering', () => {
      const result = lampFormSchema.safeParse({
        lampType: '莲花灯',
        location: '一楼',
        blessingName: '祈福人'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('accommodationFormSchema', () => {
    it('should validate accommodation', () => {
      const result = accommodationFormSchema.safeParse({
        name: '住客',
        phone: '13700137000',
        accommodationType: '住宿',
        checkInDate: '2024-01-01'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid accommodation type', () => {
      const result = accommodationFormSchema.safeParse({
        accommodationType: 'INVALID_TYPE'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('diningFormSchema', () => {
    it('should validate dining reservation', () => {
      const result = diningFormSchema.safeParse({
        mealType: 'LUNCH',
        date: '2024-01-01',
        mealCount: 5
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid meal type', () => {
      const result = diningFormSchema.safeParse({
        mealType: 'INVALID_MEAL'
      })
      expect(result.success).toBe(false)
    })
  })
})