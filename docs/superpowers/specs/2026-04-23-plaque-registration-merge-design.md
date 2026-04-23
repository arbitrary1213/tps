# 登记发布 - 牌位登记模块合并

**日期：** 2026-04-23
**状态：** 已确认

## 目标

将"延生禄位"、"往生莲位"、"超度牌位"三个独立任务合并为统一的"牌位登记"类型，简化管理复杂度。

## 现状分析

- **落地页**：已有统一入口（`PLAQUE` 模式），支持延生禄位/超度牌位切换选择
- **后端审批**：已有 `case 'PLAQUE':` 分发逻辑，审批通过后写入 memorialPlaque 表
- **后台管理**：登记发布页面仍为三个独立任务类型，需要手动创建/管理多个任务

## 修改方案

### 1. 前端 - 登记发布页面

**文件：** `frontend/src/app/admin/tasks/page.tsx`

**修改内容：**

#### taskTypeOptions 调整
```typescript
// 修改前
{ value: 'VOLUNTEER', label: '义工报名' },
{ value: 'LONGEVITY', label: '延生禄位' },
{ value: 'REBIRTH', label: '往生莲位' },
{ value: 'DELIVERANCE', label: '超度牌位' },
{ value: 'RITUAL', label: '法会报名' },
{ value: 'LAMP', label: '供灯祈福' },
{ value: 'ACCOMMODATION', label: '住宿登记' },
{ value: 'DINING', label: '斋堂用餐' },

// 修改后
{ value: 'VOLUNTEER', label: '义工报名' },
{ value: 'PLAQUE', label: '牌位登记' },  // 合并后统一入口
{ value: 'RITUAL', label: '法会报名' },
{ value: 'LAMP', label: '供灯祈福' },
{ value: 'ACCOMMODATION', label: '住宿登记' },
{ value: 'DINING', label: '斋堂用餐' },
```

#### defaultFormConfig 调整
```typescript
// 修改前
LONGEVITY: ['holderName', 'zodiac', 'yangShang', 'phone', 'address', 'birthDate', 'startDate'],
REBIRTH: ['deceasedName', 'yangShang', 'phone', 'address', 'deathDate', 'startDate'],
DELIVERANCE: ['deceasedName', 'yangShang', 'phone', 'address', 'startDate'],

// 修改后
PLAQUE: ['holderName', 'longevitySubtype', 'size', 'gender', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'blessingText', 'startDate', 'dedicationType'],
```

#### 列表显示 Badge 调整
```typescript
// 修改前
{ key: 'taskType', title: '类型', render: (row: Task) => (
  <Badge variant="info">{taskTypeOptions.find(t => t.value === row.taskType)?.label || row.taskType}</Badge>
)},

// 修改后（PLAQUE 类型显示具体子类型）
{ key: 'taskType', title: '类型', render: (row: Task) => {
  if (row.taskType === 'PLAQUE') {
    const subtype = row.formConfig?.includes('deceasedName') ? '往生莲位/超度牌位' : '延生禄位'
    return <Badge variant="info">{subtype}</Badge>
  }
  return <Badge variant="info">{taskTypeOptions.find(t => t.value === row.taskType)?.label || row.taskType}</Badge>
}},
```

### 2. 落地页

**文件：** `frontend/src/app/register/page.tsx`

**状态：** 无需修改，已支持 PLAQUE 模式

### 3. 后端审批逻辑

**文件：** `backend/src/routes/registration.ts`

**状态：** 无需修改，已有 `case 'PLAQUE':` 处理

### 4. 牌位管理页面

**文件：** `frontend/src/app/admin/plaques/page.tsx`

**状态：** 无需修改，统一管理所有牌位数据

## 数据流

```
用户落地页提交
    ↓
审批通过 (registration.ts case 'PLAQUE:')
    ↓
根据 plaqueType 字段区分类型 (LONGEVITY/REBIRTH/DELIVERANCE)
    ↓
写入 memorialPlaque 表
    ↓
牌位管理页面统一展示
```

## 测试要点

1. 创建"牌位登记"任务并发布
2. 落地页提交延生禄位类型申请
3. 落地页提交超度牌位类型申请
4. 后台审批通过，验证数据写入 memorialPlaque 表
5. 牌位管理页面正确显示审批后的牌位