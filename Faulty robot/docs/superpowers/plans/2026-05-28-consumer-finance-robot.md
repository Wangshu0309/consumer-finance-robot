# 大消费行业智能财务分析机器人 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零构建一个基于 FastAPI + React + XGBoost 的智能财务分析机器人，预测大消费公司归母净利润增长概率，并通过三条硬性审计规则输出风险预警。

**Architecture:** 前后端分离，FastAPI 提供 `/api/predict` 接口，AkShare 获取财务数据，XGBoost+LR 集成模型预测，React+TypeScript+Tailwind 前端展示。开发时 Vite dev server 代理到 FastAPI，生产环境 FastAPI 直接 serve 前端构建产物。

**Tech Stack:** Python FastAPI, AkShare, XGBoost, scikit-learn, SQLite, React 18, TypeScript, Tailwind CSS, Vite

---

### Task 1: 项目脚手架与目录结构

**Files:**
- Create: `backend/requirements.txt`
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`

- [ ] **Step 1: 创建目录结构**

Run:
```bash
mkdir -p /c/Users/20552/Desktop/code/backend/api
mkdir -p /c/Users/20552/Desktop/code/backend/services
mkdir -p /c/Users/20552/Desktop/code/backend/models
mkdir -p /c/Users/20552/Desktop/code/frontend/src/components
mkdir -p /c/Users/20552/Desktop/code/frontend/src/hooks
mkdir -p /c/Users/20552/Desktop/code/frontend/src/types
mkdir -p /c/Users/20552/Desktop/code/frontend/src/utils
```

- [ ] **Step 2: 写入 backend/requirements.txt**

```
fastapi>=0.110
uvicorn[standard]>=0.29
akshare>=1.14
pandas>=2.0
numpy>=1.24
scikit-learn>=1.3
xgboost>=2.0
joblib>=1.3
```

- [ ] **Step 3: 写入 frontend/package.json**

```json
{
  "name": "consumer-finance-robot",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.2",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 4: 写入 frontend/tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 5: 写入 frontend/tsconfig.app.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: 写入 frontend/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: 写入 frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 8: 写入 frontend/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', light: '#3b82f6' },
        danger: { DEFAULT: '#dc2626', bg: '#fef2f2' },
        success: { DEFAULT: '#16a34a', bg: '#f0fdf4' },
        warning: { DEFAULT: '#ea580c', bg: '#fff7ed' },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"',
          '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 9: 写入 frontend/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 10: 写入 frontend/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>大消费行业智能财务分析机器人</title>
  </head>
  <body class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: 安装依赖**

Run:
```bash
cd /c/Users/20552/Desktop/code/backend && pip install -r requirements.txt
```
```bash
cd /c/Users/20552/Desktop/code/frontend && npm install
```

- [ ] **Step 12: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/requirements.txt frontend/ && git commit -m "feat: scaffold project with FastAPI backend and React+TS frontend"
```

---

### Task 2: 后端 — 数据获取层 (data_fetcher)

**Files:**
- Create: `backend/services/__init__.py`
- Create: `backend/services/data_fetcher.py`

- [ ] **Step 1: 写入 backend/services/__init__.py**

```python
```

- [ ] **Step 2: 写入 backend/services/data_fetcher.py**

```python
"""AkShare data fetching with SQLite cache for annual financial indicators."""

import re
import sqlite3
import json
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

import akshare as ak
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

DB_PATH = "cache.db"
CACHE_TTL_DAYS = 7


def _get_cache() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS annual_data ("
        "  code TEXT PRIMARY KEY,"
        "  data TEXT NOT NULL,"
        "  stock_name TEXT DEFAULT '',"
        "  updated_at TEXT NOT NULL"
        ")"
    )
    return conn


def normalize_code(code: str) -> str:
    code = code.strip().upper()
    for prefix in ("SH", "SZ", "BJ"):
        if code.startswith(prefix):
            code = code[len(prefix):]
    for suffix in (".SH", ".SZ", ".BJ", ".SS", ".SZ"):
        if code.endswith(suffix):
            code = code[:-len(suffix)]
    code = re.sub(r"[^0-9]", "", code)
    return code.zfill(6)


class DataFetchError(Exception):
    """All data sources failed for this stock."""


def _fetch_via_indicator(code: str) -> Optional[pd.DataFrame]:
    try:
        df = ak.stock_financial_analysis_indicator(symbol=code)
        if df is None or df.empty:
            return None
        df = df.copy()
        df.columns = [c.strip() for c in df.columns]
        if "日期" in df.columns:
            df["日期"] = pd.to_datetime(df["日期"], errors="coerce")
        return df
    except Exception:
        return None


def _fetch_via_abstract(code: str) -> Optional[pd.DataFrame]:
    try:
        df = ak.stock_financial_abstract_ths(symbol=code, indicator="按年度")
        if df is None or df.empty:
            return None
        df = df.copy()
        df.columns = [c.strip() for c in df.columns]
        col_map = {
            "报告期": "日期",
            "营业收入": "营业总收入",
            "净利润": "归属净利润",
            "归属于母公司所有者的净利润": "归属净利润",
            "营业成本": "营业成本",
            "销售费用": "销售费用",
            "经营活动现金流量净额": "经营活动现金流量净额",
            "经营活动产生的现金流量净额": "经营活动现金流量净额",
            "应收账款": "应收账款",
            "存货": "存货",
        }
        df.rename(columns={k: v for k, v in col_map.items() if k in df.columns}, inplace=True)
        if "日期" in df.columns:
            df["日期"] = pd.to_datetime(df["日期"], errors="coerce")
        return df
    except Exception:
        return None


def _build_annual_dict(df: pd.DataFrame) -> Dict[int, Dict[str, float]]:
    if "日期" not in df.columns:
        date_cols = [c for c in df.columns if "日" in c or "期" in c or "年" in c]
        if not date_cols:
            return {}
        date_col = date_cols[0]
    else:
        date_col = "日期"

    df = df.copy()
    df["year"] = pd.to_datetime(df[date_col], errors="coerce").dt.year
    df = df.dropna(subset=["year"])
    df["year"] = df["year"].astype(int)
    df = df.drop_duplicates(subset="year", keep="last")
    df = df.set_index("year")

    metric_map = {
        "营业总收入": "revenue",
        "营业收入": "revenue",
        "归属净利润": "net_profit",
        "净利润": "net_profit",
        "归属于母公司所有者的净利润": "net_profit",
        "营业成本": "cost_of_revenue",
        "销售费用": "selling_expenses",
        "经营活动现金流量净额": "operating_cash_flow",
        "经营活动产生的现金流量净额": "operating_cash_flow",
        "应收账款": "accounts_receivable",
        "存货": "inventory",
        "毛利率": "gross_margin",
        "营业总收入同比增长": "revenue_growth_yoy",
        "销售费用率": "selling_expense_ratio",
        "存货周转天数": "inventory_turnover_days",
        "存货周转率": "inventory_turnover_ratio",
        "应收账款周转天数": "ar_turnover_days",
        "应收账款周转率": "ar_turnover_ratio",
    }

    result: Dict[int, Dict[str, float]] = {}
    for year, row in df.iterrows():
        entry: Dict[str, float] = {}
        for raw_col, canon in metric_map.items():
            if raw_col in df.columns:
                val = row[raw_col]
                try:
                    entry[canon] = float(val) if pd.notna(val) else np.nan
                except (ValueError, TypeError):
                    entry[canon] = np.nan
        if entry:
            result[int(year)] = entry
    return result


def fetch_stock_name(code: str) -> str:
    code = normalize_code(code)
    try:
        info = ak.stock_individual_info_em(symbol=code)
        if info is not None and not info.empty:
            row = info.set_index("item")
            for key in ("股票简称", "股票代码"):
                if key in row.index:
                    return str(row.loc[key, "value"]).strip()
    except Exception:
        pass
    return ""


def fetch_financial_data(code: str) -> Dict[int, Dict[str, float]]:
    code = normalize_code(code)

    # Check cache
    conn = _get_cache()
    row = conn.execute(
        "SELECT data, updated_at FROM annual_data WHERE code = ?", (code,)
    ).fetchone()
    if row:
        data_json, updated_at = row
        updated_dt = datetime.fromisoformat(updated_at)
        if datetime.now() - updated_dt < timedelta(days=CACHE_TTL_DAYS):
            logger.info("Cache hit for %s", code)
            return {int(k): v for k, v in json.loads(data_json).items()}
        else:
            logger.info("Cache expired for %s", code)

    # Fetch from AkShare
    for fetcher in (_fetch_via_indicator, _fetch_via_abstract):
        df = fetcher(code)
        if df is not None and not df.empty:
            annual = _build_annual_dict(df)
            if len(annual) >= 1:
                # Cache it
                name = fetch_stock_name(code)
                conn.execute(
                    "INSERT OR REPLACE INTO annual_data (code, data, stock_name, updated_at) VALUES (?, ?, ?, ?)",
                    (code, json.dumps({str(k): v for k, v in annual.items()}), name, datetime.now().isoformat()),
                )
                conn.commit()
                conn.close()
                return annual

    conn.close()
    raise DataFetchError(f"无法获取股票 {code} 的年度财务数据，请确认代码是否正确或稍后重试。")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    data = fetch_financial_data("600519")
    for yr, metrics in sorted(data.items()):
        print(f"{yr}: revenue={metrics.get('revenue')}, net_profit={metrics.get('net_profit')}")
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/services/ && git commit -m "feat: add data fetcher with AkShare and SQLite cache"
```

---

### Task 3: 后端 — 特征工程 (feature_engine)

**Files:**
- Create: `backend/services/feature_engine.py`

- [ ] **Step 1: 写入 backend/services/feature_engine.py**

```python
"""Feature extraction: compute 6 core financial indicators from annual data."""

from typing import Dict, Optional
import numpy as np


def extract_features(
    annual: Dict[int, Dict[str, float]], year: int
) -> Optional[Dict[str, float]]:
    """Compute feature vector for `year`. Returns None if year or year-1 is missing."""
    if year not in annual or (year - 1) not in annual:
        return None

    cur = annual[year]
    prev = annual[year - 1]

    def _get(d: dict, *keys: str) -> Optional[float]:
        for k in keys:
            v = d.get(k)
            if v is not None and not (isinstance(v, float) and np.isnan(v)):
                return v
        return None

    def _safe_div(a: Optional[float], b: Optional[float]) -> float:
        if a is not None and b is not None and b != 0:
            return float(a / b)
        return np.nan

    # 1. Revenue growth YoY
    rev_growth = _get(cur, "revenue_growth_yoy")
    if rev_growth is None or np.isnan(rev_growth):
        c = _get(cur, "revenue")
        p = _get(prev, "revenue")
        rev_growth = float((c - p) / abs(p)) if (c is not None and p is not None and p != 0) else np.nan
    if rev_growth is None or np.isnan(rev_growth):
        return None

    # 2. Gross margin change
    gm_cur = _get(cur, "gross_margin")
    gm_prev = _get(prev, "gross_margin")
    if gm_cur is None and "revenue" in cur and "cost_of_revenue" in cur:
        gm_cur = _safe_div(
            _get(cur, "revenue") - _get(cur, "cost_of_revenue", "revenue"),
            _get(cur, "revenue"),
        )
    if gm_prev is None and "revenue" in prev and "cost_of_revenue" in prev:
        gm_prev = _safe_div(
            _get(prev, "revenue") - _get(prev, "cost_of_revenue", "revenue"),
            _get(prev, "revenue"),
        )
    gm_change = np.nan
    if gm_cur is not None and gm_prev is not None:
        gm_change = float(gm_cur - gm_prev)

    # 3. Net cash ratio (operating cash flow / net profit)
    ocf = _get(cur, "operating_cash_flow")
    np_val = _get(cur, "net_profit")
    cf_ratio = _safe_div(ocf, np_val)

    # 4. Selling expense ratio
    se_ratio = _get(cur, "selling_expense_ratio")
    if se_ratio is None or np.isnan(se_ratio):
        rev = _get(cur, "revenue")
        se = _get(cur, "selling_expenses")
        se_ratio = _safe_div(se, rev)

    # 5. Inventory turnover days change
    inv_days_cur = _get(cur, "inventory_turnover_days")
    inv_days_prev = _get(prev, "inventory_turnover_days")
    # Try to derive from ratio if days not available
    if (inv_days_cur is None or np.isnan(inv_days_cur)) and "revenue" in cur and "inventory" in cur:
        rev = _get(cur, "revenue")
        inv = _get(cur, "inventory")
        if rev and rev > 0 and inv is not None and inv != 0:
            inv_days_cur = 365.0 / (rev / inv)
    if (inv_days_prev is None or np.isnan(inv_days_prev)) and "revenue" in prev and "inventory" in prev:
        rev = _get(prev, "revenue")
        inv = _get(prev, "inventory")
        if rev and rev > 0 and inv is not None and inv != 0:
            inv_days_prev = 365.0 / (rev / inv)
    inv_change = np.nan
    if inv_days_cur is not None and inv_days_prev is not None and inv_days_prev != 0:
        inv_change = float((inv_days_cur - inv_days_prev) / abs(inv_days_prev))

    # 6. AR turnover days change
    ar_days_cur = _get(cur, "ar_turnover_days")
    ar_days_prev = _get(prev, "ar_turnover_days")
    if (ar_days_cur is None or np.isnan(ar_days_cur)) and "revenue" in cur and "accounts_receivable" in cur:
        rev = _get(cur, "revenue")
        ar = _get(cur, "accounts_receivable")
        if rev and rev > 0 and ar is not None and ar != 0:
            ar_days_cur = 365.0 / (rev / ar)
    if (ar_days_prev is None or np.isnan(ar_days_prev)) and "revenue" in prev and "accounts_receivable" in prev:
        rev = _get(prev, "revenue")
        ar = _get(prev, "accounts_receivable")
        if rev and rev > 0 and ar is not None and ar != 0:
            ar_days_prev = 365.0 / (rev / ar)
    ar_change = np.nan
    if ar_days_cur is not None and ar_days_prev is not None and ar_days_prev != 0:
        ar_change = float((ar_days_cur - ar_days_prev) / abs(ar_days_prev))

    return {
        "revenue_growth_yoy": rev_growth if not np.isnan(rev_growth) else 0.0,
        "gross_margin_change": gm_change if not np.isnan(gm_change) else 0.0,
        "net_cash_ratio": cf_ratio if not np.isnan(cf_ratio) else 1.0,
        "selling_expense_ratio": se_ratio if not np.isnan(se_ratio) else 0.0,
        "inventory_turnover_days_change": inv_change if not np.isnan(inv_change) else 0.0,
        "ar_turnover_days_change": ar_change if not np.isnan(ar_change) else 0.0,
    }
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/services/feature_engine.py && git commit -m "feat: add feature extraction engine (6 core indicators)"
```

---

### Task 4: 后端 — 风险排雷规则引擎 (rule_engine)

**Files:**
- Create: `backend/services/rule_engine.py`

- [ ] **Step 1: 写入 backend/services/rule_engine.py**

```python
"""Three hard audit rules for financial risk detection."""

from typing import Dict, List
import numpy as np


_WARN_REVENUE = (
    "收入真实性预警：营收增长超过20%，但销售费用增长不足5%，"
    "营收与营销费用变动严重背离，疑似虚构收入。"
)

_WARN_CHANNEL = (
    "渠道健康度预警：{metric}周转天数同比恶化{change:.0f}%（>15%），"
    "渠道回款或存货周转效率大幅下滑，存在压货风险。"
)

_WARN_CASH = (
    "利润含金量预警：净现比（经营活动现金流/归母净利润）为{ratio:.2f}（<1.0），"
    "利润缺乏现金流支撑，获现率不足，存在财务粉饰风险。"
)


def check_rules(
    annual: Dict[int, Dict[str, float]],
    feats: Dict[str, float],
    target_year: int,
) -> List[str]:
    """Run all three audit rules. Returns list of warning strings (empty = clean)."""
    warnings: List[str] = []

    # Rule 1: Revenue authenticity
    rev_growth = feats.get("revenue_growth_yoy", 0) or 0
    se_cur = annual.get(target_year, {}).get("selling_expenses", np.nan)
    se_prev = annual.get(target_year - 1, {}).get("selling_expenses", np.nan)

    if rev_growth > 0.20:
        se_growth = np.nan
        if (not np.isnan(se_cur)) and (not np.isnan(se_prev)) and se_prev != 0:
            se_growth = float((se_cur - se_prev) / abs(se_prev))
        if np.isnan(se_growth):
            se_growth = 0.0
        if se_growth < 0.05:
            warnings.append(_WARN_REVENUE)

    # Rule 2: Channel health (inventory + AR, each independent)
    inv_change = feats.get("inventory_turnover_days_change", 0) or 0
    ar_change = feats.get("ar_turnover_days_change", 0) or 0

    if inv_change > 0.15:
        warnings.append(_WARN_CHANNEL.format(metric="存货", change=inv_change * 100))
    if ar_change > 0.15:
        warnings.append(_WARN_CHANNEL.format(metric="应收账款", change=ar_change * 100))

    # Rule 3: Profit quality (cash flow ratio)
    cf_ratio = feats.get("net_cash_ratio", 1.0)
    if cf_ratio is not None and not np.isnan(cf_ratio) and cf_ratio < 1.0:
        warnings.append(_WARN_CASH.format(ratio=cf_ratio))

    return warnings


def check_data_sufficient(annual: Dict[int, Dict[str, float]]) -> bool:
    """At least 2 years of data required."""
    return len(annual) >= 2
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/services/rule_engine.py && git commit -m "feat: add rule engine with 3 hard audit rules"
```

---

### Task 5: 后端 — 预测引擎 (predictor)

**Files:**
- Create: `backend/services/predictor.py`

- [ ] **Step 1: 写入 backend/services/predictor.py**

```python
"""Prediction engine: XGBoost+LR ensemble with heuristic fallback."""

import os
import logging
from typing import Dict, Optional, Tuple

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")

FEATURE_ORDER = [
    "revenue_growth_yoy",
    "gross_margin_change",
    "net_cash_ratio",
    "selling_expense_ratio",
    "inventory_turnover_days_change",
    "ar_turnover_days_change",
]


def _make_feature_vector(feats: Dict[str, float]) -> np.ndarray:
    return np.array([feats.get(k, 0.0) for k in FEATURE_ORDER], dtype=np.float64)


def predict_heuristic(feats: Dict[str, float]) -> float:
    """Domain-knowledge heuristic. Returns probability clamped to [0.02, 0.98]."""
    score = 0.50
    rg = feats.get("revenue_growth_yoy", 0) or 0
    gm = feats.get("gross_margin_change", 0) or 0
    cf = feats.get("net_cash_ratio", 1.0) or 1.0
    sr = feats.get("selling_expense_ratio", 0.3) or 0.3
    inv_chg = feats.get("inventory_turnover_days_change", 0) or 0
    ar_chg = feats.get("ar_turnover_days_change", 0) or 0

    if rg > 0.20:
        score += 0.12
    elif rg > 0.05:
        score += 0.07
    elif rg > 0:
        score += 0.03
    elif rg < -0.10:
        score -= 0.10

    if gm > 0.03:
        score += 0.10
    elif gm > 0:
        score += 0.05
    elif gm < -0.05:
        score -= 0.08

    if cf > 1.5:
        score += 0.10
    elif cf > 1.0:
        score += 0.06
    elif cf < 0.5:
        score -= 0.10

    if sr < 0.10:
        score += 0.05
    elif sr > 0.40:
        score -= 0.05

    if inv_chg < -0.10:
        score += 0.06
    elif inv_chg > 0.15:
        score -= 0.08

    if ar_chg < -0.10:
        score += 0.06
    elif ar_chg > 0.15:
        score -= 0.08

    return float(np.clip(score, 0.02, 0.98))


def save_model(scaler: StandardScaler, models: dict, path: str = MODEL_PATH) -> None:
    joblib.dump({"scaler": scaler, "models": models}, path)


def load_model(path: str = MODEL_PATH) -> Optional[Tuple[StandardScaler, dict]]:
    if not os.path.exists(path):
        return None
    try:
        bundle = joblib.load(path)
        return bundle["scaler"], bundle["models"]
    except Exception:
        logger.warning("Failed to load model, will use heuristic.", exc_info=True)
        return None


_model_cache: Optional[Tuple[StandardScaler, dict]] = None
_model_loaded = False


def _get_model() -> Optional[Tuple[StandardScaler, dict]]:
    global _model_cache, _model_loaded
    if not _model_loaded:
        _model_cache = load_model()
        _model_loaded = True
    return _model_cache


def get_prediction(feats: Dict[str, float]) -> Tuple[float, bool]:
    """Return (probability, from_ml). from_ml=True means ensemble model was used."""
    bundle = _get_model()
    if bundle is not None:
        scaler, models = bundle
        X = _make_feature_vector(feats).reshape(1, -1)
        X_scaled = scaler.transform(X)
        xgb_prob = float(models["xgb"].predict_proba(X_scaled)[0, 1])
        lr_prob = float(models["lr"].predict_proba(X_scaled)[0, 1])
        xgb_weight = models.get("xgb_weight", 0.6)
        lr_weight = models.get("lr_weight", 0.4)
        prob = xgb_prob * xgb_weight + lr_prob * lr_weight
        return prob, True

    return predict_heuristic(feats), False
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/services/predictor.py && git commit -m "feat: add prediction engine with XGBoost+LR ensemble and heuristic fallback"
```

---

### Task 6: 后端 — API 路由与 FastAPI 入口

**Files:**
- Create: `backend/api/__init__.py`
- Create: `backend/api/predict.py`
- Create: `backend/main.py`

- [ ] **Step 1: 写入 backend/api/__init__.py**

```python
```

- [ ] **Step 2: 写入 backend/api/predict.py**

```python
"""POST /api/predict — main prediction endpoint."""

from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from services.data_fetcher import fetch_financial_data, fetch_stock_name, normalize_code, DataFetchError
from services.feature_engine import extract_features
from services.predictor import get_prediction, _get_model
from services.rule_engine import check_rules, check_data_sufficient

router = APIRouter()


@router.post("/predict")
def predict(body: Dict[str, Any]) -> Dict[str, Any]:
    raw_code = str(body.get("stock_code", "")).strip()
    if not raw_code:
        raise HTTPException(status_code=400, detail="请输入股票代码")

    code = normalize_code(raw_code)

    try:
        annual = fetch_financial_data(code)
    except DataFetchError as e:
        raise HTTPException(status_code=400, detail=str(e))

    years = sorted(annual.keys())
    target_year = years[-1]
    stock_name = fetch_stock_name(code) or code

    sufficient = check_data_sufficient(annual)
    if not sufficient:
        return {
            "success": True,
            "data": {
                "stock_code": code,
                "stock_name": stock_name,
                "fiscal_year": target_year,
                "prob": None,
                "from_ml": False,
                "warnings": [],
                "insufficient_data": True,
                "features": None,
            },
        }

    feats = extract_features(annual, target_year)
    if feats is None:
        return {
            "success": True,
            "data": {
                "stock_code": code,
                "stock_name": stock_name,
                "fiscal_year": target_year,
                "prob": None,
                "from_ml": False,
                "warnings": [],
                "insufficient_data": True,
                "features": None,
            },
        }

    prob, from_ml = get_prediction(feats)
    warnings = check_rules(annual, feats, target_year)

    features_display = {
        "revenue_growth_yoy": round(feats.get("revenue_growth_yoy", 0), 4),
        "gross_margin_change": round(feats.get("gross_margin_change", 0), 4),
        "net_cash_ratio": round(feats.get("net_cash_ratio", 1.0), 4),
        "selling_expense_ratio": round(feats.get("selling_expense_ratio", 0), 4),
        "inventory_turnover_days_change": round(feats.get("inventory_turnover_days_change", 0), 4),
        "ar_turnover_days_change": round(feats.get("ar_turnover_days_change", 0), 4),
    }

    return {
        "success": True,
        "data": {
            "stock_code": code,
            "stock_name": stock_name,
            "fiscal_year": target_year,
            "prob": round(float(prob), 4),
            "from_ml": from_ml,
            "warnings": warnings,
            "insufficient_data": False,
            "features": features_display,
        },
    }
```

- [ ] **Step 3: 写入 backend/main.py**

```python
"""FastAPI entry point for the consumer finance analysis robot."""

import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.predict import router as predict_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="大消费行业智能财务分析机器人", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve frontend static files in production
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


@app.on_event("startup")
async def startup():
    from services.predictor import _get_model
    bundle = _get_model()
    if bundle is None:
        logger.info("未找到预训练模型，将使用启发式预测。运行 python models/train.py 训练模型。")
    else:
        logger.info("已加载 XGBoost+LR 集成模型。")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/api/ backend/main.py && git commit -m "feat: add FastAPI entry point with /api/predict endpoint"
```

---

### Task 7: 模型训练脚本

**Files:**
- Create: `backend/models/__init__.py`
- Create: `backend/models/train.py`

- [ ] **Step 1: 写入 backend/models/__init__.py**

```python
```

- [ ] **Step 2: 写入 backend/models/train.py**

```python
#!/usr/bin/env python
"""
Train XGBoost + LogisticRegression ensemble on consumer/retail/manufacturing stocks.
Weights are determined by per-model AUC on validation set.

Usage:
    cd backend && python models/train.py
"""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from xgboost import XGBClassifier

from services.data_fetcher import fetch_financial_data
from services.predictor import _make_feature_vector, save_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

TRAINING_STOCKS = [
    "600519", "000858", "002304", "600809", "000568",
    "600887", "603288", "002557", "600600", "000895",
    "002568", "603369",
    "000333", "000651", "600690", "002032", "002242", "002508",
    "601933", "002697", "603939", "002727",
    "002714", "300498",
    "603833", "002563",
    "600104", "000625",
    "600132", "603899",
]


def fetch_batch_data_annual(codes):
    """Fetch training data: (features, labels) for all stock-year pairs."""
    from services.feature_engine import extract_features

    X_list, y_list = [], []
    for code in codes:
        try:
            annual = fetch_financial_data(code)
        except Exception:
            continue

        years = sorted(annual.keys())
        for i in range(len(years) - 1):
            t_year = years[i]
            t1_year = years[i + 1]
            feats = extract_features(annual, t_year)
            if feats is None:
                continue
            np_cur = annual[t_year].get("net_profit", np.nan)
            np_next = annual[t1_year].get("net_profit", np.nan)
            if np.isnan(np_cur) or np.isnan(np_next) or np_cur <= 0:
                continue
            label = 1 if np_next > np_cur else 0
            X_list.append(_make_feature_vector(feats))
            y_list.append(label)

    return X_list, y_list


def main():
    logger.info("Fetching training data for %d stocks...", len(TRAINING_STOCKS))
    X_list, y_list = fetch_batch_data_annual(TRAINING_STOCKS)
    logger.info("Got %d samples, %d positive", len(X_list), sum(y_list))

    if len(X_list) < 20:
        logger.error("Insufficient training samples (%d < 20).", len(X_list))
        sys.exit(1)

    X = np.array(X_list)
    y = np.array(y_list)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # Train XGBoost
    xgb = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        random_state=42,
        eval_metric="logloss",
    )
    xgb.fit(X_train_scaled, y_train)
    xgb_auc = roc_auc_score(y_val, xgb.predict_proba(X_val_scaled)[:, 1])
    xgb_acc = accuracy_score(y_val, xgb.predict(X_val_scaled))
    logger.info("XGBoost — AUC: %.4f, Accuracy: %.2f%%", xgb_auc, xgb_acc * 100)

    # Train LogisticRegression
    lr = LogisticRegression(
        penalty="l2", C=1.0, class_weight="balanced", max_iter=2000, random_state=42
    )
    lr.fit(X_train_scaled, y_train)
    lr_auc = roc_auc_score(y_val, lr.predict_proba(X_val_scaled)[:, 1])
    lr_acc = accuracy_score(y_val, lr.predict(X_val_scaled))
    logger.info("LogisticRegression — AUC: %.4f, Accuracy: %.2f%%", lr_auc, lr_acc * 100)

    # Weight by AUC
    total_auc = xgb_auc + lr_auc
    xgb_weight = xgb_auc / total_auc if total_auc > 0 else 0.6
    lr_weight = lr_auc / total_auc if total_auc > 0 else 0.4
    logger.info("Ensemble weights: XGB=%.2f, LR=%.2f", xgb_weight, lr_weight)

    models = {
        "xgb": xgb,
        "lr": lr,
        "xgb_weight": xgb_weight,
        "lr_weight": lr_weight,
    }
    save_model(scaler, models)
    logger.info("Model saved to model.joblib")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add backend/models/ && git commit -m "feat: add model training script with XGBoost+LR ensemble"
```

---

### Task 8: 前端 — TypeScript 类型、工具函数与 API Hook

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/utils/format.ts`
- Create: `frontend/src/hooks/usePredict.ts`

- [ ] **Step 1: 写入 frontend/src/types/index.ts**

```typescript
export interface FeatureData {
  revenue_growth_yoy: number;
  gross_margin_change: number;
  net_cash_ratio: number;
  selling_expense_ratio: number;
  inventory_turnover_days_change: number;
  ar_turnover_days_change: number;
}

export interface PredictResponse {
  stock_code: string;
  stock_name: string;
  fiscal_year: number;
  prob: number | null;
  from_ml: boolean;
  warnings: string[];
  insufficient_data: boolean;
  features: FeatureData | null;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  data?: PredictResponse;
}

export type PredictState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PredictResponse }
  | { status: 'error'; message: string };
```

- [ ] **Step 2: 写入 frontend/src/utils/format.ts**

```typescript
export function formatProb(prob: number | null): string {
  if (prob === null || prob === undefined) return '--';
  return (prob * 100).toFixed(1);
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return (value * 100).toFixed(2) + '%';
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(2);
}

export function getProbColorClass(prob: number | null): string {
  if (prob === null) return 'text-gray-900';
  if (prob >= 0.6) return 'text-green-600';
  if (prob >= 0.4) return 'text-orange-600';
  return 'text-red-600';
}

export function getGaugeColorClass(prob: number | null): string {
  if (prob === null) return 'bg-gray-300';
  if (prob >= 0.6) return 'bg-green-500';
  if (prob >= 0.4) return 'bg-orange-500';
  return 'bg-red-500';
}

export const FEATURE_LABELS: Record<string, string> = {
  revenue_growth_yoy: '营收同比增长率',
  gross_margin_change: '毛利率同比变化',
  net_cash_ratio: '净现比（经营现金流/净利润）',
  selling_expense_ratio: '销售费用率',
  inventory_turnover_days_change: '存货周转天数同比变化',
  ar_turnover_days_change: '应收账款周转天数同比变化',
};
```

- [ ] **Step 3: 写入 frontend/src/hooks/usePredict.ts**

```typescript
import { useState, useCallback } from 'react';
import type { PredictResponse, PredictState } from '../types';

export function usePredict() {
  const [state, setState] = useState<PredictState>({ status: 'idle' });

  const predict = useCallback(async (stockCode: string) => {
    if (!stockCode.trim()) {
      setState({ status: 'error', message: '请输入股票代码' });
      return;
    }

    setState({ status: 'loading' });

    try {
      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_code: stockCode.trim() }),
      });
      const json = await resp.json();

      if (!json.success) {
        setState({ status: 'error', message: json.detail || json.error || '分析失败，请稍后重试' });
        return;
      }

      setState({ status: 'success', data: json.data as PredictResponse });
    } catch {
      setState({ status: 'error', message: '网络请求失败，请确认服务已启动' });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, predict, reset };
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/types/ frontend/src/utils/ frontend/src/hooks/ && git commit -m "feat: add frontend types, formatters, and usePredict hook"
```

---

### Task 9: 前端 — Tailwind 全局样式与入口文件

**Files:**
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: 写入 frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply text-gray-800 leading-relaxed;
  }
}

@layer components {
  .prob-number {
    font-size: 96px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -2px;
  }

  .warning-card {
    @apply bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-lg p-4 text-red-900 text-sm leading-relaxed;
  }

  .safe-badge {
    @apply bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-green-700 text-sm font-medium;
  }
}
```

- [ ] **Step 2: 写入 frontend/src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/index.css frontend/src/main.tsx && git commit -m "feat: add Tailwind global styles and React entry point"
```

---

### Task 10: 前端 — StockInput 组件

**Files:**
- Create: `frontend/src/components/StockInput.tsx`

- [ ] **Step 1: 写入 frontend/src/components/StockInput.tsx**

```typescript
import { useState, FormEvent, KeyboardEvent } from 'react';

interface StockInputProps {
  onAnalyze: (code: string) => void;
  disabled: boolean;
}

export default function StockInput({ onAnalyze, disabled }: StockInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAnalyze(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAnalyze(value);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-7">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入股票代码（如 600519）"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          className="flex-1 px-4 py-3 text-base border-2 border-gray-200 rounded-lg outline-none
                     transition-colors focus:border-primary disabled:opacity-50
                     placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-7 py-3 text-base font-semibold text-white bg-primary rounded-lg
                     hover:bg-primary-light active:scale-97 transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          开始分析
        </button>
      </form>
      <p className="mt-2.5 text-xs text-gray-400">支持沪深京 A 股代码，基于最新年报数据进行分析</p>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/components/StockInput.tsx && git commit -m "feat: add StockInput component"
```

---

### Task 11: 前端 — ProbDisplay 组件（概率展示 + 进度条）

**Files:**
- Create: `frontend/src/components/ProbDisplay.tsx`

- [ ] **Step 1: 写入 frontend/src/components/ProbDisplay.tsx**

```typescript
import { formatProb, formatPct, getProbColorClass, getGaugeColorClass } from '../utils/format';
import type { PredictResponse } from '../types';

interface ProbDisplayProps {
  data: PredictResponse;
}

export default function ProbDisplay({ data }: ProbDisplayProps) {
  const { prob, from_ml, insufficient_data } = data;

  return (
    <div className="bg-white rounded-xl shadow-lg p-10 text-center">
      <p className="text-sm text-gray-500 mb-2">归母净利润同比增长概率</p>

      <div className="flex items-baseline justify-center gap-1">
        <span className={`prob-number ${getProbColorClass(prob)}`}>
          {insufficient_data ? '--' : formatProb(prob)}
        </span>
        {!insufficient_data && prob !== null && (
          <span className="text-3xl font-semibold text-gray-400">%</span>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {insufficient_data
          ? '历史数据不足，无法完成预测'
          : from_ml
            ? '基于 XGBoost+LR 集成模型预测'
            : '基于启发式模型预测（运行 train.py 训练 ML 模型）'}
      </p>

      <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getGaugeColorClass(prob)}`}
          style={{ width: insufficient_data || prob === null ? '0%' : formatProb(prob) + '%' }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/components/ProbDisplay.tsx && git commit -m "feat: add ProbDisplay component with large probability number and gauge bar"
```

---

### Task 12: 前端 — WarningList 组件（风险预警）

**Files:**
- Create: `frontend/src/components/WarningList.tsx`

- [ ] **Step 1: 写入 frontend/src/components/WarningList.tsx**

```typescript
import type { PredictResponse } from '../types';

interface WarningListProps {
  data: PredictResponse;
}

export default function WarningList({ data }: WarningListProps) {
  const { warnings, insufficient_data } = data;

  if (insufficient_data) {
    return (
      <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 text-orange-700 text-sm">
        历史数据不足（少于2年），无法完成规则排雷。
      </div>
    );
  }

  if (!warnings || warnings.length === 0) {
    return (
      <div className="mt-4 safe-badge text-center">
        ✅ 财务逻辑暂未发现显著异常
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {warnings.map((w, i) => (
        <div key={i} className="warning-card">
          <span className="mr-1.5">⚠️</span>
          {w}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/components/WarningList.tsx && git commit -m "feat: add WarningList component for risk alerts"
```

---

### Task 13: 前端 — FeatureTable 组件（核心指标明细）

**Files:**
- Create: `frontend/src/components/FeatureTable.tsx`

- [ ] **Step 1: 写入 frontend/src/components/FeatureTable.tsx**

```typescript
import { FEATURE_LABELS, formatPct, formatRatio } from '../utils/format';
import type { FeatureData } from '../types';

interface FeatureTableProps {
  features: FeatureData | null;
}

type FormatFn = (v: number | null | undefined) => string;

const FORMATTERS: Record<string, FormatFn> = {
  revenue_growth_yoy: formatPct,
  gross_margin_change: formatPct,
  net_cash_ratio: formatRatio,
  selling_expense_ratio: formatPct,
  inventory_turnover_days_change: formatPct,
  ar_turnover_days_change: formatPct,
};

export default function FeatureTable({ features }: FeatureTableProps) {
  if (!features) return null;

  return (
    <details className="mt-4 bg-white rounded-xl shadow">
      <summary className="px-5 py-3.5 text-sm font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-800">
        核心财务指标
      </summary>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {Object.entries(FEATURE_LABELS).map(([key, label]) => {
            const value = features[key as keyof FeatureData];
            const formatter = FORMATTERS[key] || formatRatio;
            return (
              <tr key={key} className="border-t border-gray-50">
                <td className="py-2.5 pl-5 text-gray-500 w-1/2">{label}</td>
                <td className="py-2.5 pr-5 text-right font-medium text-gray-800">
                  {formatter(value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/components/FeatureTable.tsx && git commit -m "feat: add FeatureTable component with collapsible indicator details"
```

---

### Task 14: 前端 — App 根组件（状态管理与布局编排）

**Files:**
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/index.css` (add responsive styles)

- [ ] **Step 1: 写入 frontend/src/App.tsx**

```typescript
import { usePredict } from './hooks/usePredict';
import StockInput from './components/StockInput';
import ProbDisplay from './components/ProbDisplay';
import WarningList from './components/WarningList';
import FeatureTable from './components/FeatureTable';

export default function App() {
  const { state, predict } = usePredict();
  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';

  return (
    <div className="max-w-[720px] mx-auto px-5 py-8 pb-16">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-2xl font-extrabold text-primary tracking-wide">
          大消费行业智能财务分析机器人
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">智能化投研辅助工具 · 大消费与零售制造</p>
      </header>

      {/* Input */}
      <StockInput onAnalyze={predict} disabled={isLoading} />

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 mx-auto mb-4 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-gray-500">正在获取财务数据并运行分析...</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm">
          {state.message}
        </div>
      )}

      {/* Results */}
      {isSuccess && state.data && (
        <div className="mt-5">
          {/* Stock info bar */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-lg font-bold text-gray-900">{state.data.stock_name}</span>
            <span className="text-xs text-gray-500">{state.data.stock_code}</span>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {state.data.fiscal_year} 年报
            </span>
          </div>

          <ProbDisplay data={state.data} />
          <WarningList data={state.data} />
          <FeatureTable features={state.data.features} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400">
        数据来源：AkShare 公开财务接口 &nbsp;|&nbsp; 分析结果仅供参考，不构成投资建议
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 追加响应式样式到 frontend/src/index.css**

Append to the end of `frontend/src/index.css`:

```css
@media (max-width: 520px) {
  .prob-number {
    font-size: 64px;
  }
}
```

- [ ] **Step 3: 验证前端构建**

Run:
```bash
cd /c/Users/20552/Desktop/code/frontend && npm run build
```
Expected: BUILD SUCCESS with no errors.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/20552/Desktop/code && git add frontend/src/App.tsx frontend/src/index.css && git commit -m "feat: add App root component with full layout and state management"
```

---

### Task 15: 集成验证与最终收尾

- [ ] **Step 1: 确认后端可启动**

Run:
```bash
cd /c/Users/20552/Desktop/code/backend && python -c "from main import app; print('FastAPI app loaded OK')"
```
Expected: "FastAPI app loaded OK"

- [ ] **Step 2: 确认前端可构建并预览**

Run:
```bash
cd /c/Users/20552/Desktop/code/frontend && npm run build
```
Expected: BUILD SUCCESS. Verify `frontend/dist/` directory is created with `index.html` and `assets/`.

- [ ] **Step 3: 初始化 Git 仓库（如果尚未初始化）**

Run:
```bash
cd /c/Users/20552/Desktop/code && git rev-parse --git-dir 2>/dev/null || git init
```

- [ ] **Step 4: 添加 .gitignore**

Write to `.gitignore` at the project root:

```
# Python
__pycache__/
*.pyc
*.egg-info/
*.joblib

# Node
node_modules/
frontend/dist/

# IDE
.idea/
.vscode/

# OS
.DS_Store
Thumbs.db

# Data cache
backend/cache.db
```

- [ ] **Step 5: 提交 .gitignore**

```bash
cd /c/Users/20552/Desktop/code && git add .gitignore && git commit -m "chore: add .gitignore"
```

- [ ] **Step 6: 启动后端进行冒烟测试**

Run (background):
```bash
cd /c/Users/20552/Desktop/code/backend && python main.py &
sleep 3
curl -s http://localhost:8000/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 7: 测试 /api/predict 接口**

Run:
```bash
curl -s -X POST http://localhost:8000/api/predict -H "Content-Type: application/json" -d '{"stock_code":"600519"}'
```

Expected: JSON response with `success: true`, containing `prob`, `warnings`, `features` fields.

- [ ] **Step 8: 停止后台进程**

Run:
```bash
kill %1 2>/dev/null || true
```
