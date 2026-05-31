# Novel Reader PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-dependency PWA novel reader with TXT import, auto chapter detection, page-curl animation, theme switching, and reading-position memory.

**Architecture:** Single HTML file with inline CSS/JS, plus a Service Worker and Web App Manifest for PWA offline support. All data stored in localStorage. CSS custom properties drive the 4-mode theme system. Chapter detection uses regex scanning on imported TXT text.

**Tech Stack:** HTML5, CSS3 (custom properties, 3D transforms, animations), Vanilla JS (ES6+), Service Worker API, Web App Manifest

---

## File Structure

```
novel-reader/
├── index.html          # Main entry: HTML structure + inline CSS + inline JS
├── sw.js               # Service Worker for offline caching
├── manifest.json       # PWA Web App Manifest
└── icons/
    ├── icon-192.png    # 192x192 PWA icon
    └── icon-512.png    # 512x512 PWA icon
```

---

### Task 1: Project Scaffolding and HTML Structure

**Files:**
- Create: `novel-reader/index.html`
- Create: `novel-reader/manifest.json`
- Create: `novel-reader/sw.js` (placeholder)

- [ ] **Step 1: Create project directory**

```bash
mkdir -p novel-reader/icons
```

- [ ] **Step 2: Write manifest.json**

```json
{
  "name": "小说阅读器",
  "short_name": "阅读器",
  "description": "一个支持TXT导入、仿真翻页、多主题切换的小说阅读器",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F5F0E8",
  "theme_color": "#2C2C2C",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Write index.html with full HTML skeleton**

Write `novel-reader/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#2C2C2C">
<link rel="manifest" href="./manifest.json">
<title>小说阅读器</title>
<style>
/* === CSS Reset & Variables === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-xxl: 22px;
  --bg-page: #F5F0E8;
  --bg-surface: #EDE8E0;
  --bg-card: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #888888;
  --text-tertiary: #AAAAAA;
  --border-color: #DDD8D0;
  --accent: #C9A96E;
  --accent-light: rgba(201, 169, 110, 0.15);
  --overlay: rgba(0,0,0,0.5);
  --eye-care-overlay: transparent;
  --transition: 0.3s ease;
}

body.night {
  --bg-page: #1A1A1A;
  --bg-surface: #222222;
  --bg-card: #2A2A2A;
  --text-primary: #B8B8B8;
  --text-secondary: #7A7A7A;
  --text-tertiary: #5A5A5A;
  --border-color: #333333;
  --accent: #B8944A;
  --accent-light: rgba(184, 148, 74, 0.15);
  --overlay: rgba(0,0,0,0.7);
}

body.eye-care::after {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(200, 170, 100, 0.2);
  pointer-events: none;
  z-index: 9999;
}

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  font-family: var(--font-family);
  background: var(--bg-page);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

.page { display: none; position: fixed; inset: 0; overflow: hidden; }
.page.active { display: flex; flex-direction: column; }
</style>
</head>
<body>

<!-- Bookshelf Page -->
<div id="bookshelf-page" class="page active">
  <div class="shelf-header">
    <h1 class="shelf-title">我的书架</h1>
  </div>
  <div id="book-list" class="book-list"></div>
  <div id="empty-state" class="empty-state">
    <div class="empty-icon">📚</div>
    <p class="empty-text">书架空空如也</p>
    <p class="empty-hint">点击下方按钮导入你的第一本小说</p>
  </div>
  <div class="shelf-footer">
    <button id="import-btn" class="btn-primary">导入小说</button>
    <input type="file" id="file-input" accept=".txt" style="display:none">
  </div>
</div>

<!-- Reader Page -->
<div id="reader-page" class="page">
  <div id="reader-header" class="reader-header">
    <span id="header-back" class="header-back">← 返回</span>
    <span id="header-title" class="header-title"></span>
    <span id="header-time" class="header-time"></span>
  </div>
  <div id="reader-container" class="reader-container">
    <div id="reader-content" class="reader-content"></div>
    <div id="reader-next" class="reader-content reader-next"></div>
  </div>
  <div id="reader-footer" class="reader-footer">
    <div class="progress-bar"><div id="progress-fill" class="progress-fill"></div></div>
    <span id="progress-text" class="progress-text"></span>
  </div>
  <div id="reader-menu" class="reader-menu">
    <div class="menu-row">
      <button id="menu-toc" class="menu-btn">📑 目录</button>
      <button id="menu-night" class="menu-btn">🌙 夜间</button>
      <button id="menu-eye" class="menu-btn">🛡️ 护眼</button>
      <button id="menu-settings" class="menu-btn">⚙️ 设置</button>
    </div>
    <div class="menu-progress">
      <div class="progress-bar"><div id="menu-progress-fill" class="progress-fill"></div></div>
    </div>
  </div>
</div>

<!-- TOC Page -->
<div id="toc-page" class="page">
  <div class="toc-header">
    <span id="toc-back" class="header-back">← 返回</span>
    <span class="toc-title">目录</span>
    <span style="width:48px"></span>
  </div>
  <div id="toc-list" class="toc-list"></div>
</div>

<!-- Settings Panel (overlay on reader) -->
<div id="settings-overlay" class="settings-overlay">
  <div class="settings-backdrop"></div>
  <div class="settings-panel">
    <h3 class="settings-title">阅读设置</h3>
    <div class="settings-item">
      <span>🌙 夜间模式</span>
      <label class="toggle"><input type="checkbox" id="setting-night"><span class="toggle-slider"></span></label>
    </div>
    <div class="settings-item">
      <span>🛡️ 护眼模式</span>
      <label class="toggle"><input type="checkbox" id="setting-eye"><span class="toggle-slider"></span></label>
    </div>
    <div class="settings-item">
      <span>📖 翻页方式</span>
      <select id="setting-pagemode" class="settings-select">
        <option value="curl">仿真卷页</option>
        <option value="scroll">上下翻页</option>
      </select>
    </div>
    <div class="settings-item">
      <span>🔤 字号</span>
      <div class="font-size-control">
        <button id="font-down" class="font-btn">A-</button>
        <span id="font-label" class="font-label">标准</span>
        <button id="font-up" class="font-btn">A+</button>
      </div>
    </div>
    <button id="settings-close" class="btn-primary">完成</button>
  </div>
</div>

<!-- Delete Confirm Dialog -->
<div id="delete-dialog" class="dialog-overlay" style="display:none">
  <div class="dialog-box">
    <p class="dialog-text">确定要删除这本书吗？<br><small>此操作不可恢复</small></p>
    <div class="dialog-buttons">
      <button id="delete-cancel" class="btn-secondary">取消</button>
      <button id="delete-confirm" class="btn-danger">删除</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="toast"></div>

<script>
// === JS will be added in subsequent tasks ===
</script>

</body>
</html>
```

- [ ] **Step 4: Write sw.js placeholder**

Write `novel-reader/sw.js`:

```javascript
// Service Worker placeholder — full implementation in Task 13
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', () => { self.clients.claim(); });
```

- [ ] **Step 5: Commit**

```bash
git add novel-reader/ && git commit -m "feat: scaffold novel-reader project with HTML structure and manifest"
```

---

### Task 2: CSS — Bookshelf, TOC, Settings, and Dialog Styles

**Files:**
- Modify: `novel-reader/index.html` — add CSS in `<style>` block after the existing styles

- [ ] **Step 1: Add shelf page styles**

Insert after the reset/variables styles in `<style>`:

```css
/* === Bookshelf === */
.shelf-header {
  padding: 48px 20px 12px;
  background: var(--bg-surface);
  text-align: center;
}
.shelf-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; }

.book-list {
  flex: 1; overflow-y: auto; padding: 16px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  align-content: start;
}

.book-card {
  background: var(--bg-card); border-radius: 10px;
  padding: 16px 12px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform var(--transition);
  position: relative;
}
.book-card:active { transform: scale(0.97); }
.book-cover {
  width: 60px; height: 80px; margin: 0 auto 10px;
  background: linear-gradient(135deg, var(--accent), #8B6914);
  border-radius: 4px; display: flex; align-items: center;
  justify-content: center; font-size: 24px; color: #fff;
}
.book-name { font-size: 14px; font-weight: 600; margin-bottom: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.book-progress { font-size: 11px; color: var(--text-secondary); }
.book-delete {
  position: absolute; top: 4px; right: 8px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,0,0,0.1); color: #E05555;
  border: none; font-size: 14px; line-height: 24px;
  cursor: pointer; display: none;
}
.book-card.long-press .book-delete { display: block; }

.empty-state { display: none; flex-direction: column; align-items: center;
  justify-content: center; flex: 1; padding: 40px; text-align: center; }
.empty-state.show { display: flex; }
.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.6; }
.empty-text { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.empty-hint { font-size: 13px; color: var(--text-secondary); }

.shelf-footer { padding: 12px 20px 24px; background: var(--bg-surface); }
.btn-primary {
  display: block; width: 100%; padding: 12px;
  background: var(--accent); color: #fff; border: none;
  border-radius: 8px; font-size: 16px; font-weight: 600;
  cursor: pointer; letter-spacing: 1px;
}
.btn-primary:active { opacity: 0.85; }
```

- [ ] **Step 2: Add TOC page styles**

```css
/* === Table of Contents === */
.toc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 48px 16px 12px; background: var(--bg-surface);
}
.toc-title { font-size: 18px; font-weight: 700; }

.toc-list {
  flex: 1; overflow-y: auto; padding: 0;
  -webkit-overflow-scrolling: touch;
}
.toc-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--border-color);
  cursor: pointer; transition: background 0.15s;
}
.toc-item:active { background: var(--accent-light); }
.toc-item.current { background: var(--accent-light); font-weight: 600; }
.toc-item.read { color: var(--text-secondary); }
.toc-item-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.toc-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-left: 8px;
  background: var(--accent); color: #fff; white-space: nowrap;
}
.toc-badge.read { background: transparent; color: var(--text-secondary); }
```

- [ ] **Step 3: Add settings panel styles**

```css
/* === Settings Overlay === */
.settings-overlay { display: none; position: fixed; inset: 0; z-index: 100; }
.settings-overlay.show { display: block; }
.settings-backdrop { position: absolute; inset: 0; background: var(--overlay); }
.settings-panel {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--bg-card); border-radius: 16px 16px 0 0;
  padding: 20px; animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.settings-title { font-size: 16px; text-align: center; margin-bottom: 16px; }
.settings-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0; border-bottom: 1px solid var(--border-color);
}
.settings-select {
  padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color);
  background: var(--bg-surface); color: var(--text-primary); font-size: 14px;
}

/* Toggle switch */
.toggle { position: relative; display: inline-block; width: 48px; height: 28px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; inset: 0; border-radius: 28px;
  background: var(--border-color); transition: var(--transition); cursor: pointer;
}
.toggle-slider::before {
  content: ''; position: absolute; width: 22px; height: 22px;
  left: 3px; bottom: 3px; border-radius: 50%;
  background: #fff; transition: var(--transition);
}
.toggle input:checked + .toggle-slider { background: var(--accent); }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

.font-size-control { display: flex; align-items: center; gap: 12px; }
.font-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid var(--border-color); background: var(--bg-surface);
  color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer;
}
.font-btn:active { background: var(--accent-light); }
.font-label { font-size: 13px; color: var(--text-secondary); min-width: 36px; text-align: center; }
```

- [ ] **Step 4: Add dialog and toast styles**

```css
/* === Dialog === */
.dialog-overlay { position: fixed; inset: 0; z-index: 200;
  background: var(--overlay); display: flex; align-items: center;
  justify-content: center; }
.dialog-box { background: var(--bg-card); border-radius: 12px;
  padding: 24px; text-align: center; max-width: 280px; width: 80%; }
.dialog-text { font-size: 14px; margin-bottom: 16px; line-height: 1.6; }
.dialog-text small { color: var(--text-secondary); font-size: 12px; }
.dialog-buttons { display: flex; gap: 12px; }
.btn-secondary, .btn-danger {
  flex: 1; padding: 10px; border: none; border-radius: 8px;
  font-size: 14px; cursor: pointer;
}
.btn-secondary { background: var(--bg-surface); color: var(--text-primary); }
.btn-danger { background: #E05555; color: #fff; }

/* === Toast === */
.toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); color: #fff; padding: 10px 24px;
  border-radius: 20px; font-size: 13px; z-index: 300;
  opacity: 0; transition: opacity 0.3s; pointer-events: none;
}
.toast.show { opacity: 1; }

/* === Header back button === */
.header-back { font-size: 15px; color: var(--accent); cursor: pointer; padding: 4px 8px; }
.header-time { font-size: 12px; color: var(--text-secondary); }
```

- [ ] **Step 5: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add bookshelf, TOC, settings, dialog CSS styles"
```

---

### Task 3: CSS — Reader Page Styles and Page Curl Animation

**Files:**
- Modify: `novel-reader/index.html` — add reader styles after previous CSS

- [ ] **Step 1: Add reader layout styles**

```css
/* === Reader === */
.reader-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 48px 16px 8px; background: var(--bg-page);
  opacity: 0; transition: opacity 0.3s; z-index: 10;
}
.reader-header.visible { opacity: 1; }
.header-title { font-size: 13px; color: var(--text-secondary); max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.reader-container {
  flex: 1; overflow: hidden; position: relative;
  perspective: 1200px;
}

.reader-content {
  position: absolute; inset: 0; padding: 16px 20px;
  overflow-y: auto; line-height: 1.9;
  -webkit-overflow-scrolling: touch;
  backface-visibility: hidden;
  transform-origin: left center;
  background: var(--bg-page);
}

/* Scroll mode */
.reader-content.scroll-mode {
  position: relative; overflow-y: auto; height: 100%;
}

.reader-next {
  transform: rotateY(180deg);
}

/* Page curl container */
.page-curl-container {
  position: absolute; inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.page-curl-container.flipped {
  transform: rotateY(-180deg);
}

/* Page curl shadow effect on the flipping page */
.page-curl-shadow {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to right, rgba(0,0,0,0.15), transparent 30%);
  opacity: 0; transition: opacity 0.5s;
}
.page-curl-container.flipped .page-curl-shadow { opacity: 1; }

.reader-footer {
  padding: 8px 20px 20px; text-align: center;
  background: var(--bg-page); opacity: 0; transition: opacity 0.3s;
}
.reader-footer.visible { opacity: 1; }
.progress-bar {
  height: 3px; background: var(--border-color);
  border-radius: 2px; margin-bottom: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--accent);
  border-radius: 2px; transition: width 0.3s;
  width: 0%;
}
.progress-text { font-size: 11px; color: var(--text-secondary); }

/* Page text styles based on font size */
.reader-content.font-sm { font-size: var(--font-size-sm); }
.reader-content.font-md { font-size: var(--font-size-md); }
.reader-content.font-lg { font-size: var(--font-size-lg); }
.reader-content.font-xl { font-size: var(--font-size-xl); }
.reader-content.font-xxl { font-size: var(--font-size-xxl); }

.reader-content p { margin-bottom: 0.8em; text-indent: 2em; }
```

- [ ] **Step 2: Add reader menu styles**

```css
/* === Reader Bottom Menu === */
.reader-menu {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--bg-card); padding: 12px 16px 20px;
  transform: translateY(100%); transition: transform 0.3s ease;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1); z-index: 20;
}
.reader-menu.show { transform: translateY(0); }
.menu-row { display: flex; justify-content: space-around; margin-bottom: 10px; }
.menu-btn {
  background: none; border: none; color: var(--text-primary);
  font-size: 13px; cursor: pointer; padding: 8px 12px;
  border-radius: 8px; transition: background 0.15s;
}
.menu-btn:active { background: var(--accent-light); }
.menu-progress .progress-fill { height: 2px; }
```

- [ ] **Step 3: Add tap zone indicators (development only, remove in production)**

No additional CSS needed — tap zones are handled by JS hit-testing in the reader container.

- [ ] **Step 4: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add reader page styles, page curl animation CSS, and menu styles"
```

---

### Task 4: JavaScript — Storage Manager

**Files:**
- Modify: `novel-reader/index.html` — add JS in `<script>` block

- [ ] **Step 1: Add storage manager code**

Replace the `<script>` placeholder in `index.html` with:

```javascript
// ===== STORAGE MANAGER =====
const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) {
      if (e.name === 'QuotaExceededError') {
        Toast.show('存储空间不足，请清理旧书后重试');
      }
      return false;
    }
  },
  remove(key) { localStorage.removeItem(key); },

  // Books list
  getBooks() { return this.get('novel_books') || []; },
  saveBooks(books) { return this.set('novel_books', books); },

  // Single book meta
  getBookMeta(id) { return this.get('novel_' + id + '_meta'); },
  saveBookMeta(id, meta) { return this.set('novel_' + id + '_meta', meta); },

  // Full text
  getBookText(id) { return localStorage.getItem('novel_' + id + '_text') || ''; },
  saveBookText(id, text) {
    try { localStorage.setItem('novel_' + id + '_text', text); return true; }
    catch (e) { return false; }
  },
  removeBookText(id) { localStorage.removeItem('novel_' + id + '_text'); },

  // Reading progress
  getProgress(id) { return this.get('novel_' + id + '_progress') || { chapterIndex: 0, scrollPos: 0, timestamp: 0 }; },
  saveProgress(id, p) { return this.set('novel_' + id + '_progress', { ...p, timestamp: Date.now() }); },

  // Settings
  getSettings() { return this.get('novel_settings') || { theme: 'day', eyeCare: false, pageMode: 'curl', fontSize: 'md' }; },
  saveSettings(s) { return this.set('novel_settings', s); },

  // Remove entire book
  removeBook(id) {
    this.removeBookText(id);
    this.remove('novel_' + id + '_meta');
    this.remove('novel_' + id + '_progress');
  },

  getStorageUsage() {
    let total = 0;
    for (let k in localStorage) { if (localStorage.hasOwnProperty(k) && k.startsWith('novel_')) { total += localStorage.getItem(k).length; } }
    return total;
  }
};
```

- [ ] **Step 2: Add Toast utility**

```javascript
// ===== TOAST =====
const Toast = {
  timer: null,
  show(msg, duration = 2000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => el.classList.remove('show'), duration);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add Storage manager and Toast utility"
```

---

### Task 5: JavaScript — Chapter Parser

**Files:**
- Modify: `novel-reader/index.html` — add chapter parser after Storage code

- [ ] **Step 1: Add chapter parser**

```javascript
// ===== CHAPTER PARSER =====
const ChapterParser = {
  // Chinese numeral mapping for parsing
  _cnNums: '零一二三四五六七八九十百千',

  parse(text) {
    if (!text || text.trim().length === 0) return [{ title: '正文', start: 0 }];

    const lines = text.split(/\r?\n/);
    const patterns = [
      /^第[0-9零一二三四五六七八九十百千]+[章节卷回集].*/,
      /^Chapter\s+\d+/i,
      /^Ch\.\s*\d+/i,
      /^(序章|楔子|前言|引子|序幕|尾声|后记|终章|结局|番外|外传|附篇).*/,
      /^[一二三四五六七八九十]+[、，.\s].*/,
    ];

    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      for (const pat of patterns) {
        if (pat.test(line)) {
          matches.push({ title: line.slice(0, 40), start: i });
          break;
        }
      }
    }

    // Merge: keep first match for consecutive matches on nearby lines
    const filtered = [];
    for (let i = 0; i < matches.length; i++) {
      if (i === 0 || matches[i].start - matches[i - 1].start > 5) {
        filtered.push(matches[i]);
      }
    }

    // Build chapters: each chapter spans from its start to the next chapter's start
    const chapters = [];
    for (let i = 0; i < filtered.length; i++) {
      const title = filtered[i].title;
      const startIdx = filtered[i].start;
      const endIdx = i + 1 < filtered.length ? filtered[i + 1].start : lines.length;
      const contentLines = lines.slice(startIdx, endIdx);
      const bodyLines = contentLines.slice(1); // skip the title line itself
      const body = bodyLines.join('\n').trim();

      if (body.length >= 50) { // filter empty chapters
        chapters.push({ title, body });
      }
    }

    // If no chapters found, create one chapter with all content
    if (chapters.length === 0) {
      const allText = lines.join('\n').trim();
      if (allText.length >= 50) {
        chapters.push({ title: '正文', body: allText });
      }
    }

    // If still empty (very short text), still create at least one chapter
    if (chapters.length === 0 && text.trim().length > 0) {
      chapters.push({ title: '正文', body: text.trim() });
    }

    return chapters;
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add chapter parser with regex-based detection"
```

---

### Task 6: JavaScript — Bookshelf Logic (Import, Delete, Display)

**Files:**
- Modify: `novel-reader/index.html` — add bookshelf logic

- [ ] **Step 1: Add bookshelf manager**

```javascript
// ===== BOOKSHELF MANAGER =====
const Bookshelf = {
  init() {
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', (e) => {
      if (e.target.files[0]) this.importFile(e.target.files[0]);
      e.target.value = '';
    });
    this.render();
  },

  async importFile(file) {
    if (file.size > 20 * 1024 * 1024) {
      Toast.show('文件过大（超过20MB），请使用较小的文件');
      return;
    }

    Toast.show('正在导入...');

    let text;
    try {
      // Try UTF-8 first
      text = await file.text();
      // Quick check: if garbled, try GBK
      if (this._looksGarbled(text)) {
        const buf = await file.arrayBuffer();
        text = new TextDecoder('gbk').decode(buf);
      }
    } catch {
      Toast.show('文件读取失败，请检查文件格式');
      return;
    }

    if (!text || text.trim().length === 0) {
      Toast.show('文件内容为空');
      return;
    }

    const bookId = 'b_' + Date.now();
    const chapters = ChapterParser.parse(text);

    if (chapters.length === 0) {
      Toast.show('无法识别任何章节内容');
      return;
    }

    // Extract book title from first chapter or filename
    const firstTitle = chapters[0].title;
    const fileName = file.name.replace(/\.(txt|TXT)$/, '');
    const title = firstTitle.includes('章') ? fileName : firstTitle;

    // Save full text
    const saved = Storage.saveBookText(bookId, text);
    if (!saved) {
      Toast.show('存储空间不足，请先清理旧书');
      return;
    }

    // Save metadata (without full text content — that's stored separately)
    const meta = {
      title,
      author: '',
      totalChapters: chapters.length,
      chapterTitles: chapters.map(c => c.title),
      chapterStarts: [], // computed from text when needed
      createdAt: Date.now(),
    };
    Storage.saveBookMeta(bookId, meta);

    // Add to books list
    const books = Storage.getBooks();
    books.push({ id: bookId, title, totalChapters: chapters.length, createdAt: Date.now() });
    Storage.saveBooks(books);

    // Initialize progress
    Storage.saveProgress(bookId, { chapterIndex: 0, scrollPos: 0, timestamp: Date.now() });

    this.render();
    Toast.show('导入成功！共识别 ' + chapters.length + ' 章');
  },

  _looksGarbled(text) {
    // Simple heuristic: if many replacement characters or unusual byte patterns
    const sample = text.slice(0, 500);
    const garbledCount = (sample.match(/[�\x00-\x08\x0b\x0c\x0e-\x1f]/g) || []).length;
    return garbledCount > sample.length * 0.1;
  },

  render() {
    const books = Storage.getBooks();
    const listEl = document.getElementById('book-list');
    const emptyEl = document.getElementById('empty-state');

    if (books.length === 0) {
      emptyEl.classList.add('show');
      listEl.innerHTML = '';
    } else {
      emptyEl.classList.remove('show');
    }

    listEl.innerHTML = books.map(b => {
      const progress = Storage.getProgress(b.id);
      const totalCh = b.totalChapters || 0;
      const pct = totalCh > 0 ? Math.round((progress.chapterIndex / totalCh) * 100) : 0;
      return `
        <div class="book-card" data-id="${b.id}">
          <button class="book-delete" data-action="delete" data-id="${b.id}">×</button>
          <div class="book-cover">📖</div>
          <div class="book-name">${this._esc(b.title)}</div>
          <div class="book-progress">${pct}% · ${totalCh}章</div>
        </div>`;
    }).join('');

    // Click to open book
    listEl.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'delete') return;
        App.openBook(card.dataset.id);
      });

      // Long press for delete
      let pressTimer;
      card.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          // Un-long-press all others first
          listEl.querySelectorAll('.book-card.long-press').forEach(c => c.classList.remove('long-press'));
          card.classList.add('long-press');
        }, 600);
      });
      card.addEventListener('touchend', () => clearTimeout(pressTimer));
      card.addEventListener('touchmove', () => clearTimeout(pressTimer));
    });

    // Delete button clicks
    listEl.querySelectorAll('.book-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._confirmDelete(btn.dataset.id);
      });
    });

    // Hide delete buttons on tap outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.book-card')) {
        listEl.querySelectorAll('.book-card.long-press').forEach(c => c.classList.remove('long-press'));
      }
    });
  },

  _confirmDelete(bookId) {
    const dialog = document.getElementById('delete-dialog');
    dialog.style.display = 'flex';
    document.getElementById('delete-cancel').onclick = () => { dialog.style.display = 'none'; };
    document.getElementById('delete-confirm').onclick = () => {
      const books = Storage.getBooks().filter(b => b.id !== bookId);
      Storage.saveBooks(books);
      Storage.removeBook(bookId);
      dialog.style.display = 'none';
      this.render();
      Toast.show('已删除');
    };
  },

  _esc(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add bookshelf logic with import, delete, and display"
```

---

### Task 7: JavaScript — App Shell and Page Navigation

**Files:**
- Modify: `novel-reader/index.html` — add App object

- [ ] **Step 1: Add App shell with page navigation**

```javascript
// ===== APP SHELL =====
const App = {
  currentBookId: null,

  init() {
    Bookshelf.init();
    this.bindNavigation();
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);
  },

  bindNavigation() {
    // Bookshelf → Reader
    document.getElementById('header-back').addEventListener('click', () => this.showBookshelf());
    // Reader → TOC
    document.getElementById('menu-toc').addEventListener('click', () => this.showTOC());
    // TOC → Reader
    document.getElementById('toc-back').addEventListener('click', () => this.showReader());
    // Reader menu toggle
    const readerContainer = document.getElementById('reader-container');
    readerContainer.addEventListener('click', (e) => this._handleReaderTap(e));
    // Settings
    document.getElementById('menu-settings').addEventListener('click', () => Settings.show());
    document.getElementById('settings-close').addEventListener('click', () => Settings.hide());
    document.querySelector('.settings-backdrop').addEventListener('click', () => Settings.hide());
    // Menu buttons for quick toggle
    document.getElementById('menu-night').addEventListener('click', () => Settings.toggleNight());
    document.getElementById('menu-eye').addEventListener('click', () => Settings.toggleEyeCare());
  },

  showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id + '-page').classList.add('active');
  },

  showBookshelf() {
    this.currentBookId = null;
    this.showPage('bookshelf');
    Bookshelf.render();
  },

  openBook(bookId) {
    this.currentBookId = bookId;
    this.showPage('reader');
    Reader.init(bookId);
  },

  showReader() {
    this.showPage('reader');
  },

  showTOC() {
    const meta = Storage.getBookMeta(this.currentBookId);
    if (!meta) return;
    this.showPage('toc');
    const list = document.getElementById('toc-list');
    const progress = Storage.getProgress(this.currentBookId);
    list.innerHTML = meta.chapterTitles.map((t, i) => {
      let cls = 'toc-item';
      let badge = '';
      if (i === progress.chapterIndex) { cls += ' current'; badge = '<span class="toc-badge">当前</span>'; }
      else if (i < progress.chapterIndex) { cls += ' read'; badge = '<span class="toc-badge read">已读</span>'; }
      return `<div class="${cls}" data-chapter="${i}"><span class="toc-item-title">${Bookshelf._esc(t)}</span>${badge}</div>`;
    }).join('');

    list.querySelectorAll('.toc-item').forEach(item => {
      item.addEventListener('click', () => {
        const chIdx = parseInt(item.dataset.chapter);
        Reader.loadChapter(chIdx);
        this.showReader();
      });
    });
  },

  _handleReaderTap(e) {
    const mode = Storage.getSettings().pageMode;
    if (mode === 'scroll') {
      // In scroll mode, tap middle to toggle menu
      Reader.toggleMenu();
      return;
    }
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w * 0.2) Reader.prevPage();
    else if (x > w * 0.8) Reader.nextPage();
    else Reader.toggleMenu();
  },

  updateClock() {
    const now = new Date();
    document.getElementById('header-time').textContent =
      now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add App shell with page navigation and tap zone handling"
```

---

### Task 8: JavaScript — Reader Engine (Page Curl Mode)

**Files:**
- Modify: `novel-reader/index.html` — add Reader object

- [ ] **Step 1: Add Reader engine**

```javascript
// ===== READER ENGINE =====
const Reader = {
  bookId: null,
  chapterIndex: 0,
  meta: null,
  currentPageContent: '',    // text for current page
  nextPageContent: '',       // text for next page
  currentPageStartPos: 0,    // character offset in chapter body
  isFlipping: false,
  menuVisible: false,
  pageTexts: [],             // pre-paginated text chunks for current chapter
  currentPage: 0,

  init(bookId) {
    this.bookId = bookId;
    this.meta = Storage.getBookMeta(bookId);
    const progress = Storage.getProgress(bookId);
    this.chapterIndex = progress.chapterIndex;
    this.currentPageStartPos = progress.scrollPos || 0;

    const settings = Storage.getSettings();
    this.applySettings(settings);

    // Header title
    const title = this.meta.chapterTitles[this.chapterIndex] || this.meta.title;
    document.getElementById('header-title').textContent = title;

    this.loadChapter(this.chapterIndex, this.currentPageStartPos);
  },

  applySettings(settings) {
    document.body.classList.toggle('night', settings.theme === 'night');
    document.body.classList.toggle('eye-care', settings.eyeCare);
    document.getElementById('setting-night').checked = settings.theme === 'night';
    document.getElementById('setting-eye').checked = settings.eyeCare;
    document.getElementById('setting-pagemode').value = settings.pageMode;

    const content = document.getElementById('reader-content');
    content.className = 'reader-content font-' + (settings.fontSize || 'md');

    if (settings.pageMode === 'scroll') {
      content.classList.add('scroll-mode');
      document.getElementById('reader-next').style.display = 'none';
    } else {
      document.getElementById('reader-next').style.display = '';
    }
  },

  loadChapter(chIdx, startPos = 0) {
    this.chapterIndex = chIdx;
    this.currentPageStartPos = startPos;
    this.currentPage = 0;

    const text = Storage.getBookText(this.bookId);
    const chapters = ChapterParser.parse(text);
    const chapter = chapters[chIdx];
    if (!chapter) return;

    const title = this.meta.chapterTitles[chIdx] || chapter.title;
    document.getElementById('header-title').textContent = title;
    this.meta.chapterTitles[chIdx] = title;

    const mode = Storage.getSettings().pageMode;
    if (mode === 'scroll') {
      this._renderScroll(chapter);
    } else {
      this._paginate(chapter.body);
      this._renderCurlPage();
    }

    this.updateProgress();
    this._saveProgress();
  },

  // Paginate chapter body into screen-sized chunks
  _paginate(body) {
    this.pageTexts = [];
    if (!body || body.trim().length === 0) {
      this.pageTexts = [''];
      return;
    }

    // Estimate chars per page based on font size
    const settings = Storage.getSettings();
    const fontSizeMap = { sm: 14, md: 16, lg: 18, xl: 20, xxl: 22 };
    const fontSize = fontSizeMap[settings.fontSize] || 16;
    const charsPerLine = Math.floor((window.innerWidth - 40) / (fontSize * 0.6));
    const linesPerPage = Math.floor((window.innerHeight - 180) / (fontSize * 1.9));
    const charsPerPage = charsPerLine * linesPerPage;

    // Split by paragraphs first
    const paragraphs = body.split(/\n+/).filter(p => p.trim());
    let currentChunk = '';
    for (const para of paragraphs) {
      const candidate = currentChunk + (currentChunk ? '\n\n' : '') + para;
      if (candidate.length > charsPerPage && currentChunk.length > 0) {
        this.pageTexts.push(currentChunk);
        currentChunk = para;
      } else {
        currentChunk = candidate;
      }
    }
    if (currentChunk) this.pageTexts.push(currentChunk);
    if (this.pageTexts.length === 0) this.pageTexts = [''];
  },

  _renderCurlPage() {
    const contentEl = document.getElementById('reader-content');
    contentEl.classList.remove('scroll-mode');
    document.getElementById('reader-next').style.display = '';

    const text = this.pageTexts[this.currentPage] || '';
    contentEl.innerHTML = this._formatText(text);
    contentEl.scrollTop = 0;

    // Pre-render next page
    if (this.currentPage + 1 < this.pageTexts.length) {
      const nextEl = document.getElementById('reader-next');
      nextEl.innerHTML = this._formatText(this.pageTexts[this.currentPage + 1]);
    }

    this.updateProgress();
  },

  _renderScroll(chapter) {
    const contentEl = document.getElementById('reader-content');
    contentEl.classList.add('scroll-mode');
    document.getElementById('reader-next').style.display = 'none';

    const bodyText = chapter.body || '';
    contentEl.innerHTML = this._formatText(bodyText);
    contentEl.scrollTop = this.currentPageStartPos;

    // Scroll event for saving position and auto-load next chapter
    contentEl.onscroll = () => {
      this.currentPageStartPos = contentEl.scrollTop;
      this._saveProgress();
      this.updateProgress();

      // Near bottom: auto-load next chapter
      const nearBottom = contentEl.scrollTop + contentEl.clientHeight >= contentEl.scrollHeight - 100;
      if (nearBottom && !this._autoLoading && this.chapterIndex + 1 < this.meta.totalChapters) {
        this._autoLoading = true;
        this.chapterIndex++;
        this.currentPageStartPos = 0;
        const text = Storage.getBookText(this.bookId);
        const chapters = ChapterParser.parse(text);
        const chapter = chapters[this.chapterIndex];
        if (chapter) {
          const title = this.meta.chapterTitles[this.chapterIndex] || chapter.title;
          document.getElementById('header-title').textContent = title;
          contentEl.innerHTML = this._formatText(chapter.body || '');
          contentEl.scrollTop = 0;
          this.updateProgress();
          this._saveProgress();
        }
        // Debounce auto-load
        setTimeout(() => { this._autoLoading = false; }, 500);
      }
    };
  },

  _formatText(text) {
    if (!text) return '<p style="color:var(--text-secondary)">（本章内容为空）</p>';
    const paragraphs = text.split(/\n+/).filter(p => p.trim());
    return paragraphs.map(p => `<p>${this._escHtml(p.trim())}</p>`).join('');
  },

  _escHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  },

  nextPage() {
    const mode = Storage.getSettings().pageMode;
    if (mode === 'scroll') return; // scroll mode handles itself

    if (this.currentPage + 1 < this.pageTexts.length) {
      this._animateFlip('next');
    } else if (this.chapterIndex + 1 < this.meta.totalChapters) {
      // Next chapter
      this.loadChapter(this.chapterIndex + 1, 0);
    } else {
      Toast.show('已经是最后一页了');
    }
  },

  prevPage() {
    const mode = Storage.getSettings().pageMode;
    if (mode === 'scroll') return;

    if (this.currentPage > 0) {
      this._animateFlip('prev');
    } else if (this.chapterIndex > 0) {
      this.loadChapter(this.chapterIndex - 1, 0);
      // Jump to last page of previous chapter
      this.currentPage = this.pageTexts.length - 1;
      this._renderCurlPage();
    } else {
      Toast.show('已经是第一页了');
    }
  },

  _animateFlip(direction) {
    if (this.isFlipping) return;
    this.isFlipping = true;

    const container = document.getElementById('reader-container');
    const content = document.getElementById('reader-content');
    const next = document.getElementById('reader-next');

    if (direction === 'next') {
      this.currentPage++;
      // Prepare next page content in the "back" div
      const nextText = this.pageTexts[this.currentPage] || '';
      next.innerHTML = this._formatText(nextText);
      next.scrollTop = 0;

      // Create flip container
      const flipWrap = document.createElement('div');
      flipWrap.className = 'page-curl-container';
      flipWrap.style.cssText = 'position:absolute;inset:0;z-index:5;';
      content.parentNode.insertBefore(flipWrap, content);
      flipWrap.appendChild(content);

      // Trigger flip
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flipWrap.classList.add('flipped');
        });
      });

      // After animation
      setTimeout(() => {
        // Move content back and update
        flipWrap.parentNode.insertBefore(content, flipWrap);
        flipWrap.remove();
        content.innerHTML = this._formatText(this.pageTexts[this.currentPage]);
        content.scrollTop = 0;
        next.innerHTML = this._formatText(this.pageTexts[this.currentPage + 1] || '');
        this.updateProgress();
        this._saveProgress();
        this.isFlipping = false;
      }, 500);
    } else {
      // prev — simpler: just show the previous page
      this.currentPage--;
      content.innerHTML = this._formatText(this.pageTexts[this.currentPage]);
      content.scrollTop = 0;
      next.innerHTML = this._formatText(this.pageTexts[this.currentPage + 1] || '');
      this.updateProgress();
      this._saveProgress();
      this.isFlipping = false;
    }
  },

  toggleMenu() {
    const menu = document.getElementById('reader-menu');
    const header = document.getElementById('reader-header');
    const footer = document.getElementById('reader-footer');
    this.menuVisible = !this.menuVisible;
    menu.classList.toggle('show', this.menuVisible);
    header.classList.toggle('visible', this.menuVisible);
    footer.classList.toggle('visible', this.menuVisible);
  },

  updateProgress() {
    const mode = Storage.getSettings().pageMode;
    let chapterProg = 0;
    if (mode === 'scroll') {
      const el = document.getElementById('reader-content');
      if (el.scrollHeight > el.clientHeight) {
        chapterProg = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      }
    } else {
      chapterProg = this.pageTexts.length > 1
        ? Math.round((this.currentPage / (this.pageTexts.length - 1)) * 100) : 0;
    }
    const totalCh = this.meta.totalChapters || 1;
    const bookProg = Math.round(((this.chapterIndex + chapterProg / 100) / totalCh) * 100);

    document.getElementById('progress-fill').style.width = chapterProg + '%';
    document.getElementById('menu-progress-fill').style.width = chapterProg + '%';
    document.getElementById('progress-text').textContent =
      (this.meta.chapterTitles[this.chapterIndex] || '') + ' · ' + bookProg + '%';
  },

  _saveProgress() {
    if (!this.bookId) return;
    Storage.saveProgress(this.bookId, {
      chapterIndex: this.chapterIndex,
      scrollPos: this.currentPageStartPos,
      timestamp: Date.now(),
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add reader engine with page curl and scroll modes"
```

---

### Task 9: JavaScript — Settings Panel Logic

**Files:**
- Modify: `novel-reader/index.html` — add Settings object

- [ ] **Step 1: Add Settings manager**

```javascript
// ===== SETTINGS MANAGER =====
const Settings = {
  _fontLabels: ['小', '较小', '标准', '较大', '大'],
  _fontValues: ['sm', 'sm', 'md', 'lg', 'xl', 'xxl'], // indexed by fontIndex

  init() {
    const s = Storage.getSettings();
    this._applyToUI(s);

    document.getElementById('setting-night').addEventListener('change', (e) => {
      this._update('theme', e.target.checked ? 'night' : 'day');
      this._apply();
    });
    document.getElementById('setting-eye').addEventListener('change', (e) => {
      this._update('eyeCare', e.target.checked);
      this._apply();
    });
    document.getElementById('setting-pagemode').addEventListener('change', (e) => {
      this._update('pageMode', e.target.value);
      document.getElementById('menu-night').textContent =
        e.target.value === 'scroll' ? '🌙 夜间' : '🌙 夜间';
      this._apply();
      // Reload reader if open
      if (App.currentBookId) {
        Reader.loadChapter(Reader.chapterIndex, 0);
      }
    });

    let fontIdx = 2; // default "标准" = md
    document.getElementById('font-down').addEventListener('click', () => {
      const s = Storage.getSettings();
      const currentVal = s.fontSize || 'md';
      const currentIdx = ['sm', 'md', 'lg', 'xl', 'xxl'].indexOf(currentVal);
      const newIdx = Math.max(0, currentIdx - 1);
      const newVal = ['sm', 'md', 'lg', 'xl', 'xxl'][newIdx];
      this._update('fontSize', newVal);
      document.getElementById('font-label').textContent = this._fontLabels[newIdx];
      this._apply();
      if (App.currentBookId) Reader.loadChapter(Reader.chapterIndex, Reader.currentPageStartPos);
    });
    document.getElementById('font-up').addEventListener('click', () => {
      const s = Storage.getSettings();
      const currentVal = s.fontSize || 'md';
      const currentIdx = ['sm', 'md', 'lg', 'xl', 'xxl'].indexOf(currentVal);
      const newIdx = Math.min(4, currentIdx + 1);
      const newVal = ['sm', 'md', 'lg', 'xl', 'xxl'][newIdx];
      this._update('fontSize', newVal);
      document.getElementById('font-label').textContent = this._fontLabels[newIdx];
      this._apply();
      if (App.currentBookId) Reader.loadChapter(Reader.chapterIndex, Reader.currentPageStartPos);
    });

    // Init font label
    const curVal = s.fontSize || 'md';
    const curIdx = ['sm', 'md', 'lg', 'xl', 'xxl'].indexOf(curVal);
    document.getElementById('font-label').textContent = this._fontLabels[curIdx];
  },

  show() {
    const s = Storage.getSettings();
    this._applyToUI(s);
    document.getElementById('settings-overlay').classList.add('show');
  },

  hide() {
    document.getElementById('settings-overlay').classList.remove('show');
  },

  toggleNight() {
    const s = Storage.getSettings();
    s.theme = s.theme === 'night' ? 'day' : 'night';
    Storage.saveSettings(s);
    this._apply();
  },

  toggleEyeCare() {
    const s = Storage.getSettings();
    s.eyeCare = !s.eyeCare;
    Storage.saveSettings(s);
    this._apply();
  },

  _applyToUI(s) {
    document.getElementById('setting-night').checked = s.theme === 'night';
    document.getElementById('setting-eye').checked = s.eyeCare;
    document.getElementById('setting-pagemode').value = s.pageMode || 'curl';
  },

  _update(key, value) {
    const s = Storage.getSettings();
    s[key] = value;
    Storage.saveSettings(s);
  },

  _apply() {
    const s = Storage.getSettings();
    document.body.classList.toggle('night', s.theme === 'night');
    document.body.classList.toggle('eye-care', s.eyeCare);
    if (App.currentBookId) {
      Reader.applySettings(s);
    }
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: add settings panel logic with theme, eye-care, page mode, font size"
```

---

### Task 10: JavaScript — Wire Up App Initialization

**Files:**
- Modify: `novel-reader/index.html` — add init call at end of script

- [ ] **Step 1: Add init call at end of script block**

At the very end of the `<script>` block, add:

```javascript
// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved settings on load
  const settings = Storage.getSettings();
  document.body.classList.toggle('night', settings.theme === 'night');
  document.body.classList.toggle('eye-care', settings.eyeCare);

  Settings.init();
  App.init();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            Toast.show('有新版本可用，请刷新页面');
          }
        });
      });
    }).catch(() => {});
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html && git commit -m "feat: wire up app initialization and service worker registration"
```

---

### Task 11: Service Worker Implementation

**Files:**
- Modify: `novel-reader/sw.js` — replace placeholder with full implementation

- [ ] **Step 1: Write full Service Worker**

Replace `novel-reader/sw.js`:

```javascript
const CACHE_NAME = 'novel-reader-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Static assets: cache first
  if (ASSETS.includes(url.pathname) || url.pathname.startsWith('./icons/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  } else {
    // Other requests: network first, fallback to cache
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/sw.js && git commit -m "feat: implement service worker with cache-first strategy for offline support"
```

---

### Task 12: Generate PWA Icons

**Files:**
- Create: `novel-reader/icons/generate-icons.js`
- Create: `novel-reader/icons/icon-192.png`
- Create: `novel-reader/icons/icon-512.png`

- [ ] **Step 1: Write icon generator script**

Write `novel-reader/icons/generate-icons.js`:

```javascript
// Run: node novel-reader/icons/generate-icons.js
// Generates minimal valid PNG icons for the PWA manifest.
const fs = require('fs');
const path = require('path');
const { createCanvas } = (() => { try { return require('canvas'); } catch { return null; } })();

function createMinimalPNG(size) {
  // Create a minimal valid PNG with a solid color and book icon
  // PNG signature + IHDR + IDAT + IEND chunks
  // For simplicity, generate a 1-pixel PNG scaled — or create a proper one with zlib

  // Since we may not have node-canvas, create a simple SVG-based approach:
  // Actually, let's just create a data-driven PNG.
  // Simplest approach: hardcode a minimal valid 192x192 and 512x512 PNG
  // using raw bytes.

  // For a real implementation, we'd use the Canvas API.
  // Here we create a script that outputs base64-encoded simple icons.

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#C9A96E"/>
    <rect x="${size*0.25}" y="${size*0.2}" width="${size*0.5}" height="${size*0.6}" fill="#FFF" rx="${size*0.04}"/>
    <rect x="${size*0.22}" y="${size*0.2}" width="${size*0.06}" height="${size*0.6}" fill="#8B6914" rx="${size*0.02}"/>
    <line x1="${size*0.33}" y1="${size*0.33}" x2="${size*0.67}" y2="${size*0.33}" stroke="#C9A96E" stroke-width="${size*0.02}"/>
    <line x1="${size*0.33}" y1="${size*0.43}" x2="${size*0.67}" y2="${size*0.43}" stroke="#C9A96E" stroke-width="${size*0.02}"/>
    <line x1="${size*0.33}" y1="${size*0.53}" x2="${size*0.67}" y2="${size*0.53}" stroke="#C9A96E" stroke-width="${size*0.02}"/>
    <line x1="${size*0.33}" y1="${size*0.63}" x2="${size*0.6}" y2="${size*0.63}" stroke="#C9A96E" stroke-width="${size*0.02}"/>
    <polygon points="${size*0.75},${size*0.2} ${size*0.68},${size*0.38} ${size*0.75},${size*0.3}" fill="#E05555"/>
  </svg>`;

  return Buffer.from(svg);
}

// Generate SVG files as fallback (browsers can use these if PNGs unavailable)
// For proper PWA, we create base64 PNGs from a simple HTML canvas approach.
// Generate minimal valid PNGs using raw bytes.

function makePNG(size) {
  // Create a minimal PNG file using raw bytes
  // This creates a solid-color PNG of the given size

  const zlib = require('zlib');

  // Build raw image data (RGBA)
  const rawData = Buffer.alloc((size * size * 3) + size); // RGB + filter byte per row
  const gold = [0xC9, 0xA9, 0x6E];
  const white = [0xFF, 0xFF, 0xFF];
  const darkGold = [0x8B, 0x69, 0x14];

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    rawData[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3;
      // Book shape area (white)
      const inBook = x >= size * 0.25 && x <= size * 0.75 &&
                     y >= size * 0.2 && y <= size * 0.8;
      // Spine area
      const inSpine = x >= size * 0.22 && x <= size * 0.28 &&
                      y >= size * 0.2 && y <= size * 0.8;
      if (inSpine) { rawData[px] = darkGold[0]; rawData[px+1] = darkGold[1]; rawData[px+2] = darkGold[2]; }
      else if (inBook) { rawData[px] = white[0]; rawData[px+1] = white[1]; rawData[px+2] = white[2]; }
      else { rawData[px] = gold[0]; rawData[px+1] = gold[1]; rawData[px+2] = gold[2]; }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Build PNG
  const chunks = [];
  // Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  chunks.push(sig);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeB, data]));
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  chunks.push(chunk('IHDR', ihdr));
  chunks.push(chunk('IDAT', deflated));
  chunks.push(chunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } table[n] = c; }
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) { c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'icon-192.png'), makePNG(192));
fs.writeFileSync(path.join(dir, 'icon-512.png'), makePNG(512));
console.log('Icons generated: icon-192.png, icon-512.png');
```

- [ ] **Step 2: Run the icon generator**

```bash
node novel-reader/icons/generate-icons.js
```

Expected output: `Icons generated: icon-192.png, icon-512.png`

- [ ] **Step 3: Clean up — remove the generator script (optional, keep for future use)**

```bash
# Keep generate-icons.js for future icon regeneration
```

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head><body>
<canvas id="c192" width="192" height="192"></canvas>
<canvas id="c512" width="512" height="512"></canvas>
<script>
function drawIcon(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  // Background
  ctx.fillStyle = '#C9A96E';
  ctx.fillRect(0, 0, w, h);
  // Book shape
  const bw = w * 0.45, bh = h * 0.55;
  const bx = (w - bw) / 2, by = (h - bh) / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(bx, by, bw, bh);
  // Book spine
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(bx - bw * 0.06, by, bw * 0.08, bh);
  // Lines on pages
  ctx.strokeStyle = '#C9A96E';
  ctx.lineWidth = w * 0.015;
  for (let i = 0; i < 4; i++) {
    const ly = by + bh * 0.2 + i * bh * 0.18;
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.15, ly);
    ctx.lineTo(bx + bw * 0.85, ly);
    ctx.stroke();
  }
  // Bookmark ribbon
  ctx.fillStyle = '#E05555';
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.85, by);
  ctx.lineTo(bx + bw * 0.75, by + bh * 0.25);
  ctx.lineTo(bx + bw * 0.85, by + bh * 0.15);
  ctx.fill();
}
drawIcon(document.getElementById('c192'));
drawIcon(document.getElementById('c512'));
// Auto-download
function download(canvas, name) {
  canvas.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = name;
    a.click();
  });
}
setTimeout(() => {
  download(document.getElementById('c192'), 'icon-192.png');
  download(document.getElementById('c512'), 'icon-512.png');
}, 500);
</script>
<p>Icons generated and downloading. Save them to novel-reader/icons/</p>
</body></html>
```

- [ ] **Step 4: Commit**

```bash
git add novel-reader/icons/ && git commit -m "feat: add PWA icon generator and generated icons"
```

---

### Task 13: Integration Testing and Edge Case Handling

**Files:**
- Modify: `novel-reader/index.html` — final polish and edge case fixes

- [ ] **Step 1: Verify all features work end-to-end**

Manual test checklist:
1. Open index.html in mobile browser (or Chrome DevTools mobile view)
2. Import a TXT file — verify chapter detection and bookshelf display
3. Open the book — verify reading from chapter 1
4. Tap right side — verify page flip
5. Tap middle — verify menu appears with 4 buttons
6. Tap TOC — verify chapter list with current chapter highlighted
7. Tap a different chapter — verify jump
8. Open settings — toggle night mode, eye care, page mode, font size
9. In scroll mode — verify vertical scrolling
10. Close and reopen browser — verify reading position restored
11. Delete a book — verify confirmation dialog and removal
12. Import multiple books — verify bookshelf shows all

- [ ] **Step 2: Fix edge cases discovered during testing**

Common edge cases to verify:
- Empty TXT file → "无法识别任何章节内容"
- File with no chapter headings → single "正文" chapter
- Very short chapters (< 50 chars body) → filtered out
- localStorage full → error toast
- GBK encoded files → auto-detected and decoded
- Rapid tapping during page flip → debounced (isFlipping flag)

- [ ] **Step 3: Final commit with any fixes**

```bash
git add novel-reader/ && git commit -m "fix: edge case handling and final polish"
```

---

### Task 14: Add .superpowers to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add .superpowers to .gitignore**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore && git commit -m "chore: add .superpowers to gitignore"
```
