import { describe, expect, it } from 'vitest'
import { isDevoteePhoneConflict, pickDevoteeWriteData } from './business/people'

describe('pickDevoteeWriteData', () => {
  it('keeps only allowed devotee fields', () => {
    expect(pickDevoteeWriteData({
      name: ' 张三 ',
      phone: ' 13800138000 ',
      birthday: '1990-01-15',
      birthLunar: false,
      tags: ['常客', ' 义工 ', '', 123],
      totalDonation: 999,
      level: 'SVIP',
      createdBy: 'hacker',
    })).toEqual({
      name: '张三',
      phone: '13800138000',
      birthday: '1990-01-15',
      birthLunar: false,
      tags: ['常客', '义工'],
    })
  })

  it('defaults tags to empty array and preserves lunar birthday text', () => {
    expect(pickDevoteeWriteData({
      name: '李四',
      phone: '13800138001',
      birthday: '一九九零年正月初一',
      birthLunar: true,
      tags: null,
      remarks: ' 常来寺院 ',
    })).toEqual({
      name: '李四',
      phone: '13800138001',
      birthday: '一九九零年正月初一',
      birthLunar: true,
      tags: [],
      remarks: '常来寺院',
    })
  })
})

describe('isDevoteePhoneConflict', () => {
  it('returns true for devotee phone unique conflicts', () => {
    expect(isDevoteePhoneConflict({
      code: 'P2002',
      meta: { target: ['phone'] },
    })).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isDevoteePhoneConflict({ code: 'P2002', meta: { target: ['email'] } })).toBe(false)
    expect(isDevoteePhoneConflict(new Error('boom'))).toBe(false)
  })
})
