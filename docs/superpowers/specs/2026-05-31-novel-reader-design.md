# 小说阅读器 v2 — 设计规格

## 概述

单文件 HTML 移动端小说阅读器，Capacitor 封装为 Android APK。纯上下翻页模式（去掉了仿真卷页），章节无缝衔接。

## 技术选型

- 单文件 HTML (内联 CSS + vanilla JS)
- localStorage 存储书籍、进度、设置
- Capacitor 打包 Android APK
- 无构建步骤，无框架依赖
- 字体：`system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif`

## 页面结构

四个视图通过 CSS `.page.active` 切换：

### 1. 书架页
- 顶部居中标题"我的书架"
- 2列卡片网格，每张卡：渐变色块 + 📖 + 书名 + 进度百分比（第X章 · X%）
- 长按卡片600ms出现红色 × 删除按钮，点击弹出确认对话框
- 空状态：📚 大图标 + "书架空空如也" + 提示导入文字
- 底部固定"导入小说"按钮
- 文件限制 20MB，TextDecoder 处理编码（UTF-8 → GBK 回退）
- 点击卡片进入阅读器

### 2. 阅读器页
- **顶部栏**：← 箭头（无"返回"文字）+ "第X章 章名"，字号 12px，明显小于正文
- **上下各一行空白**：高度 1.8em（与行高一致）
- **滚动内容区**：纯 overflow-y 滚动
  - 所有章节一次性渲染为连续 HTML
  - 章节标题作为 `.chapter-divider` 嵌入正文流中
  - 分隔样式：居中、加粗、金色、letter-spacing: 2px、上留白 > 下留白
  - 滚动时通过 IntersectionObserver 或 offsetTop 检测当前章节
- **底部菜单**（点击阅读区中间展开，再点或3秒后收起）：
  - 4个按钮：📑 目录 / 日夜间切换 / 护眼开关 / ⚙️ 设置
  - 章节进度条 + "第X章 章名 · 全书百分比"
- 支持音量键翻页（Android keyCode 24/25）：滚动一屏距离

### 3. 目录页
- 顶部：← 返回箭头（左）+ 标题"目录"（居中）+ 右侧占位保持对称
- 章节列表，已读灰色 + "已读"徽标，当前高亮 + 金色"当前"徽标
- 点击章节跳转并返回阅读器

### 4. 设置面板
- 底部滑入浮层 + 半透明遮罩
- 夜间模式 toggle
- 护眼模式 toggle（独立，可与日/夜叠加）
- 字号：A- / 当前档位名 / A+ 按钮，5 档（小/较小/标准/较大/大）
- "完成"按钮关闭

## 主题系统

CSS 变量切换日/夜，护眼通过 `body.eye-care::after` 叠加 `rgba(200,170,100,0.2)` 遮罩。

日间：`--bg-page: #F5F0E8`, `--text-primary: #333`, `--accent: #C9A96E`
夜间：`--bg-page: #1A1A1A`, `--text-primary: #B8B8B8`, `--accent: #B8944A`

## 章节解析

正则匹配（按优先级）：
1. `第[零一二三四五六七八九十百千0-9]+[章节卷回集]`
2. `Chapter\s+\d+` / `Ch\.\s*\d+`
3. `^(序章|楔子|前言|引子|序幕|尾声|后记|终章|结局|番外)`
4. `^[一二三四五六七八九十]+[、，.\s]`

过滤：连续匹配（间隔≤5行）保留首条；正文<50字过滤。

## localStorage 键设计

```
novel_books       → [{id, title, totalChapters, createdAt}]
novel_{id}_meta   → {title, chapterTitles: [], totalChapters, createdAt}
novel_{id}_text   → string (原始全文)
novel_{id}_progress → {chapterIndex, scrollPos, timestamp}
novel_settings    → {theme, eyeCare, fontSize}
```

## 字号映射

sm=14px, md=16px, lg=18px, xl=20px, xxl=22px（默认 md）

## 文件结构

```
novel-reader/
├── index.html
├── sw.js
├── manifest.json
├── icons/
├── capacitor.config.json
└── android/
```
