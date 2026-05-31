# Novel Reader v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the novel reader as a clean single-file HTML app with scroll-only reading, chapter flow, and full theme support.

**Architecture:** Single `index.html` with inline CSS/JS. Four page views toggled via CSS classes. localStorage for all data. Capacitor wraps for Android APK.

**Tech Stack:** Vanilla HTML/CSS/JS, Capacitor 8.x, Android SDK

---

### Task 1: Write HTML skeleton and CSS theme system

**Files:**
- Rewrite: `novel-reader/index.html`

The file starts with `<!DOCTYPE html>` through the end of `</style>`. This task writes the document head, CSS reset, theme variables, eye-care overlay, page switching, and all component styles.

- [ ] **Step 1: Write the full `<!DOCTYPE html>` through `</style>`**

Write `novel-reader/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#F5F0E8">
<link rel="manifest" href="./manifest.json">
<title>小说阅读器</title>
<style>
/* === Reset === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* === Theme Variables === */
:root {
  --font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  --font-size: 18px;
  --line-height: 1.9;
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

/* === Page Switching === */
.page { display: none; position: fixed; inset: 0; overflow: hidden; flex-direction: column; }
.page.active { display: flex; }

/* === Bookshelf === */
.shelf-header { text-align: center; padding: 14px 20px; }
.shelf-header h1 { font-size: 18px; font-weight: 700; letter-spacing: 2px; }

.book-grid { flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }

.book-card { background: var(--bg-card); border-radius: 10px; padding: 16px 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative; }
.book-card:active { transform: scale(0.97); }
.book-cover { width: 56px; height: 76px; margin: 0 auto 8px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.book-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
.book-meta { font-size: 11px; color: var(--text-secondary); }
.book-delete { position: absolute; top: 4px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,0,0,0.1); color: #E05555; border: none; font-size: 14px; line-height: 24px; display: none; }
.book-card.long-press .book-delete { display: block; }

.empty-state { display: none; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 40px; text-align: center; }
.empty-state.show { display: flex; }
.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.6; }
.empty-text { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.empty-hint { font-size: 13px; color: var(--text-secondary); }

.shelf-footer { padding: 12px 20px 24px; }
.btn-import { display: block; width: 100%; padding: 12px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 1px; text-align: center; }
.btn-import:active { opacity: 0.85; }

/* === Reader === */
.reader-header { display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 12px; color: var(--text-secondary); z-index: 10; }
.reader-header .header-back { font-size: 14px; cursor: pointer; padding: 4px 4px 4px 0; line-height: 1; }
.reader-header .header-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; }

.reader-content { flex: 1; overflow-y: auto; padding: 1.8em 16px; font-size: var(--font-size); line-height: var(--line-height); -webkit-overflow-scrolling: touch; }
.reader-content p { margin-bottom: 0.8em; text-indent: 2em; }

.chapter-divider { text-align: center; font-size: 15px; font-weight: 700; padding: 28px 0 14px; color: var(--accent); letter-spacing: 2px; }

/* Reader bottom menu */
.reader-menu { position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg-card); padding: 12px 16px 20px; transform: translateY(100%); transition: transform 0.3s ease; box-shadow: 0 -2px 12px rgba(0,0,0,0.1); z-index: 20; }
.reader-menu.show { transform: translateY(0); }
.menu-row { display: flex; justify-content: space-around; margin-bottom: 10px; }
.menu-btn { background: none; border: none; color: var(--text-primary); font-size: 13px; padding: 8px 12px; border-radius: 8px; }
.menu-btn:active { background: var(--accent-light); }
.menu-progress { height: 3px; background: var(--border-color); border-radius: 2px; overflow: hidden; }
.menu-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; width: 0%; transition: width 0.3s; }
.menu-progress-text { font-size: 11px; color: var(--text-secondary); text-align: center; margin-top: 6px; }

/* === TOC === */
.toc-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; }
.toc-header .header-back { font-size: 14px; color: var(--text-secondary); cursor: pointer; }
.toc-header .toc-title { font-size: 17px; font-weight: 700; }
.toc-header .toc-spacer { width: 36px; }

.toc-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.toc-item { display: flex; align-items: center; justify-content: space-between; padding: 13px 18px; border-bottom: 1px solid var(--border-color); font-size: 14px; }
.toc-item:active { background: var(--accent-light); }
.toc-item.current { background: var(--accent-light); font-weight: 600; }
.toc-item.read { color: var(--text-secondary); }
.toc-item-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toc-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; white-space: nowrap; }
.toc-badge.current { background: var(--accent); color: #fff; }
.toc-badge.read { color: var(--text-secondary); }

/* === Settings === */
.settings-overlay { display: none; position: fixed; inset: 0; z-index: 100; }
.settings-overlay.show { display: block; }
.settings-backdrop { position: absolute; inset: 0; background: var(--overlay); }
.settings-panel { position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg-card); border-radius: 16px 16px 0 0; padding: 20px; transform: translateY(100%); animation: slideUp 0.3s ease forwards; }
.settings-overlay.show .settings-panel { transform: translateY(0); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.settings-title { font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 16px; }
.settings-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color); }

/* Toggle */
.toggle { position: relative; display: inline-block; width: 48px; height: 28px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; inset: 0; border-radius: 28px; background: var(--border-color); transition: 0.3s; }
.toggle-slider::before { content: ''; position: absolute; width: 22px; height: 22px; left: 3px; bottom: 3px; border-radius: 50%; background: #fff; transition: 0.3s; }
.toggle input:checked + .toggle-slider { background: var(--accent); }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

/* Font size controls */
.font-row { display: flex; align-items: center; gap: 12px; }
.font-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); font-size: 14px; font-weight: 700; }
.font-btn:active { background: var(--accent-light); }
.font-label { font-size: 13px; color: var(--text-secondary); min-width: 36px; text-align: center; }

.btn-done { display: block; width: 100%; margin-top: 12px; padding: 12px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; }
.btn-done:active { opacity: 0.85; }

/* === Dialog === */
.dialog-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: var(--overlay); align-items: center; justify-content: center; }
.dialog-overlay.show { display: flex; }
.dialog-box { background: var(--bg-card); border-radius: 12px; padding: 24px; text-align: center; max-width: 280px; width: 80%; }
.dialog-text { font-size: 14px; margin-bottom: 16px; line-height: 1.6; }
.dialog-text small { color: var(--text-secondary); font-size: 12px; }
.dialog-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; background: var(--bg-surface); color: var(--text-primary); }
.btn-danger { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; background: #E05555; color: #fff; }

/* === Toast === */
.toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 10px 24px; border-radius: 20px; font-size: 13px; z-index: 300; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.toast.show { opacity: 1; }

/* === Font size utility classes === */
.font-sm { --font-size: 14px; }
.font-md { --font-size: 16px; }
.font-lg { --font-size: 18px; }
.font-xl { --font-size: 20px; }
.font-xxl { --font-size: 22px; }
</style>
</head>
```

- [ ] **Step 2: Verify the file opens without errors**

Open `novel-reader/index.html` in a browser. Page should render blank (no body content yet).

- [ ] **Step 3: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add HTML skeleton and CSS theme system"
```

---

### Task 2: Write HTML body structure

**Files:**
- Modify: `novel-reader/index.html` — append `<body>` through the toast div

- [ ] **Step 1: Append the body HTML between `</head>` and before `<script>`**

Insert after `</head>`:

```html
<body>

<!-- Bookshelf -->
<div id="shelf-page" class="page active">
  <div class="shelf-header"><h1>我的书架</h1></div>
  <div id="book-grid" class="book-grid"></div>
  <div id="empty-state" class="empty-state">
    <div class="empty-icon">📚</div>
    <p class="empty-text">书架空空如也</p>
    <p class="empty-hint">点击下方按钮导入你的第一本小说</p>
  </div>
  <div class="shelf-footer">
    <button id="btn-import" class="btn-import">导入小说</button>
    <input type="file" id="file-input" accept=".txt,text/plain" style="display:none">
  </div>
</div>

<!-- Reader -->
<div id="reader-page" class="page">
  <div class="reader-header">
    <span id="reader-back" class="header-back">←</span>
    <span id="reader-chapter" class="header-title"></span>
  </div>
  <div id="reader-content" class="reader-content"></div>
  <div id="reader-menu" class="reader-menu">
    <div class="menu-row">
      <button id="menu-toc" class="menu-btn">📑 目录</button>
      <button id="menu-theme" class="menu-btn">🌙 夜间</button>
      <button id="menu-eye" class="menu-btn">🛡️ 护眼</button>
      <button id="menu-settings" class="menu-btn">⚙️ 设置</button>
    </div>
    <div class="menu-progress"><div id="menu-progress-fill" class="menu-progress-fill"></div></div>
    <div id="menu-progress-text" class="menu-progress-text"></div>
  </div>
</div>

<!-- TOC -->
<div id="toc-page" class="page">
  <div class="toc-header">
    <span id="toc-back" class="header-back">←</span>
    <span class="toc-title">目录</span>
    <span class="toc-spacer"></span>
  </div>
  <div id="toc-list" class="toc-list"></div>
</div>

<!-- Settings overlay -->
<div id="settings-overlay" class="settings-overlay">
  <div class="settings-backdrop"></div>
  <div class="settings-panel">
    <div class="settings-title">阅读设置</div>
    <div class="settings-row">
      <span>🌙 夜间模式</span>
      <label class="toggle"><input type="checkbox" id="setting-night"><span class="toggle-slider"></span></label>
    </div>
    <div class="settings-row">
      <span>🛡️ 护眼模式</span>
      <label class="toggle"><input type="checkbox" id="setting-eye"><span class="toggle-slider"></span></label>
    </div>
    <div class="settings-row">
      <span>🔤 字号</span>
      <div class="font-row">
        <button id="font-down" class="font-btn">A-</button>
        <span id="font-label" class="font-label">标准</span>
        <button id="font-up" class="font-btn">A+</button>
      </div>
    </div>
    <button id="settings-done" class="btn-done">完成</button>
  </div>
</div>

<!-- Delete dialog -->
<div id="delete-dialog" class="dialog-overlay">
  <div class="dialog-box">
    <p class="dialog-text">确定要删除这本书吗？<br><small>此操作不可恢复</small></p>
    <div class="dialog-actions">
      <button id="delete-cancel" class="btn-cancel">取消</button>
      <button id="delete-confirm" class="btn-danger">删除</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="toast"></div>
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add HTML body structure for all pages"
```

---

### Task 3: Write Storage, Toast, and ChapterParser modules

**Files:**
- Modify: `novel-reader/index.html` — append `<script>` section with these three modules

- [ ] **Step 1: Append opening `<script>` tag and Storage module**

After the toast div, before `</body>`:

```html
<script>
// ===== STORAGE =====
const S = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { if (e.name === 'QuotaExceededError') T.show('存储空间不足'); return false; }
  },
  remove(k) { localStorage.removeItem(k); },

  books() { return this.get('novel_books') || []; },
  saveBooks(v) { return this.set('novel_books', v); },

  meta(id) { return this.get('novel_' + id + '_meta'); },
  saveMeta(id, v) { return this.set('novel_' + id + '_meta', v); },

  text(id) { return localStorage.getItem('novel_' + id + '_text') || ''; },
  saveText(id, v) {
    try { localStorage.setItem('novel_' + id + '_text', v); return true; }
    catch (e) { return false; }
  },
  removeText(id) { localStorage.removeItem('novel_' + id + '_text'); },

  progress(id) { return this.get('novel_' + id + '_progress') || { chapterIndex: 0, scrollPos: 0 }; },
  saveProgress(id, v) { return this.set('novel_' + id + '_progress', { ...v, timestamp: Date.now() }); },

  settings() { return this.get('novel_settings') || { theme: 'day', eyeCare: false, fontSize: 'lg' }; },
  saveSettings(v) { return this.set('novel_settings', v); },

  removeBook(id) {
    this.removeText(id);
    this.remove('novel_' + id + '_meta');
    this.remove('novel_' + id + '_progress');
  }
};
```

- [ ] **Step 2: Append Toast module**

```javascript
// ===== TOAST =====
const T = {
  _timer: null,
  show(msg, ms = 2000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => el.classList.remove('show'), ms);
  }
};
```

- [ ] **Step 3: Append ChapterParser module**

```javascript
// ===== CHAPTER PARSER =====
const Parser = {
  parse(text) {
    if (!text || !text.trim()) return [];

    const lines = text.split(/\r?\n/);
    const pats = [
      /^第[0-9零一二三四五六七八九十百千]+[章节卷回集].*/,
      /^Chapter\s+\d+/i,
      /^Ch\.\s*\d+/i,
      /^(序章|楔子|前言|引子|序幕|尾声|后记|终章|结局|番外|外传|附篇).*/,
      /^[一二三四五六七八九十]+[、，.\s].*/,
    ];

    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      for (const p of pats) {
        if (p.test(line)) { hits.push({ title: line.slice(0, 40), idx: i }); break; }
      }
    }

    const filtered = [];
    for (let i = 0; i < hits.length; i++) {
      if (i === 0 || hits[i].idx - hits[i - 1].idx > 5) filtered.push(hits[i]);
    }

    const chs = [];
    for (let i = 0; i < filtered.length; i++) {
      const start = filtered[i].idx;
      const end = i + 1 < filtered.length ? filtered[i + 1].idx : lines.length;
      const body = lines.slice(start + 1, end).join('\n').trim();
      if (body.length >= 50) chs.push({ title: filtered[i].title, body });
    }

    if (chs.length === 0 && text.trim().length > 0) {
      chs.push({ title: '正文', body: text.trim() });
    }
    return chs;
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add Storage, Toast, and ChapterParser modules"
```

---

### Task 4: Write Bookshelf page logic

**Files:**
- Modify: `novel-reader/index.html` — append Bookshelf object

- [ ] **Step 1: Append Bookshelf module**

```javascript
// ===== BOOKSHELF =====
const Shelf = {
  init() {
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', e => {
      if (e.target.files[0]) this.importFile(e.target.files[0]);
      e.target.value = '';
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.book-card')) {
        document.querySelectorAll('.book-card.long-press').forEach(c => c.classList.remove('long-press'));
      }
    });
    this.render();
  },

  async importFile(file) {
    if (file.size > 20 * 1024 * 1024) { T.show('文件过大（超过20MB）'); return; }
    T.show('正在导入...');

    let text;
    try { text = await file.text(); }
    catch { T.show('文件读取失败，请检查编码'); return; }

    if (!text || !text.trim()) { T.show('文件内容为空'); return; }

    const chs = Parser.parse(text);
    if (!chs.length) { T.show('无法识别任何章节内容'); return; }

    const name = file.name.replace(/\.(txt|TXT)$/, '');
    const first = chs[0].title;
    const title = first.includes('章') ? name : first;
    const id = 'b_' + Date.now();

    if (!S.saveText(id, text)) { T.show('存储空间不足，请先清理旧书'); return; }

    const meta = { title, chapterTitles: chs.map(c => c.title), totalChapters: chs.length, createdAt: Date.now() };
    S.saveMeta(id, meta);

    const books = S.books();
    books.push({ id, title, totalChapters: chs.length, createdAt: Date.now() });
    S.saveBooks(books);
    S.saveProgress(id, { chapterIndex: 0, scrollPos: 0 });

    this.render();
    T.show('导入成功！共 ' + chs.length + ' 章');
  },

  render() {
    const books = S.books();
    const grid = document.getElementById('book-grid');
    const empty = document.getElementById('empty-state');

    if (!books.length) {
      empty.classList.add('show');
      grid.innerHTML = '';
      return;
    }
    empty.classList.remove('show');

    grid.innerHTML = books.map(b => {
      const prog = S.progress(b.id);
      const total = b.totalChapters || 1;
      const pct = Math.round((prog.chapterIndex / total) * 100);
      const currentTitle = (S.meta(b.id)?.chapterTitles || [])[prog.chapterIndex] || '';
      const colors = ['#C9A96E,#8B6914', '#7B8FB2,#4A6078', '#8B7D6B,#5C5443', '#6B8E6B,#3D5A3D'];
      const c = colors[Math.abs(b.id.charCodeAt(b.id.length - 1)) % colors.length];
      return `<div class="book-card" data-id="${b.id}">
        <button class="book-delete" data-action="delete" data-id="${b.id}">×</button>
        <div class="book-cover" style="background:linear-gradient(135deg,${c})">📖</div>
        <div class="book-name">${esc(b.title)}</div>
        <div class="book-meta">${pct}% · ${b.totalChapters}章</div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.dataset.action === 'delete') return;
        App.openBook(card.dataset.id);
      });
      let t;
      card.addEventListener('touchstart', () => { t = setTimeout(() => {
        grid.querySelectorAll('.book-card.long-press').forEach(c => c.classList.remove('long-press'));
        card.classList.add('long-press');
      }, 600); });
      card.addEventListener('touchend', () => clearTimeout(t));
      card.addEventListener('touchmove', () => clearTimeout(t));
    });

    grid.querySelectorAll('.book-delete').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.confirmDelete(btn.dataset.id);
      });
    });
  },

  confirmDelete(id) {
    const dlg = document.getElementById('delete-dialog');
    dlg.classList.add('show');
    document.getElementById('delete-cancel').onclick = () => dlg.classList.remove('show');
    document.getElementById('delete-confirm').onclick = () => {
      const books = S.books().filter(b => b.id !== id);
      S.saveBooks(books);
      S.removeBook(id);
      dlg.classList.remove('show');
      this.render();
      T.show('已删除');
    };
  }
};
```

This references `esc()` — add this utility after ChapterParser and before Bookshelf:

```javascript
// ===== UTILITY =====
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add Bookshelf page logic with import and delete"
```

---

### Task 5: Write Reader page logic

**Files:**
- Modify: `novel-reader/index.html` — append Reader object

- [ ] **Step 1: Append Reader module**

```javascript
// ===== READER =====
const Reader = {
  bookId: null,
  chapterIndex: 0,
  chapters: [],
  meta: null,
  menuVisible: false,
  _menuTimer: null,

  init(bookId) {
    this.bookId = bookId;
    this.meta = S.meta(bookId);
    const prog = S.progress(bookId);
    this.chapterIndex = prog.chapterIndex;
    const text = S.text(bookId);
    this.chapters = Parser.parse(text);
    this.applySettings(S.settings());
    this.renderAll();
    this.jumpToChapter(this.chapterIndex, prog.scrollPos);
  },

  applySettings(s) {
    document.body.classList.toggle('night', s.theme === 'night');
    document.body.classList.toggle('eye-care', s.eyeCare);
    document.getElementById('reader-content').className = 'reader-content font-' + (s.fontSize || 'lg');
    document.getElementById('menu-theme').textContent = s.theme === 'night' ? '☀️ 白天' : '🌙 夜间';
    document.getElementById('menu-eye').textContent = s.eyeCare ? '🛡️ 护眼 ✓' : '🛡️ 护眼';
  },

  renderAll() {
    const el = document.getElementById('reader-content');
    let html = '';
    for (let i = 0; i < this.chapters.length; i++) {
      const title = this.meta.chapterTitles[i] || this.chapters[i].title;
      html += `<div class="chapter-divider" data-chapter="${i}">${esc(title)}</div>`;
      html += this.formatBody(this.chapters[i].body || '');
    }
    el.innerHTML = html;
    this._dividers = el.querySelectorAll('.chapter-divider');

    el.onscroll = () => {
      const st = el.scrollTop;
      // Detect current chapter
      let cur = 0;
      for (let i = this._dividers.length - 1; i >= 0; i--) {
        if (this._dividers[i].offsetTop <= st + 80) { cur = i; break; }
      }
      if (cur !== this.chapterIndex) {
        this.chapterIndex = cur;
        document.getElementById('reader-chapter').textContent =
          '第' + (cur + 1) + '章 ' + (this.meta.chapterTitles[cur] || this.chapters[cur].title);
      }
      this._save();
    };
  },

  jumpToChapter(idx, scrollPos = 0) {
    this.chapterIndex = idx;
    const div = this._dividers[idx];
    if (div) {
      document.getElementById('reader-content').scrollTop = div.offsetTop + scrollPos - 60;
    }
    document.getElementById('reader-chapter').textContent =
      '第' + (idx + 1) + '章 ' + (this.meta.chapterTitles[idx] || this.chapters[idx].title);
    this._save();
  },

  formatBody(text) {
    if (!text) return '';
    return text.split(/\n+/).filter(p => p.trim()).map(p => `<p>${esc(p.trim())}</p>`).join('');
  },

  toggleMenu() {
    this.menuVisible = !this.menuVisible;
    document.getElementById('reader-menu').classList.toggle('show', this.menuVisible);
    if (this.menuVisible) {
      this.updateProgress();
      clearTimeout(this._menuTimer);
      this._menuTimer = setTimeout(() => this.hideMenu(), 3000);
    }
  },

  hideMenu() {
    this.menuVisible = false;
    document.getElementById('reader-menu').classList.remove('show');
  },

  updateProgress() {
    const el = document.getElementById('reader-content');
    const total = el.scrollHeight - el.clientHeight;
    const pct = total > 0 ? Math.round((el.scrollTop / total) * 100) : 0;
    document.getElementById('menu-progress-fill').style.width = pct + '%';
    const bookPct = Math.round(((this.chapterIndex + pct / 100) / (this.chapters.length || 1)) * 100);
    document.getElementById('menu-progress-text').textContent =
      (this.meta.chapterTitles[this.chapterIndex] || '') + ' · ' + bookPct + '%';
  },

  scrollOneScreen(dir) {
    const el = document.getElementById('reader-content');
    const h = el.clientHeight * 0.8;
    el.scrollBy({ top: dir > 0 ? h : -h, behavior: 'smooth' });
  },

  _save() {
    if (!this.bookId) return;
    S.saveProgress(this.bookId, {
      chapterIndex: this.chapterIndex,
      scrollPos: document.getElementById('reader-content').scrollTop,
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add Reader page logic with scroll detection"
```

---

### Task 6: Write TOC and Settings logic

**Files:**
- Modify: `novel-reader/index.html` — append TOC and Settings objects

- [ ] **Step 1: Append TOC module**

```javascript
// ===== TOC =====
const TOC = {
  show() {
    const meta = Reader.meta;
    if (!meta) return;
    App.showPage('toc');
    const list = document.getElementById('toc-list');
    const cur = Reader.chapterIndex;
    list.innerHTML = meta.chapterTitles.map((t, i) => {
      let cls = 'toc-item';
      let badge = '';
      if (i === cur) { cls += ' current'; badge = '<span class="toc-badge current">当前</span>'; }
      else if (i < cur) { cls += ' read'; badge = '<span class="toc-badge read">已读</span>'; }
      return `<div class="${cls}" data-idx="${i}"><span class="toc-item-title">${esc(t)}</span>${badge}</div>`;
    }).join('');

    list.querySelectorAll('.toc-item').forEach(item => {
      item.addEventListener('click', () => {
        Reader.jumpToChapter(parseInt(item.dataset.idx));
        App.showPage('reader');
      });
    });
  }
};
```

- [ ] **Step 2: Append Settings module**

```javascript
// ===== SETTINGS =====
const Settings = {
  _labels: ['小', '较小', '标准', '较大', '大'],
  _vals: ['sm', 'md', 'lg', 'xl', 'xxl'],

  init() {
    document.getElementById('setting-night').addEventListener('change', e => {
      this._update('theme', e.target.checked ? 'night' : 'day');
      this._apply();
    });
    document.getElementById('setting-eye').addEventListener('change', e => {
      this._update('eyeCare', e.target.checked);
      this._apply();
    });
    document.getElementById('font-down').addEventListener('click', () => {
      const s = S.settings();
      const idx = Math.max(0, this._vals.indexOf(s.fontSize || 'lg') - 1);
      this._update('fontSize', this._vals[idx]);
      document.getElementById('font-label').textContent = this._labels[idx];
      this._apply();
    });
    document.getElementById('font-up').addEventListener('click', () => {
      const s = S.settings();
      const idx = Math.min(4, this._vals.indexOf(s.fontSize || 'lg') + 1);
      this._update('fontSize', this._vals[idx]);
      document.getElementById('font-label').textContent = this._labels[idx];
      this._apply();
    });
    document.getElementById('settings-done').addEventListener('click', () => this.hide());
    document.querySelector('.settings-backdrop').addEventListener('click', () => this.hide());

    const s = S.settings();
    const idx = this._vals.indexOf(s.fontSize || 'lg');
    document.getElementById('font-label').textContent = this._labels[idx];
  },

  show() {
    const s = S.settings();
    document.getElementById('setting-night').checked = s.theme === 'night';
    document.getElementById('setting-eye').checked = s.eyeCare;
    document.getElementById('settings-overlay').classList.add('show');
  },

  hide() { document.getElementById('settings-overlay').classList.remove('show'); },

  toggleTheme() {
    const s = S.settings();
    s.theme = s.theme === 'night' ? 'day' : 'night';
    S.saveSettings(s);
    this._apply();
  },

  toggleEye() {
    const s = S.settings();
    s.eyeCare = !s.eyeCare;
    S.saveSettings(s);
    this._apply();
  },

  _update(k, v) { const s = S.settings(); s[k] = v; S.saveSettings(s); },
  _apply() { if (Reader.bookId) Reader.applySettings(S.settings()); }
};
```

- [ ] **Step 3: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add TOC and Settings logic"
```

---

### Task 7: Write App shell and initialization

**Files:**
- Modify: `novel-reader/index.html` — append App object, init code, close `</script></body></html>`

- [ ] **Step 1: Append App shell**

```javascript
// ===== APP =====
const App = {
  currentBookId: null,

  init() {
    Shelf.init();
    Settings.init();

    // Reader navigation
    document.getElementById('reader-back').addEventListener('click', () => this.showBookshelf());
    document.getElementById('reader-content').addEventListener('click', e => {
      const w = window.innerWidth;
      // Only toggle menu on tap in the middle 60%
      if (e.clientX > w * 0.15 && e.clientX < w * 0.85) Reader.toggleMenu();
    });
    document.getElementById('menu-toc').addEventListener('click', () => { Reader.hideMenu(); TOC.show(); });
    document.getElementById('menu-theme').addEventListener('click', () => { Settings.toggleTheme(); Reader.updateProgress(); });
    document.getElementById('menu-eye').addEventListener('click', () => { Settings.toggleEye(); Reader.updateProgress(); });
    document.getElementById('menu-settings').addEventListener('click', () => { Reader.hideMenu(); Settings.show(); });
    document.getElementById('toc-back').addEventListener('click', () => this.showReader());

    // Volume keys
    document.addEventListener('keydown', e => {
      if (!this.currentBookId) return;
      if (e.key === 'AudioVolumeUp' || e.keyCode === 24) { e.preventDefault(); Reader.scrollOneScreen(-1); }
      if (e.key === 'AudioVolumeDown' || e.keyCode === 25) { e.preventDefault(); Reader.scrollOneScreen(1); }
    });
  },

  showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(name + '-page').classList.add('active');
  },

  showBookshelf() {
    this.currentBookId = null;
    this.showPage('shelf');
    Shelf.render();
  },

  showReader() {
    this.showPage('reader');
  },

  openBook(id) {
    this.currentBookId = id;
    this.showPage('reader');
    Reader.init(id);
  }
};
```

- [ ] **Step 2: Append initialization and closing tags**

```javascript
// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const s = S.settings();
  document.body.classList.toggle('night', s.theme === 'night');
  document.body.classList.toggle('eye-care', s.eyeCare);
  App.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
</script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add novel-reader/index.html
git commit -m "feat: add App shell and initialization"
```

---

### Task 8: Update supporting files and sync www/

**Files:**
- Modify: `novel-reader/manifest.json` — update description
- Copy: `novel-reader/index.html` → `novel-reader/www/index.html`
- Copy: `novel-reader/manifest.json` → `novel-reader/www/manifest.json`
- Copy: `novel-reader/sw.js` → `novel-reader/www/sw.js`

- [ ] **Step 1: Update manifest.json description**

Change the description in `novel-reader/manifest.json` from:
```
"description": "一个支持TXT导入、仿真翻页、多主题切换的小说阅读器"
```
To:
```
"description": "一个支持TXT导入、上下翻页、多主题切换的小说阅读器"
```

- [ ] **Step 2: Sync files to www/**

```bash
cp novel-reader/index.html novel-reader/www/index.html
cp novel-reader/manifest.json novel-reader/www/manifest.json
cp novel-reader/sw.js novel-reader/www/sw.js
```

- [ ] **Step 3: Commit**

```bash
git add novel-reader/manifest.json novel-reader/www/index.html novel-reader/www/manifest.json novel-reader/www/sw.js
git commit -m "chore: update manifest and sync www/ directory"
```

---

### Task 9: Build APK and verify

**Files:** No code changes

- [ ] **Step 1: Sync Capacitor and build APK**

```bash
cd novel-reader && npx cap sync && npx cap open android
```

Then in Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s).

- [ ] **Step 2: Install and smoke test on device**

Install the APK on an Android phone and verify:
1. App opens to empty bookshelf
2. "导入小说" button opens file picker
3. Select a .txt file — verifies import + chapter parsing
4. Open book — verifies reader with scroll, chapter dividers, header with "第X章"
5. Scroll through chapters — verifies header updates
6. Tap middle to show/hide bottom menu
7. Open TOC from menu — verifies chapter jump
8. Toggle night mode / eye-care from menu
9. Open settings panel, adjust font size
10. Press back arrow → returns to bookshelf
11. Long press book → delete with confirmation

- [ ] **Step 3: Fix any issues found**

Address any bugs discovered during smoke testing. Commit any fixes.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final APK build and testing adjustments"
```
