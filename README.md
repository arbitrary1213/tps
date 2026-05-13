# Temple OS

本地正式工作区：

```text
C:\Users\28557\Documents\New project\temple-os
```

当前定位：

- 这是一个独立的本地项目。
- 现在以本地整理和桌面端优先开发为主。
- 服务器端后续可以按本地版本重新部署，不再以服务器现状为准。

## 项目结构

```text
backend/           后端 API、Prisma、业务路由
frontend/          Next.js 前端，包含在线页和管理后台
desktop-app/       Electron 桌面端
print-service/     独立打印/模板工具
wechat-platform/   公众号中心平台骨架
docker/            部署示例、env 模板、Nginx 配置
docs/              项目文档
img/               图片资源
scripts/           本地启动、打包、检查脚本
releases/          本地发布包输出目录
```

## 当前职责划分

`backend/`

- 业务数据
- 用户认证
- 牌位、模板、打印相关 API
- Prisma schema 和数据库访问

`frontend/`

- 在线落地页
- Web 管理后台
- 当前也承载一部分打印入口和模板页资源

`desktop-app/`

- Electron 本地桌面程序
- 本地打印机能力
- 本地缓存 / 本地数据库桥接
- 后续要承担更完整的桌面化后台体验

`print-service/`

- 独立打印服务
- 模板设计与打印预览相关页面
- 当前仍是模板设计核心区域之一

`wechat-platform/`

- 公众号中心平台骨架
- 目前不是主开发重点

## 现在最重要的几个文件

模板设计器主逻辑：

```text
frontend/public/print-api/app.js
frontend/public/print-api/index.html
frontend/public/print-api/styles.css
```

说明：

- 这一套是模板设计器主实现。
- `print-service` 直接复用这套静态文件，不再保留第二份副本。

桌面端主进程：

```text
desktop-app/src/main.js
desktop-app/src/main/
desktop-app/src/preload.js
```

打印服务旧版页面：

```text
print-service/index.js
```

## 本地启动

一键启动桌面端：

```powershell
.\start-desktop.bat
```

这个入口会启动：

- Electron 桌面端
- 桌面端依赖的本地前端运行时

如需单独检查各模块：

后端：

```powershell
cd backend
npm install
npm run build
npm test
```

前端：

```powershell
cd frontend
npm install
npm run build
```

桌面端：

```powershell
cd desktop-app
npm install
npm run check
npm start
```

打印服务：

```powershell
cd print-service
npm install
node --check index.js
node --check public/app.js
```

## 当前已知重点

- 模板设计器是当前最复杂、最容易出问题的模块。
- 本地桌面端和模板设计器之间的职责边界还在整理。
- 项目里有少量历史乱码文档和旧说明，需要逐步清理。
- 当前优先顺序是：
  1. 先把本地项目跑稳
  2. 再整理模板设计与本地打印链路
  3. 最后再重建服务器部署版本

## 发布与同步

当前保留两条路径：

1. 本地打包上传
2. Git 自动部署

本地发布包脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\make-release.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-release.ps1 -ZipPath .\releases\<release>.zip
```

发布包不应包含：

- `.env`
- `node_modules`
- `.next`
- `dist`
- `backup`
- `logs`
- 运行时目录

## 参考文档

建议优先看：

- [docs/PROJECT_OVERVIEW.md](C:/Users/28557/Documents/New%20project/temple-os/docs/PROJECT_OVERVIEW.md)
- [docs/MODULE_MAP.md](C:/Users/28557/Documents/New%20project/temple-os/docs/MODULE_MAP.md)
- [docs/LOCAL_WORKFLOW.md](C:/Users/28557/Documents/New%20project/temple-os/docs/LOCAL_WORKFLOW.md)
- [docs/desktop-printing-plan.md](C:/Users/28557/Documents/New%20project/temple-os/docs/desktop-printing-plan.md)

## 当前工作树状态

当前仍有未提交修改，主要集中在：

- `desktop-app/src/main.js`
- `frontend/public/print-api/*` 是模板设计器唯一主实现，`print-service` 只负责提供这套静态资源。
- `print-service/index.js`

这些文件属于正在整理的打印与桌面端区域，后续继续在本地收口。
