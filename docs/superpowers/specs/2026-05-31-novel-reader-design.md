# Novel Reader — PWA 小说阅读器设计文档

## 概述

一个纯前端 PWA 小说阅读器，支持 TXT 导入、自动分章、仿真翻页、多主题切换和阅读记忆。所有数据存储在浏览器本地，无需后端。

## 技术架构

- **技术路线**: 纯 HTML/CSS/JS，零框架依赖
- **存储**: localStorage（书籍内容、阅读进度、用户偏好）
- **PWA**: Service Worker + Web App Manifest，可添加至手机主屏幕，离线可用
- **字体**: `system-ui, -apple-system, sans-serif` 跟随系统字体，支持 5 档字号调节
- **目标平台**: 移动端浏览器（Chrome/Safari），竖屏优先

## 页面结构

### 1. 书架页 (Bookshelf)
- 已导入书籍的网格/列表展示
- 每本书显示：书名、封面占位图、阅读进度百分比
- 顶部「导入书籍」按钮，触发 `<input type="file" accept=".txt">`
- 长按书籍可删除
- 点击书籍进入阅读页

### 2. 阅读页 (Reader)
- 核心页面，渲染当前章节的文本内容
- 两种翻页模式（设置中切换）：
  - **仿真卷页**: CSS 3D `rotateY()` + `transform-origin: right center` 实现从右侧翻过的动画效果，配合 `box-shadow` 模拟书页阴影
  - **上下翻页**: 原生 overflow-y 滚动，章节内容连续显示，滑动到底部自动加载下一章
- 交互区域划分（卷页模式）：
  - 点击左 20% 区域 → 上一页
  - 点击右 20% 区域 → 下一页
  - 点击中间 60% 区域 → 唤出/隐藏菜单栏
- 顶部状态栏：当前时间、章节标题
- 底部进度条：当前章节进度和全书进度
- 自动保存：每次翻页时将 `{bookId, chapterIndex, scrollPosition, timestamp}` 写入 localStorage

### 3. 目录页 (Table of Contents)
- 从阅读页菜单进入，全屏覆盖
- 章节列表，显示所有识别出的章节标题
- 当前章节高亮 + "当前"标签
- 已读章节标记
- 点击任意章节跳转并关闭目录

### 4. 设置面板 (Settings)
- 从阅读页底部菜单滑出
- 夜间模式开关（与白天模式互斥）
- 护眼模式开关（独立开关，叠加暖黄滤镜）
- 翻页方式切换：仿真卷页 / 上下翻页
- 字号调节：A- / 标准 / A+（5 档：小/较小/标准/较大/大）

## 主题系统

两个维度组合出 4 种视觉模式：

| 基础主题 | 护眼 | 背景色 | 文字色 | 效果 |
|---------|------|--------|--------|------|
| 白天 | 关 | #F5F0E8 | #333333 | 米白底深灰字 |
| 白天 | 开 | #F5F0E8 + 暖黄滤镜 | #333333 | 减少蓝光 |
| 夜间 | 关 | #1A1A1A | #B8B8B8 | 深黑底浅灰字 |
| 夜间 | 开 | #1A1A1A + 暖黄滤镜 | #B8B8B8 | 极致暗光 |

实现方式：CSS 自定义属性（变量）控制基础主题色，护眼模式通过叠加 `body::after` 伪元素实现 `rgba(200, 170, 100, 0.2)` 暖黄遮罩。

## 章节识别算法

TXT 文件通过 FileReader 读取为文本后，按行扫描，使用正则匹配章节标题：

**匹配模式**（按优先级）：
1. `第[0-9零一二三四五六七八九十百千]+[章节卷回]` — 中文数字章节
2. `Chapter\s+\d+` / `Ch\.\s*\d+` — 英文章节
3. `序章|楔子|前言|尾声|后记|终章|番外|外传` — 特殊章节标记
4. `^[一二三四五六七八九十]+[、，.\s]` — 中文数字标题

**特殊处理**：
- 无匹配章节 → 按固定字数（约 5000 字）自动分段
- 章节数超过 500 → 合并相近章节显示
- 空章节（内容 < 50 字）→ 自动过滤

## 数据模型

### localStorage 键结构

```
novel_books       → JSON [{id, title, author, totalChapters, createdAt}]
novel_{id}_meta   → JSON {chapters: [{title, startOffset, length}]}
novel_{id}_text   → string (原始完整文本)
novel_{id}_progress → JSON {chapterIndex, scrollPos, timestamp}
novel_settings    → JSON {theme, eyeCare, pageMode, fontSize}
```

TXT 原文存入 localStorage 而非 IndexedDB 可行，因为单本小说通常不超过 20MB（超出时提示并降级为仅存元数据 + 截断文本）。

## 文件结构

```
novel-reader/
├── index.html          # 主入口，包含所有页面
├── sw.js               # Service Worker（离线缓存）
├── manifest.json       # PWA 配置
├── icons/              # PWA 图标
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

所有 CSS/JS 内联在 index.html 中，确保单文件可部署。

## 边缘情况处理

- **大文件 (>20MB)**: 提示用户文件过大，自动截断并警告
- **编码检测**: 尝试 UTF-8，失败后回退 GBK（使用 TextDecoder）
- **空文件/无内容**: 提示"无法识别任何章节"
- **localStorage 满**: 捕获 QuotaExceededError，提示清理旧书
- **首次使用**: 书架为空，显示导入引导页
- **章节内容全部读完**: 显示"已读完"并提示返回目录
- **Service Worker 更新**: 检测到新版本时提示用户刷新
