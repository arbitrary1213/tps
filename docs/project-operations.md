# 仙顶寺管理系统项目整理文档

更新时间：2026-05-03

## 1. 项目概况

本项目是仙顶寺业务管理系统，主要包含后台管理、业务登记、牌位管理、牌位模板设计与套打、系统设置等功能。

线上域名：

- `https://xiandingsi.cn`
- 后台入口：`https://xiandingsi.cn/admin`
- 牌位模板设计：`https://xiandingsi.cn/admin/plaque-templates`
- 打印服务入口代理：`https://xiandingsi.cn/print-api/`

服务器项目目录：

```text
/opt/temple-os
```

## 2. 服务结构

当前线上真实运行结构为：前端由 `systemd + Next standalone` 运行，后端、打印服务、数据库使用容器。

| 服务 | 容器名 | 端口 | 说明 |
| --- | --- | --- | --- |
| 前端 | `temple-frontend.service` | `3000` | Next.js 后台和前台页面（systemd + standalone） |
| 后端 | `temple-backend` | `3002` | Express API 服务 |
| 打印服务 | `temple-print` | `3001` | 牌位模板设计和套打工具 |
| 数据库 | `temple-db` | `5432` | PostgreSQL |

Nginx 对外暴露：

- `/` -> `127.0.0.1:3000`
- `/api/` -> `127.0.0.1:3002`
- `/print-api/` -> `127.0.0.1:3001`

`/print-api/` 通过 Nginx `auth_request` 调用 `/api/auth/me` 做登录校验，未登录会跳转 `/login`。

## 3. 关键目录

```text
/opt/temple-os/backend          后端服务
/opt/temple-os/frontend         前端服务
/opt/temple-os/print-service    牌位套打服务
/opt/temple-os/docker           Docker Compose 和仓库内 Nginx 示例配置
/opt/temple-os/docs             项目文档
/opt/temple-os/backup           数据库备份目录
```

## 4. 牌位打印流程

当前牌位打印仍保留 Web 打印工具，但长期主执行方向是桌面端本地打印。

### 4.1 模板设计入口

后台页面：

```text
/admin/plaque-templates
```

该页面内嵌：

```text
/print-api/
```

如果 URL 带有参数，例如：

```text
/admin/plaque-templates?plaqueId=xxx&type=LONGEVITY
```

页面会透传给：

```text
/print-api/?plaqueId=xxx&type=LONGEVITY
```

打印服务会自动加载并选中对应牌位。

### 4.2 牌位管理打印按钮

牌位管理中的单条打印和批量打印都应打开：

```text
/admin/plaque-templates
```

不再使用旧的批量打印页作为主打印流程。`print-service` 当前承担模板设计、Web 预览和备用打印；`desktop-app` 后续承担本地打印执行。

### 4.3 数据分类

牌位管理真实分类：

- `LONGEVITY`：延生禄位
- `REBIRTH`：往生莲位
- `DELIVERANCE`：超度牌位

模板设计中的数据导入：

- 牌位分类：按上述三类筛选
- 分类细项：
  - 延生禄位：祈福禄位、化太岁禄位、财神禄位、文殊禄位
  - 超度牌位主体预设：从系统设置 `/api/system/settings` 的 `dedicationTypes` 动态读取

系统设置中的“超度类型预设”是超度牌位主体预设，不是往生子类型。

## 5. 登录和打印鉴权

当前登录流程已改为：

- 后端 `/api/auth/login` 登录成功后设置 `HttpOnly` Cookie：`temple_token`
- 后端鉴权同时支持：
  - `Authorization: Bearer <token>`
  - `temple_token` Cookie
- 前端不再写 JS 可读的 `temple_token`
- 登出会调用 `/api/auth/logout` 清理 Cookie

这样 `/print-api/` 可通过 Nginx 读取 `temple_token` 进行鉴权，同时降低 token 暴露风险。

## 6. 常用运维命令

进入项目：

```bash
cd /opt/temple-os
```

查看容器：

```bash
docker ps
```

查看服务日志：

```bash
docker logs --tail=100 temple-backend
docker logs --tail=100 temple-print
journalctl -u temple-frontend.service -n 100 --no-pager
```

重建并启动服务：

```bash
cd /opt/temple-os
./deploy.sh backend
./deploy.sh frontend
./deploy.sh print
```

如果需要手工处理容器，可先删除对应容器再重启：

```bash
docker rm -f temple-backend temple-print
systemctl restart temple-frontend.service
```

健康检查：

```bash
curl -k https://xiandingsi.cn/api/health
curl -kI https://xiandingsi.cn/print-api/
```

清理停止容器：

```bash
docker container prune -f
```

清理悬空镜像：

```bash
docker image prune -f
```

注意：不要随意删除 Docker volume，数据库数据在 volume 中。

## 7. 构建和测试

后端：

```bash
cd /opt/temple-os/backend
npm test
npm run build
```

前端：

```bash
cd /opt/temple-os/frontend
npm run build
```

打印服务：

```bash
cd /opt/temple-os/print-service
node --check public/app.js
```

最近验证方式：

- 后端测试：`npm test`
- 后端构建：通过
- 前端构建：通过
- 打印服务语法检查：通过

## 8. 已完成的重要整改

最近关键提交：

```text
45a8c07 secure-auth-cookie-and-clean-backups
43b690a harden-print-flow-and-deploy-config
c0558e2 sync-print-dedication-presets
43c2688 add-plaque-subtype-data-import
5932e47 fix-plaque-print-launch-data
4e539cc feat-unify-plaque-printing-service
```

主要整改内容：

- 清理旧打印服务并接入新 `print-service`
- 统一牌位管理打印入口到 `/print-api/`
- 修复牌位管理打印不带入数据
- 修复模板保存接口 500
- 修复模板设计读取系统设置中的超度预设
- 增加牌位分类筛选和细项筛选
- 修复仓库 Nginx 示例配置与线上 host network 部署不一致
- 清理备份文件、停止容器、悬空镜像
- 登录 Cookie 改为后端 `HttpOnly`

## 9. 当前清理状态

已清理：

- `.bak` 文件
- `.tar.gz` 临时备份包
- 停止容器
- 悬空镜像
- 无用旧前端镜像标签

保留：

```text
/opt/temple-os/backup/test_backup.sql
```

该文件看起来是数据库备份，未删除。

## 10. 后续建议

建议后续继续处理：

- 配置正式的数据库定时备份策略
- 给 `/opt/temple-os/backup` 增加保留周期，例如保留最近 7 到 14 天
- 定期执行 Docker 清理，但不要清理 volume
- 补充牌位打印服务的自动化测试
- 梳理旧页面 `/admin/plaques/batch-print` 是否还需要保留
- 检查 `npm audit` 中后端依赖的高危提示，评估是否能安全升级

