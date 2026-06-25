# 沈家本研究院官网 — Render.com 免费部署指南

## 概述

本指南教你如何将项目**免费**部署到 Render.com，获得一个可直接访问的 HTTPS 网址。全程约 10 分钟，无需服务器、域名或备案。

## 前置条件

- GitHub 账号（免费注册：https://github.com）
- Render 账号（免费注册：https://render.com，用 GitHub 登录即可）

## 部署步骤

### 第一步：创建 GitHub 仓库并推送代码

```bash
# 1. 在 GitHub 网站创建新仓库（名称随意，如 shenjiaben-website）
#    不要勾选 "Add a README file"（我们已有代码）

# 2. 在本地执行（替换为你的 GitHub 仓库地址）：
cd "C:\Users\trust\WorkBuddy\2026-06-25-19-29-57"

git init
git add .
git commit -m "沈家本研究院官网 v1.0 — 全站前端 + Node.js 后端 + ECharts"

git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 第二步：Render 一键部署

1. 打开 https://dashboard.render.com
2. 点击 **"New +"** → **"Blueprint"**
3. 连接你的 GitHub 账号，选择刚才创建的仓库
4. Render 自动识别 `render.yaml` 配置文件
5. 点击 **"Apply"**，等待 3-5 分钟构建完成
6. 构建完成后获得网址：`https://shenjiaben-research-institute.onrender.com`

### 注意事项

| 项目 | 说明 |
|------|------|
| **免费额度** | 每月 750 小时（正好覆盖一个月），512MB RAM |
| **休眠机制** | 15 分钟无请求后自动休眠，新请求唤醒约 30 秒 |
| **建议** | 加一个免费 UptimeRobot 监控（每 5 分钟 ping 一次）防止休眠 |
| **域名** | 默认 `xxx.onrender.com`，后期可绑定自定义域名 |
| **HTTPS** | 自动配置 Let's Encrypt 证书，无需手动操作 |

### 可选：绑定自定义域名（免费）

1. 在 Render Dashboard → Settings → Custom Domain 添加域名
2. 在域名 DNS 添加 CNAME 记录指向 Render 提供的地址
3. Render 自动签发 SSL 证书

### 可选：防止休眠（UptimeRobot）

1. 注册 https://uptimerobot.com
2. 添加 HTTP 监控，目标 URL：`https://你的项目名.onrender.com/api/v1/health`
3. 监控间隔设为 5 分钟
4. 这样 Render 永不休眠

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（初始化种子数据）
node src/backend-js/server.js --seed

# 访问
# 首页:  http://localhost:5000
# API:   http://localhost:5000/api/v1/health
# 后台:  http://localhost:5000/admin  (admin / shenjiaben2026)
```
