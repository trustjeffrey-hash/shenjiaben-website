# 沈家本研究院官网 — 项目迁移指南

## 项目概述

湖州市沈家本研究院官方网站，定位为庄重学术政务官网 + 全自动法律数据聚合平台。
开发模式：前后端完全分离，PC + 移动端 100% 自适应。

## 迁移步骤

### 1. 解压文件包

将 `shenjiaben-website.zip` 解压到新电脑上 WorkBuddy 的工作目录下。

建议路径：
```
C:\Users\<用户名>\WorkBuddy\shenjiaben-website\
```

### 2. 在 WorkBuddy 中打开项目

在新电脑上启动 WorkBuddy，选择"打开文件夹"→ 选择解压后的 `shenjiaben-website` 目录。

### 3. 关键文件说明

| 目录/文件 | 说明 |
|-----------|------|
| `src/frontend/` | 前台 20 个 HTML 页面 + CSS/JS |
| `src/backend-js/` | Node.js 后端（server.js + db.js + seed.js） |
| `src/backend/` | Python 后端（数据采集器，备用） |
| `dist/` | 部署输出目录（与 src/frontend 同步） |
| `.workbuddy/` | 项目记忆文件（包含历史决策、UI 规范等） |
| `docs/` | 文档（需求、开发计划、部署指南） |

### 4. 运行 Node.js 后端

```bash
cd src/backend-js
node seed.js   # 初始化数据库（首次运行）
node server.js # 启动后端 API 服务器（端口 3000）
```

### 5. 预览前端页面

在 WorkBuddy 中打开 `dist/index.html` 或 `src/frontend/index.html` 即可预览。
或启动本地服务器：

```bash
# 使用 Python
python -m http.server 8080 -d dist/
```

### 6. 部署（可选）

- **CloudStudio 预览**：在 WorkBuddy 中说"部署到 CloudStudio"，会自动部署 dist/ 目录
- **Render.com**：参考 `DEPLOY_RENDER.md`
- **GitHub**：项目已关联 https://github.com/trustjeffery-hash/shenjiaben-website

### 7. 项目记忆

`.workbuddy/memory/` 目录包含项目的历史工作记录：
- `YYYY-MM-DD.md` — 每日工作日志
- `MEMORY.md` — 长期项目笔记（UI 规范、技术栈、关键约定等）

WorkBuddy 在新电脑上会自动读取这些文件作为上下文。

## 技术栈

- **前端**：纯 HTML/CSS/JS + ECharts + Chart.js，无框架
- **后端**：Node.js（零依赖，使用内置 http/fs/path/crypto/url 模块）
- **数据库**：JSON 文件数据库（自写 db.js 模块）
- **Python 后端**：FastAPI + APScheduler（数据采集调度，备用方案）

## UI 规范速查

- 主色：法治深蓝 #203B64
- 辅色：浅蓝 #6B84A8
- 点缀：古铜色 #C89959（仅 Banner/标签）
- 标题字体：思源宋体
- 正文字体：思源黑体/微软雅黑
- 卡片：圆角 6px、浅阴影、内边距 20px
- 版心：PC 1200px 居中，移动端 16px 内边距

## 研究院信息

- 地址：浙江省湖州市吴兴区妙西镇沈家本历史文化园
- 联系人：王主任
- 电话：13082838161
- 邮箱：info@hz-shenjiaben.org
- 专职院长：王俊峰
- 兼职院长：蒋惠岭（同济大学法学院院长）
- 成立时间：2020年11月

## 需要帮助？

在新电脑的 WorkBuddy 对话中，WorkBuddy 会自动读取 `.workbuddy/memory/MEMORY.md` 了解完整的项目上下文。
