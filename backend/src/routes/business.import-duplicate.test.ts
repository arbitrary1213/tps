import { describe, expect, it } from 'vitest'
import { buildPlaqueImportDuplicateKey } from './business.normalize'

describe('buildPlaqueImportDuplicateKey', () => {
  it('treats longevity rows as duplicates only when the full identity matches', () => {
    const first = buildPlaqueImportDuplicateKey({
      plaqueType: 'LONGEVITY',
      holderName: '张三',
      longevitySubtype: '祈福禄位',
      size: '大',
      gender: '男',
      birthDate: '1980-01-02',
      birthLunar: true,
      yangShang: '李四',
      phone: '13800138000',
      address: '上海静安',
      blessingText: '吉祥平安',
      startDate: '2026/05/01',
      endDate: '2026-12-31'
    })

    const same = buildPlaqueImportDuplicateKey({
      plaqueType: 'LONGEVITY',
      holderName: ' 张三 ',
      longevitySubtype: '祈福禄位',
      size: '大',
      gender: '男',
      birthDate: '1980-01-02',
      birthLunar: true,
      yangShang: '李四',
      phone: '13800138000',
      address: '上海 静安',
      blessingText: '吉祥平安',
      startDate: '2026-05-01',
      endDate: new Date('2026-12-31T00:00:00.000Z')
    })

    const changed = buildPlaqueImportDuplicateKey({
      plaqueType: 'LONGEVITY',
      holderName: '张三',
      longevitySubtype: '祈福禄位',
      size: '中',
      gender: '男',
      birthDate: '1980-01-02',
      birthLunar: true,
      yangShang: '李四',
      phone: '13800138000',
      address: '上海静安',
      blessingText: '吉祥平安',
      startDate: '2026-05-01',
      endDate: '2026-12-31'
    })

    expect(first).toBe(same)
    expect(first).not.toBe(changed)
  })

  it('uses multiple deliverance fields together instead of a single field', () => {
    const first = buildPlaqueImportDuplicateKey({
      plaqueType: 'DELIVERANCE',
      dedicationType: '冤亲债主',
      size: '小',
      yangShang: '王家',
      phone: '13900001111',
      address: '苏州园区',
      startDate: 46142,
      endDate: 46203
    })

    const same = buildPlaqueImportDuplicateKey({
      plaqueType: 'DELIVERANCE',
      dedicationType: '冤亲债主',
      size: '小',
      yangShang: '王家',
      phone: '13900001111',
      address: '苏州园区',
      startDate: '2026-04-30',
      endDate: '2026-06-30'
    })

    const changed = buildPlaqueImportDuplicateKey({
      plaqueType: 'DELIVERANCE',
      dedicationType: '冤亲债主',
      size: '小',
      yangShang: '王家',
      phone: '13900002222',
      address: '苏州园区',
      startDate: '2026-04-30',
      endDate: '2026-06-30'
    })

    expect(first).toBe(same)
    expect(first).not.toBe(changed)
  })
})
