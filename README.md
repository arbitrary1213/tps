# 仙顶寺智慧管理系统

> 基于禅意设计理念的寺院数字化管理平台

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React + TailwindCSS |
| 后端 | Node.js + Express + Prisma ORM |
| 数据库 | PostgreSQL 15 |
| 打印服务 | Express.js + Puppeteer |
| 网关 | Nginx |
| 部署 | Docker Compose |

## 项目结构

```
temple-os/
├── frontend/          # Next.js 前端应用
│   ├── src/
│   │   ├── app/      # App Router 页面
│   │   ├── components/  # 公共组件
│   │   ├── lib/      # 工具函数
│   │   └── stores/   # Zustand 状态管理
│   └── package.json
│
├── backend/          # Express 后端 API
│   ├── src/
│   │   ├── routes/   # API 路由
│   │   ├── middleware/  # 中间件
│   │   └── utils/    # 工具函数
│   ├── prisma/      # 数据库模型
│   └── package.json
│
├── print-service/    # 打印服务
│   └── src/
│
├── docker/          # Docker 配置
│   ├── docker-compose.yml
│   └── nginx.conf
│
└── README.md
```

## 功能模块

### 佛事管理
- 牌位管理（延生禄位/往生莲位/超度牌位）
- 法会管理
- 殿堂管理
- 供灯祈福

### 人员管理
- 僧众管理
- 义工管理
- 信众管理

### 财务管理
- 功德管理
- 库房管理

### 后勤管理
- 住宿管理
- 斋堂管理
- 来访管理

### 系统管理
- 用户权限管理
- 系统设置
- 操作日志

## 快速部署

### 1. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. 启动服务

```bash
cd /opt/temple-os/docker
docker-compose up -d
```

### 3. 初始化数据库

```bash
docker exec temple-backend npx prisma db push
docker exec temple-backend node scripts/init-db.js
```

## 默认账号

- 用户名: admin
- 密码: admin123
- 邮箱: admin@xiandingsi.cn

## 访问地址

| 服务 | 地址 |
|------|------|
| 落地页 | https://xiandingsi.cn |
| 管理后台 | https://xiandingsi.cn/admin |
| API | https://xiandingsi.cn/api |
| 打印服务 | https://xiandingsi.cn/print-api |

## 开发

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## License

Private - All Rights Reserved
