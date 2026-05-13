# Local Project Map

更新时间：2026-05-13

## 1. 工作区

正式本地项目目录：

```text
C:\Users\28557\Documents\New project\temple-os
```

这是当前唯一主工作区。

## 2. 目录说明

### `backend/`

用途：

- Express API
- Prisma schema
- 业务逻辑
- 模板、牌位、打印相关接口

当前结论：

- 服务器端真实业务核心仍在这里
- 后续桌面端要继续复用这里的业务接口定义

### `frontend/`

用途：

- Next.js 前端
- 在线页面
- Web 管理后台
- 当前还包含 `public/print-api/` 模板设计页

当前结论：

- 这个目录现在同时承担“后台 + 模板页资源”
- 后续要逐步把管理后台桌面化，但目前还不能简单删掉

关键路径：

```text
frontend/src/app/
frontend/src/components/
frontend/public/print-api/
```

### `desktop-app/`

用途：

- Electron 桌面端
- 本地打印机能力
- 本地配置、缓存、IPC 桥

当前结论：

- 这是后续本地软件主入口
- 目前还在从“包网页”往“桌面化后台”过渡

关键路径：

```text
desktop-app/src/main.js
desktop-app/src/main/
desktop-app/src/preload.js
```

### `print-service/`

用途：

- 独立打印服务
- 旧版模板设计/打印入口

当前结论：

- 现在仍然有参考价值
- 但长期不应继续作为主打印执行端
- 适合作为模板逻辑对照区

### `wechat-platform/`

用途：

- 公众号中心平台骨架

当前结论：

- 暂时不是当前整理重点
- 先保留结构，不先投入主线开发

### `docs/`

用途：

- 项目说明
- 部署说明
- 桌面端迁移说明

当前结论：

- 旧文档有部分乱码和过时描述
- 新文档优先以本地项目现状为准

## 3. 当前重点区域

### 第一优先级

```text
frontend/public/print-api/
desktop-app/
```

原因：

- 模板设计
- 本地打印
- 预览窗口
- 本地数据同步

都集中在这两块。

补充约定：

- `frontend/public/print-api/` 是模板设计器唯一主实现。
- `print-service` 只负责服务这套文件，不再保留第二份模板设计源码。

### 第二优先级

```text
backend/src/routes/business/plaquesPrinting.ts
backend/src/routes/business.ts
```

原因：

- 桌面端后续仍要依赖这里的数据结构和接口

### 第三优先级

```text
wechat-platform/
docker/
```

原因：

- 先不阻塞本地项目整理
- 后续再按新架构重建

## 4. 当前不建议动的方向

- 不要再围绕现有服务器目录结构做兼容性修补
- 不要把 `frontend-deploy/`、`frontend-runtime/` 这类运行产物重新纳入本地项目
- 不要把真实 `.env` 放回本地仓库

## 5. 当前本地项目真实状态

当前存在未提交改动：

```text
desktop-app/src/main.js
frontend/public/print-api/app.js
frontend/public/print-api/index.html
frontend/public/print-api/styles.css
print-service/index.js
```

这些都属于打印与桌面端整理范围。

## 6. 推荐整理顺序

1. 先稳定 `frontend/public/print-api/`
2. 再稳定 `desktop-app/` 调用链路
3. 再收口 `print-service/` 与前端模板页的职责重复
4. 最后整理后端打印接口与部署结构
