# Local Workflow

本地正式工作区：

```text
C:\Users\28557\Documents\New project\temple-os
```

旧目录说明：

```text
C:\Users\28557\Documents\New project
```

根目录原本是轻量打印工具副本，不再作为完整项目主工作区。

```text
C:\Users\28557\Documents\New project\server_sync\temple-os-server
```

这是服务器同步副本，后续只作为参考，不作为主开发目录。

## Daily Work

1. 进入本地正式项目：

```powershell
cd "C:\Users\28557\Documents\New project\temple-os"
```

一键启动本地程序：

```powershell
.\start-desktop.bat
```

2. 查看状态：

```powershell
git status --short
```

3. 修改代码。

4. 运行对应检查。

5. 生成发布包：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\make-release.ps1
```

6. 检查发布包：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-release.ps1 -ZipPath .\releases\<release>.zip
```

## Git Deploy Path

1. 确认本地检查通过。
2. 提交代码。
3. 推送到 `main`。
4. GitHub Actions 执行 `.github/workflows/deploy-production.yml`。
5. 服务器执行 `/opt/temple-os/deploy.sh all`。

必须先在 GitHub 配置 Secrets：

```text
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
PRODUCTION_SSH_PORT
```

## Package Upload Path

发布包只包含源码、文档、配置模板和必要资源，不包含真实 `.env`、依赖、构建产物、备份或日志。

上传目标建议：

```text
/opt/temple-os-releases/
```

服务器部署时必须保留：

```text
/opt/temple-os/backend/.env
/opt/temple-os/docker/.env
/opt/temple-os/storage
/opt/temple-os/backup
```
