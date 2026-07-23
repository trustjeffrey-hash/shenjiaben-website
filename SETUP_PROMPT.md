# 沈家本研究院官网项目 — 新电脑迁移指南

## 第一步：解压项目文件

将 `shenjiaben-website-migration.zip` 解压到新电脑的 WorkBuddy 目录下，比如：

```
C:\Users\你的用户名\WorkBuddy\shenjiaben-website
```

## 第二步：微信公众号项目（如有）

如果你也要迁移「公众号自动写作发布」项目，同样把那个项目复制到新电脑，比如：

```
C:\Users\你的用户名\WorkBuddy\2026-06-24-20-50-22   （公众号项目路径）
```

## 第三步：重建自动化任务

在新电脑的 WorkBuddy 中粘贴下面这句话（**替换掉花括号里的路径为你的实际路径**）：

---

### ⬇️ 复制下面这段话到新电脑的 WorkBuddy：

```
请根据 outputs/automations_export.json 帮我重建全部8个自动化任务：
- 先用 Read 读取这个文件
- 把文件里所有 {NEW_WEBSITE_PATH} 替换为我的网站项目实际路径（比如 C:/Users/xxx/WorkBuddy/shenjiaben-website）
- 把文件里所有 {NEW_WECHAT_PATH} 替换为我的公众号项目实际路径（比如 C:/Users/xxx/WorkBuddy/2026-06-24-20-50-22）
- 把文件里所有 {USERNAME} 替换为我的 Windows 用户名
- 然后用 automation_update 逐个创建这8个自动化任务
- 全部创建完成后报告结果
```

---

## 自动化任务清单（共8个）

| # | 名称 | 时间 | 所属项目 |
|---|------|------|---------|
| 1 | 沈家本历史文化园活动更新（公众号抓取） | 每周一 9:00 | 网站项目 |
| 2 | 周一｜家本通俗小故事 | 每周一 9:00 | 公众号项目 |
| 3 | 周二｜古今普法小专栏 | 每周二 9:00 | 公众号项目 |
| 4 | 周三｜角落随笔·法律热点时事 | 每周三 9:00 | 公众号项目 |
| 5 | 周四｜商事调解专题研究 | 每周四 9:00 | 公众号项目 |
| 6 | 周五｜经典法庭故事 | 每周五 9:00 | 公众号项目 |
| 7 | 周六｜刑法人文故事 | 每周六 9:00 | 公众号项目 |
| 8 | 每日｜沈家本法治箴言卡片推送 | 每周日 12:00 | 公众号项目 |

## 迁移文件位置

- 项目压缩包：`outputs/shenjiaben-website-migration.zip`（81 MB）
- 自动化导出：`outputs/automations_export.json`
- 本指南：`MIGRATION_GUIDE.md`
