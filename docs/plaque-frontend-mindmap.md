# 牌位管理 - 前端思维导图

```
牌位管理前端
│
├── 1. 牌位管理页 /admin/plaques ← 主入口
│   ├── 列表展示
│   │   ├── 搜索：编码 / 姓名 / 阳上
│   │   ├── 筛选：类型 / 子类型 / 状态 / 规格 / 信众 / 法会
│   │   ├── 分页：服务端分页，每页20条
│   │   ├── 列：选择框 / 编码 / 类型Badge / 牌位主体 / 阳上 / 规格 / 有效期 / 状态Badge / 操作
│   │   └── 多选：全选框 + 每行checkbox
│   │
│   ├── 新建/编辑弹窗
│   │   ├── 延生禄位 LONGEVITY
│   │   │   ├── 禄位类型 / 规格 / 牌位主体* / 信人 / 性别 / 年龄 / 属相
│   │   │   ├── 生日 + 农历checkbox / 地址 / 电话 / 祈福语
│   │   │   └── 关联信众(搜索弹窗) / 关联法会 / 关联模板
│   │   ├── 往生莲位 REBIRTH
│   │   │   ├── 规格 / 亡者姓名* / 阴庚 / 信人 / 性别 / 年龄 / 属相
│   │   │   ├── 生日+农历 / 忌日+农历
│   │   │   ├── [+ 增加亡者二] → 亡者二姓名 / 阴庚 / 生日+农历 / 忌日+农历
│   │   │   └── 阳上 / 寄语 / 地址 / 关联信众 / 关联法会 / 关联模板
│   │   └── 超度牌位 DELIVERANCE
│   │       ├── 牌位主体(dropdown+自定义) / 规格 / 亡者 / 阴庚 / 生日 / 忌日
│   │       ├── [+ 增加亡者二]
│   │       └── 阳上 / 寄语 / 地址 / 关联法会 / 关联信众 / 关联模板
│   │
│   ├── 行操作
│   │   ├── 预览 → 选择模板弹窗 → /print-api/index.html
│   │   ├── 打印 → 选择模板弹窗 → /print-api/index.html
│   │   ├── 编辑 → 打开编辑弹窗
│   │   ├── 延期 → prompt输入新日期
│   │   └── 删除 → confirm确认
│   │
│   ├── 批量操作（选中后出现工具栏）
│   │   ├── 关联法会 → 选择法会弹窗
│   │   ├── 清空法会 → 确认弹窗
│   │   ├── 批量归档 → 输入归档日期弹窗
│   │   ├── 批量延期 → 输入新日期弹窗
│   │   ├── 打印选中 → 选择模板弹窗
│   │   └── 批量删除 → 确认弹窗
│   │
│   ├── 批量导入
│   │   ├── 下载模板：延生禄位.xlsx / 往生莲位.xlsx / 超度牌位.xlsx
│   │   ├── 选择文件上传 → /api/import/plaques
│   │   └── 显示结果：成功N条 / 失败N条 / 错误列表
│   │
│   ├── 批量导出 → /api/batch/export-plaques → 下载CSV
│   └── 打印工具按钮 → /print-api/index.html
│
├── 2. 法会管理页 /admin/rituals
│   ├── 进行中法会表 + 往期法会表
│   ├── 每行新增"牌位(N)"按钮
│   │   └── 点击展开 → /api/rituals/:id/plaques
│   │       └── 子表格：编码 / 类型 / 牌位主体 / 阳上 / 规格 / 有效期 / 状态
│   │           └── 包含所有状态(ACTIVE/EXPIRED/CANCELLED/RENEWED)
│   └── 法会CRUD：新建/编辑弹窗 / 状态select / 删除
│
├── 3. 审批管理页 /admin/approvals
│   ├── 登记请求列表（PENDING/APPROVED/REJECTED）
│   ├── 审批通过 → /api/batch/approve-requests
│   │   └── PLAQUE类型 → 创建 MemorialPlaque（走 batch.ts 逻辑）
│   └── 拒绝 → 填写拒绝原因
│
├── 4. 打印中心 /admin/print-center
│   ├── 打印任务列表 /api/print-jobs
│   ├── 打印客户端管理 /api/print-clients
│   └── 创建打印任务（选择牌位+模板）
│
├── 5. 公众登记页 /register
│   ├── 任务Tab切换（义工/牌位/法会/供灯/住宿/用餐）
│   ├── 牌位登记（PLAQUE tab）
│   │   ├── 三种牌位类型切换
│   │   └── 对应字段表单
│   └── 提交 → /api/registration/requests → 进入审批队列
│
├── 6. 打印工具页 /print-api/index.html
│   ├── 模板预览 + 打印
│   └── URL参数：type / templateId / plaqueId / plaqueIds / preview
│
├── 7. 模板设计器 /print-api/designer.html
│   └── 可视化设计牌位模板
│
└── 8. API层 /lib/api.ts (businessAPI)
    ├── getPlaques()          GET  /api/plaques
    ├── createPlaque()        POST /api/plaques
    ├── updatePlaque()        PUT  /api/plaques/:id
    ├── batchUpdatePlaques()  PUT  /api/plaques/batch
    ├── deletePlaque()        DELETE /api/plaques/:id
    ├── importPlaques()       POST /api/import/plaques
    ├── exportPlaques()       POST /api/batch/export-plaques
    ├── getPlaqueTemplates()  GET  /api/plaque-templates
    ├── createPrintJob()      POST /api/print-jobs
    ├── getRituals()          GET  /api/rituals (含 _count.plaques)
    └── getRitualPlaques()    GET  /api/rituals/:id/plaques ← 新增
```
