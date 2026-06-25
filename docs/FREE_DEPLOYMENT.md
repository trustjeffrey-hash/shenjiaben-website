# 沈家本研究院官网 — 免费部署指南

## 方案一：Render.com（推荐，全栈免费）

### 特点
- **完全免费**：750 小时/月运行时长
- **前后端一体化**：Node.js 服务器同时托管 API 和静态文件
- **自动 HTTPS**：免费 SSL 证书
- **自动休眠**：15 分钟无访问自动休眠，新请求自动唤醒

### 部署步骤

1. **注册 Render.com**
   - 访问 https://render.com 用 GitHub 账号注册

2. **上传代码到 GitHub**
   - 创建 GitHub 仓库，推送本项目全部代码
   - 或者直接 Fork 到你的账号

3. **在 Render 创建 Web Service**
   - Dashboard → New → Web Service
   - 连接你的 GitHub 仓库
   - 配置：
     - **Name**: `shenjiaben`（会变成 `shenjiaben.onrender.com`）
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node src/backend-js/server.js --seed`
     - **Free Plan**: 选择

4. **等待部署完成**
   - 首次部署约 2-3 分钟
   - 访问 `https://shenjiaben.onrender.com` 即可看到完整网站

### 注意事项
- 首次访问可能需要 30 秒冷启动
- 每月 750 小时足够 24/7 运行
- JSON 数据库会随服务重置（Render 免费版的本地文件不持久化）
- 如需持久化数据，可后续升级到 PostgreSQL（Render 免费提供 90 天）

---

## 方案二：GitHub Pages（前端 + 静态演示）

### 特点
- **完全免费**，无限制
- 仅托管静态文件（前端页面）

### 部署步骤
1. 创建 `docs/` 目录，放入 dist 内容
2. 在 GitHub 仓库 Settings → Pages → Source: `main` branch, `/docs` folder
3. 访问 `https://<用户名>.github.io/<仓库名>/`

### 限制
- 仅展示 UI，无后端 API 数据

---

## 方案三：Vercel + Render 组合（推荐用于正式运营）

### 特点
- **Vercel**：免费托管前端静态文件（CDN 加速）
- **Render**：免费托管后端 API
- 前后端分离，各自最优

### 部署步骤
1. **Render 后端**：同上，部署 Node.js 服务器
2. **Vercel 前端**：
   - 修改 `src/frontend/assets/js/common.js` 中的 `API_BASE`：
     ```js
     ShenJB.API_BASE = 'https://你的服务名.onrender.com/api/v1';
     ```
   - 在 Vercel 导入 GitHub 仓库，设置 Root Directory 为 `src/frontend`
3. Vercel 自动分配域名，Render 提供后端 API

---

## 迁移到自定义域名（所有方案通用）

1. 购买域名（推荐 Namecheap / 阿里云万网，约 50-100 元/年）
2. 在域名注册商添加 CNAME 记录指向 Render/Vercel 提供的域名
3. 在 Render/Vercel 控制台添加自定义域名
4. SSL 证书自动签发

## ICP 备案说明
- 使用 Render/Vercel 等海外托管，**不需要 ICP 备案**
- 如需中国大陆境内访问更快，可后续迁移至腾讯云/阿里云并使用 CDN
