# Temple OS - 前端全景思维导图

```
前端项目 (Next.js 16 + Electron)
│
├── /                                首页
│   └── 公开登记入口列表 → 点击跳转 /register?taskId=xxx
│
├── /login                           管理员登录
│   └── 用户名 + 密码 → JWT token
│
├── /register                        公众登记页
│   ├── 义工报名 VOLUNTEER
│   │   ├── 选择义工任务（动态加载可报名任务列表）
│   │   ├── 基本信息：姓名* / 法名 / 性别(男/女) / 出生年月 / 联系电话* / 紧急联络人电话 / 通讯地址
│   │   ├── 补充信息：民族(汉/藏/蒙/回/维/其他) / 学历(小学~博士) / 从事职业
│   │   ├── 健康状况：健康状况(健康/良好/一般/较差) / 有无传染病史(有/无) / 有无过敏史(有/无) / 有无特殊需求(有/无)
│   │   ├── 学佛经历：最初接触佛教时间 / 是否皈依(是/否) / 皈依时间 / 受持戒法(五戒/菩萨戒/未受戒) / 是否愿意学佛(非常乐意/可有可无/不接受) / 希望得到哪些方面指导
│   │   ├── 义工经历：有无义工经历(是/否)
│   │   │   └── 若有 → 义工次数 / 最近义工日期 / 义工地点 / 义工内容
│   │   ├── 服务时间：服务开始日期 / 服务结束日期 / 持续时间
│   │   └── 本人承诺：签名
│   │
│   ├── 牌位登记 PLAQUE（3种子类型切换）
│   │   ├── 延生禄位 LONGEVITY
│   │   │   ├── 必填：姓名(牌位主体)* / 联系电话*
│   │   │   └── 选填：禄位类型(普通/祈福/化太岁/财神/文殊) / 规格(小/中/大) / 性别 / 出生年月 + 农历勾选 / 祈福祝福语 / 开始日期 / 结束日期
│   │   ├── 往生莲位 REBIRTH
│   │   │   ├── 必填：亡者姓名* / 信人* / 联系电话*
│   │   │   └── 选填：规格 / 性别 / 出生年月 + 农历 / 忌日 + 农历 / 亡者二姓名 / 亡者二出生日期 + 农历 / 亡者二忌日 + 农历 / 开始日期 / 结束日期
│   │   └── 超度牌位 DELIVERANCE
│   │       ├── 通用超度（无指定亡者）
│   │       │   ├── 必填：牌位主体*(冤亲债主/堕胎婴灵/历代宗亲/无缘殊胜/生日超度/忌日超度/地基主/自定义) / 信人* / 联系电话*
│   │       │   └── 选填：规格 / 开始日期 / 结束日期
│   │       └── 指定亡者超度
│   │           ├── 必填：信人* / 联系电话*
│   │           └── 选填：亡者姓名 / 亡者二姓名 / 亡者二出生日期 / 亡者二忌日 / 规格 / 开始日期 / 结束日期
│   │
│   ├── 法会报名 RITUAL
│   │   ├── 法会信息：选择法会*(动态) / 姓名* / 联系电话*
│   │   └── 随喜牌位（3种类型切换，同上）
│   │       ├── 延生禄位：姓名* / 禄位类型 / 规格 / 性别 / 生日+农历 / 祈福语
│   │       ├── 往生莲位：亡者姓名* / 信人* / 规格 / 亡者二 / 日期
│   │       └── 超度牌位：牌位主体* / 信人* / 亡者 / 日期
│   │
│   ├── 供灯祈福 LAMP
│   │   ├── 必填：祈福人姓名* / 灯类型*(平安灯/智慧灯/光明灯/药师灯/往生灯/其他) / 联系电话*
│   │   └── 选填：位置(一楼/二楼/三楼/其他)
│   │
│   ├── 住宿登记 ACCOMMODATION
│   │   ├── 必填：姓名* / 联系电话*
│   │   └── 选填：选择房间(动态加载可用房间) / 入住日期 / 退房日期 / 房间数量 / 住宿类型(挂单/住宿/朝山)
│   │
│   └── 斋堂用餐 DINING
│       ├── 必填：联系人姓名* / 联系人电话* / 用餐类型*(早斋/午斋/药石/法会素斋) / 预约时间*
│       └── 选填：用餐人数
│
├── /api/[...path]/route.ts          ★ Next.js API Proxy
│   └── 所有 /api/* 请求 → 转发后端 Express → 统一 12s AbortController 超时
│
├── /print-api                       打印工具入口 → 重定向到 public/print-api/index.html
├── /plaque-templates                牌位模板独立页
├── /download                        下载中转页
│
└── /admin                           管理后台 ← 核心模块
    ├── layout.tsx
    │   ├── 侧边栏导航（5个分组 24个入口）
    │   ├── 角色守卫（无token → /login）
    │   └── Desktop同步启动（Electron环境自动同步牌位/模板/设置到本地SQLite）
    │
    ├── ==================================================
    │   工作台
    │   ==================================================
    │
    ├── /admin                        仪表盘总览
    │   └── 统计卡片：牌位数/信众数/法会数/供灯数 + 待审批数
    │
    ├── /admin/tasks                  登记任务发布
    │   ├── 任务列表：名称 / 类型(义工/牌位/法会/供灯/住宿/用餐) / 启用状态 / 排序
    │   ├── 新建/编辑任务：
    │   │   ├── 任务名称 / 类型 / 描述
    │   │   ├── 表单字段配置（勾选需要的字段）
    │   │   ├── 关联微信公众号
    │   │   └── 启用/禁用
    │   └── 删除任务
    │
    ├── /admin/approvals              登记审批
    │   ├── 请求列表：提交人 / 电话 / 类型 / 状态(PENDING/APPROVED/REJECTED) / 提交时间
    │   ├── 审批操作：通过 / 拒绝(填写原因)
    │   └── 批量审批
    │
    ├── ==================================================
    │   寺院业务
    │   ==================================================
    │
    ├── /admin/devotees               信众管理
    │   ├── 列表：姓名 / 电话 / 标签 / 等级(NORMAL/VIP/SVIP) / 累计功德 / 末次来访
    │   ├── 搜索：姓名/电话
    │   ├── 新建/编辑：
    │   │   ├── 姓名* / 电话*(唯一) / 微信 / 邮箱 / 身份证
    │   │   ├── 生日 / 属相 / 地址
    │   │   ├── 标签(自定义标签可多选) 
    │   │   └── 备注
    │   └── 删除
    │
    ├── /admin/plaques                牌位管理 ★
    │   ├── 列表（服务端分页 20条/页）
    │   │   ├── 搜索：编码 / 姓名 / 阳上
    │   │   ├── 筛选：类型 / 子类型 / 状态 / 规格 / 信众 / 法会
    │   │   ├── 多选：全选 + 行checkbox
    │   │   └── 列：编码 / 类型Badge / 牌位主体 / 阳上 / 规格 / 有效期 / 状态Badge / 操作
    │   │
    │   ├── 新建/编辑弹窗（按类型切换表单）
    │   │   ├── 延生禄位 LONGEVITY
    │   │   │   ├── 禄位类型(祈福/化太岁/财神/文殊) / 规格(大/中/小)
    │   │   │   ├── 牌位主体*(holderName) / 信人(yangShang) / 性别(男/女)
    │   │   │   ├── 年龄 / 属相 / 生日 + 农历checkbox / 地址
    │   │   │   ├── 联系电话 / 祈福祝福语
    │   │   │   ├── 关联信众(搜索弹窗) / 关联法会 / 关联模板
    │   │   │   └── 开始日期 / 结束日期 / 备注
│   │   │   │
    │   │   ├── 往生莲位 REBIRTH
    │   │   │   ├── 规格 / 亡者姓名* / 阴庚(干支纪年) / 信人
    │   │   │   ├── 性别 / 年龄 / 属相 / 生日 + 农历 / 忌日 + 农历
    │   │   │   ├── [+ 增加亡者二] → 姓名 / 阴庚 / 生日+农历 / 忌日+农历
    │   │   │   ├── 阳上(供奉人) / 寄语 / 地址
    │   │   │   └── 关联信众 / 关联法会 / 关联模板 / 日期 / 备注
    │   │   │
    │   │   └── 超度牌位 DELIVERANCE
    │   │       ├── 牌位主体(下拉: 冤亲债主/堕胎婴灵/历代宗亲/.../自定义新增)
    │   │       ├── 规格 / 亡者 / 阴庚 / 生日 / 忌日
    │   │       ├── [+ 增加亡者二] → 姓名 / 阴庚 / 生日 / 忌日
    │   │       └── 阳上 / 寄语 / 地址 / 关联法会 / 关联信众 / 关联模板 / 日期 / 备注
    │   │
    │   ├── 行操作按钮
    │   │   ├── 预览 → 选择模板弹窗 → /print-api/index.html?preview=1
    │   │   ├── 打印 → 选择模板弹窗 → /print-api/index.html
    │   │   ├── 编辑 → 打开编辑弹窗
    │   │   ├── 延期 → prompt输入新结束日期
    │   │   └── 删除 → confirm确认
    │   │
    │   ├── 批量操作（选中后出现工具栏）
    │   │   ├── 关联法会 → 选择法会弹窗
    │   │   ├── 清空法会 → 确认弹窗
    │   │   ├── 批量归档 → 可选填归档日期
    │   │   ├── 批量延期 → 输入新结束日期
    │   │   ├── 打印选中 → 选择模板弹窗
    │   │   └── 批量删除 → 确认弹窗（不可恢复）
    │   │
    │   ├── 批量导入
    │   │   ├── 下载模板：延生禄位模板.xlsx / 超度牌位模板.xlsx（超度包括记名和不记名的）
    │   │   └── 选择文件上传 → 显示成功/失败/错误列表
    │   │
    │   └── 批量导出 → 下载 CSV（须区分延生禄位模板.xlsx / 超度牌位模板.xlsx）
    │
    ├── /admin/rituals                法会管理
    │   ├── 进行中法会表 + 往期法会表
    │   ├── 法会字段：名称 / 类型(佛诞/禅修/消灾/超度/其他) / 日期 / 时间 / 地点 / 人数 / 费用 / 状态
    │   ├── 状态流转：草稿 → 已发布 → 即将开始 → 进行中 → 已结束
    │   ├── 新建/编辑弹窗：
    │   │   ├── 法会名称* / 类型 / 描述
    │   │   ├── 日期* / 开始时间* / 结束时间*
    │   │   ├── 地点* / 最大人数 / 费用 / 报名截止日
    │   │   └── 允许在线报名
    │   ├── 行操作：编辑 / 状态select / "牌位(N)"展开 / 删除
    │   └── "牌位(N)"按钮 → 展开子表格
    │       └── 编码 / 类型 / 牌位主体 / 阳上 / 规格 / 有效期 / 状态（含已归档）
    │
    ├── /admin/lamps                  供灯祈福
    │   ├── 列表：供灯者 / 电话 / 灯类型 / 位置 / 天数 / 祈福对象 / 金额 / 状态 / 有效期
    │   └── 新建：姓名 / 电话 / 灯类型(长明灯/酥油灯/莲花灯/香烛灯) / 位置 / 天数 / 祈福对象 / 祈福类型 / 祈福语 / 金额 / 日期
    │
    ├── /admin/donations              功德管理
    │   ├── 列表：捐赠人 / 电话 / 类型(香火钱/建庙/法会/牌位/放生/其他) / 金额 / 支付方式 / 日期 / 收据号
    │   ├── 筛选：类型 / 日期范围 / 经手人
    │   └── 新建：捐赠人 / 电话 / 类型 / 金额 / 支付方式(现金/微信/支付宝/银行) / 日期 / 收据号 / 备注
    │
    ├── ==================================================
    │   模板与打印
    │   ==================================================
    │
    ├── /admin/print-center           打印中心
    │   ├── 打印任务列表：编号 / 模板 / 牌位类型 / 总数 / 已完成 / 失败 / 状态(PENDING→DISPATCHED→PRINTING→COMPLETED/FAILED) / 时间
    │   ├── 打印客户端列表：名称 / 编号 / 状态(ONLINE/OFFLINE) / 默认打印机 / 最后心跳
    │   └── 创建打印任务：选择牌位 + 选择模板 + 指定客户端
    │
    ├── /admin/plaque-templates       模板库
    │   ├── 模板列表：名称 / 类型 / 尺寸 / 缩略图
    │   ├── 新建/编辑：名称 / 类型(延生/往生/超度/通用) / 纸张尺寸 / 元素设计
    │   ├── 上传PDF模板
    │   └── 删除（内置模板受保护不可删）
    │
    ├── ==================================================
    │   公众号运营
    │   ==================================================
    │
    ├── /admin/wechat                 公众号控制台
        ├── 绑定状态：寺院编号 / 公众号名称 / 状态(未绑定/已激活/已禁用)
        ├── 消息管理：收件箱 / 已回复 / AI建议回复
        ├── 文章管理：新建/编辑/发布图文
        └── 模板消息：发送法会提醒 / 牌位提醒
    │
    ├── ==================================================
    │   人员与后勤
    │   ==================================================
    │
    ├── /admin/volunteers             义工管理
    │   ├── 列表：姓名 / 法名 / 电话 / 总工时 / 等级(一星~五星) / 状态
    │   └── 档案（同登记表单的完整字段）
    │
    ├── /admin/volunteer-tasks        义工任务
    │   ├── 列表：名称 / 类型(殿堂清洁/法会协助/接待引导/斋堂帮厨/其他) / 地点 / 日期 / 时间 / 需要/已报 / 状态
    │   └── 状态：招募中 → 已满 → 进行中 → 已完成
    │
    ├── /admin/volunteer-attendance   义工考勤
    │   ├── 签到：任务 + 姓名 + 电话
    │   └── 签退：电话 → 自动计算服务时长
    │
    ├── /admin/monks                  僧众管理
    │   ├── 列表：法号 / 俗名 / 性别 / 籍贯 / 剃度日期 / 戒腊 / 职务 / 状态
    │   └── 档案：法号* / 俗名 / 性别 / 生日 / 籍贯 / 剃度日期 / 剃度类型 / 戒腊年数 / 职务 / 所属殿堂 / 电话 / 身份证 / 照片 / 状态(在寺/请假/离寺) / 备注
    │
    ├── /admin/rooms                  住宿管理
    │   ├── 房间列表：房号 / 类型(单/双/多) / 楼层 / 容量 / 价格 / 状态(可用/已占用/维护)
    │   ├── 住宿记录：客人姓名 / 电话 / 身份证 / 类型(挂单/住宿/朝山) / 入住/退房日期 / 押金 / 费用 / 状态
    │   └── 办理退房
    │
    ├── /admin/dining                 斋堂管理
    │   ├── 列表：用餐类型(早斋/午斋/药石/法会素斋) / 日期 / 人数 / 联系人 / 电话 / 金额 / 支付状态
    │   └── 新建预定
    │
    ├── /admin/visits                 来访管理
    │   ├── 列表：访客姓名 / 电话 / 类型(香客/游客/政府/媒体/其他) / 团体 / 人数 / 日期 / 目的 / 拜访对象
    │   └── 新建记录
    │
    ├── /admin/warehouse              库房管理
    │   ├── 物品列表：名称 / 分类(香烛/纸钱/食品/耗材/法器/其他) / 单位 / 库存 / 最低库存 / 单价 / 位置 / 供应商
    │   ├── 入库：物品 + 数量 + 单价 + 供应商 + 经手人
    │   └── 出库：物品 + 数量 + 用途 + 经手人
    │
    └── ==================================================
        系统
        ==================================================
    │
    ├── /admin/halls                  殿堂管理
    │   ├── 列表：名称 / 位置 / 描述 / 容量 / 开放时间 / 状态(开放/维护/关闭)
    │   └── 新建/编辑：名称 / 位置 / 描述 / 容量 / 开放时间 / 图片
    │
    ├── /admin/settings               系统设置
    │   ├── 寺院信息：名称 / 地址 / 电话 / 邮箱 / Logo / 首页背景 / 公众号二维码
    │   ├── 超度类型预设：逗号分隔字符串（用于牌位主体的下拉选项）
    │   └── 微信公众号配置：AppID / AppSecret / Token / EncodingAESKey
    │
    ├── /admin/users                  用户管理
    │   ├── 列表：用户名 / 姓名 / 邮箱 / 角色(ADMIN/OPERATOR/VIEWER) / 创建时间
    │   ├── 新建：用户名* / 密码* / 姓名 / 邮箱 / 角色
    │   └── 操作：修改密码 / 删除
    │
    └── /admin/logs                   操作日志
        ├── 列表：操作人 / 动作(CREATE/UPDATE/DELETE/BATCH_*) / 目标类型 / 目标ID / 变更前后 / IP / 时间
        └── 筛选：用户 / 动作 / 目标类型 / 时间范围
```

---

## 附录：公共组件 & 状态管理 & 工具层

```
状态管理 stores/authStore.ts
├── Zustand + 手动 localStorage
├── user: { id, username, name, email, role }
├── token: JWT string
├── _hasHydrated: boolean (SSR安全)
└── setAuth() / logout()

组件库 components/ui/
├── Badge           variant: info/success/warning/gray/danger
├── Button          variant: primary/secondary/danger/ghost + size: sm/md/lg + loading + disabled
├── Card            圆角卡片容器 + 阴影
├── Checkbox        受控复选框
├── ConfirmDialog   标题+内容+确认/取消
├── Empty           空状态图标+文字
├── Hints           黄色提示框
├── Input           type: text/date/time/number + label + placeholder + required + error
├── Loading         旋转动画
├── LoadingOverlay  全屏半透明遮罩
├── Modal           size: sm/md/lg/half + open/onClose + title
├── SearchBar       搜索图标 + 输入框 + onChange
├── Select          label + options[{value,label}] + containerClassName
├── Table           columns[{key,title,render}] + data + loading + emptyText
├── Tabs            标签切换
└── Textarea        label + rows + resize

API 层 lib/api.ts
├── request() 核心
│   ├── 自动 Authorization: Bearer token
│   ├── GET: 优先读本地缓存(SQLite/IndexedDB) → 返回缓存 → 后台fetch刷新
│   ├── 请求失败: 回退本地缓存
│   ├── FormData: 跳过 Content-Type header（文件上传）
│   └── 桌面环境: 支持 getCache/setCache/upsertLocalRows/listLocalRows
├── authAPI            login / register / me / changePassword / logout
├── systemAPI          getSettings / updateSettings
├── registrationAPI    getTasks / getTasksAll / createTask / updateTask / deleteTask
│                      getRequests / submitRequest / approveRequest / rejectRequest / deleteRequest
├── businessAPI
│   ├── monks          get / create / update / delete
│   ├── volunteers     get / create / update / delete
│   ├── volunteerTasks get / create / update / delete
│   ├── attendance     signIn / signOut
│   ├── devotees       get / create / update / delete
│   ├── plaques        get / create / update / batchUpdate / delete
│   ├── printJobs      createPrintJob / getPrintJobs / getPrintJob
│   ├── rituals        get / create / update / delete / getRitualPlaques
│   ├── halls          get / create / update
│   ├── lampOfferings  get / create
│   ├── donations      get / create
│   ├── warehouse      items/in/out
│   ├── rooms          getRooms/createRoom/updateRoom + accommodations + checkout
│   ├── dining         get / create
│   ├── visits         get / create
│   ├── users          get / create / updatePassword / delete
│   ├── logs           get
│   ├── stats          getStats (dashboard)
│   ├── plaqueTemplates get / getOne / create / update / delete
│   ├── printClients   getPrintClients
│   ├── importPlaques  FormData上传Excel
│   └── exportPlaques  POST → Blob下载CSV
└── wechatAPI          getStatus / getAuthUrl / bind / getMessages / replyMessage
                       getArticles / createArticle / publishArticle / sendTemplateMessage

类型定义 types/
├── api.ts
│   ├── ApiUser              { id, username, name, email, role }
│   ├── DashboardStats       { plaques, devotees, rituals, lamps, pending }
│   ├── DevoteeRecord        { id, name, phone, level, totalDonation, ... }
│   ├── PlaqueRecord         { id, code, plaqueType, holderName, deceasedName, dedicationType, status, ... }
│   ├── RitualRecord         { id, name, ritualType, ritualDate, status, ... }
│   ├── RegistrationTaskRecord    { id, name, taskType, formConfig, enabled, ... }
│   ├── RegistrationRequestRecord { id, taskId, status, submitterName, formData, ... }
│   ├── PrintJobRecord       { id, jobNo, status, totalCount, printedCount, ... }
│   ├── PrintClientRecord    { id, clientCode, name, status, ... }
│   ├── SystemSettingsRecord { templeName, dedicationTypes, wechatAppId, ... }
│   ├── UserRecord           { id, username, name, role, ... }
│   └── OperationLogRecord   { id, username, action, targetType, ... }
└── template.ts
    └── PlaqueTemplate       { id, name, type, elements, paperWidth, paperHeight, ... }

打印工具 public/print-api/ (独立HTML，非React)
├── index.html        打印主页（牌位预览+打印）
├── designer.html     模板设计器（拖拽编辑）
├── shared.js         ★ 核心逻辑 ~5400行
│   ├── 模板管理：内置模板 / 服务端同步 / 本地缓存 / 去重(name+dataGroup) / 迁移
│   ├── 数据管理：datasets{blessing,deliverance} / CSV导入 / 粘贴解析 / URL参数
│   ├── 渲染引擎：singleSheet(单牌位) / summarySheet(汇总) / fitAllFields(字号自适应)
│   ├── 打印引擎：printAll → printRangeFrom → 分页HTML → Desktop直打 / 浏览器window.print
│   └── 设计工具：拖拽元素 / 缩放 / 图层管理 / 纸张尺寸
├── print.js          打印入口逻辑
└── styles.css        打印样式（@page / @media print）
```
