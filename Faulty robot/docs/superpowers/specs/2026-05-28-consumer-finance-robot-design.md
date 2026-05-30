# 大消费行业智能财务分析机器人 — 设计文档

**日期**：2026-05-28
**状态**：待实现

---

## 一、项目概述

基于 Web 的智能化投研辅助工具，专注于大消费与零售制造行业。核心功能是通过集成机器学习模型预测企业年度归母净利润的增长概率，并结合财务红线规则进行风险排雷，输出直观的确定性结论。

### 技术栈

- **后端**：Python FastAPI
- **前端**：React 18 + TypeScript + Tailwind CSS
- **ML**：XGBoost + LogisticRegression 集成模型
- **数据源**：AkShare 免费接口 + SQLite 本地缓存

---

## 二、架构

```
backend/                     # Python FastAPI
├── main.py                  # 入口，路由注册，CORS
├── api/predict.py           # POST /api/predict
├── services/
│   ├── data_fetcher.py      # AkShare 获取 + SQLite 缓存
│   ├── feature_engine.py    # 6 个核心特征提取
│   ├── predictor.py         # XGBoost + LR 集成预测
│   └── rule_engine.py       # 三条硬性审计规则
├── models/train.py          # 模型训练脚本
└── requirements.txt

frontend/                    # React + TypeScript
├── src/
│   ├── App.tsx              # 根组件
│   ├── components/
│   │   ├── StockInput.tsx   # 股票代码输入
│   │   ├── ProbDisplay.tsx  # 概率数字 + 进度条
│   │   ├── WarningList.tsx  # 风险预警列表
│   │   └── FeatureTable.tsx # 核心指标表
│   ├── hooks/usePredict.ts  # API 调用 hook
│   └── types/index.ts       # 类型定义
├── package.json
└── tailwind.config.js
```

前后端通过 `/api/predict` JSON 通信，开发时 Vite dev server 代理到 FastAPI。

---

## 三、ML 模型设计

### 预测目标

预测公司下一财年「归母净利润 YoY 增长」概率（二分类，1 = 增长，0 = 下降）。

### 特征（6 个）

| 特征 | 计算 |
|------|------|
| revenue_growth_yoy | (本年营收 - 去年) / |去年营收| |
| gross_margin_change | 本年毛利率 - 去年毛利率 |
| net_cash_ratio | 经营性现金流 / 归母净利润 |
| selling_expense_ratio | 销售费用 / 营业总收入 |
| inventory_turnover_days_change | (本年周转天数 - 去年) / 去年 |
| ar_turnover_days_change | (本年 - 去年) / 去年 |

### 集成模型

XGBoost (n_estimators=100, max_depth=4, lr=0.05) 与 LogisticRegression (C=1.0, l2, class_weight=balanced) 各输出概率，加权平均得最终结果。

### 训练数据

30+ 只大消费股票池（白酒、食品饮料、家电、零售、农林牧渔、服装、汽车），跨 5-10 年财报，预计 150-250 条样本。

### 回退策略

ML 模型未训练时使用领域启发式规则打分，前端标注"基于启发式模型"。

---

## 四、风险排雷规则

三条硬性规则，触发即告警：

1. **收入真实性**：营收增长 > 20% 且销售费用增长 < 5% → "营收与营销费用变动严重背离，疑似虚构收入"
2. **渠道健康度**：应收账款周转天数或存货周转天数同比恶化 > 15% → "渠道回款/存货周转效率大幅下滑，存在压货风险"（两项独立触发）
3. **利润含金量**：净现比 < 1.0 → "利润缺乏现金流支撑，获现率不足，存在财务粉饰风险"

---

## 五、API 设计

### POST /api/predict

请求：`{ "stock_code": "600519" }`

响应：
```json
{
  "success": true,
  "data": {
    "stock_code": "600519",
    "stock_name": "贵州茅台",
    "fiscal_year": 2025,
    "prob": 0.723,
    "from_ml": true,
    "warnings": ["..."],
    "insufficient_data": false,
    "features": { "revenue_growth_yoy": 0.152, "..." }
  }
}
```

### GET /api/health

```json
{ "status": "ok" }
```

---

## 六、UI 设计

### 布局（从上到下）

1. **Header**：产品名称
2. **StockInput**：股票代码输入框 + 开始分析按钮
3. **StockInfoBar**：公司名称 · 代码 · 年报年份
4. **ProbDisplay**：概率大字 (96px) + 进度条
   - ≥60% 绿色，40-60% 橙色，<40% 红色
5. **WarningList**：无预警显示绿色"✅ 未发现显著异常"，有预警显示红色卡片逐条列出
6. **FeatureTable**：折叠面板，展示 6 个核心指标数值
7. **Footer**：数据来源声明

### 技术实现

- Tailwind CSS + 自定义 CSS 变量
- 响应式：移动端概率数字 64px，输入区竖向排列
- 输入框支持 Enter 键，加载中禁用按钮 + spinner动画

---

## 七、数据流

```
用户输入代码 → 前端 POST /api/predict
  → FastAPI 校验参数
  → data_fetcher 查 SQLite 缓存，未命中则调 AkShare
  → feature_engine 计算 6 特征
  → predictor 输出概率（ML/启发式）
  → rule_engine 执行三条规则
  → 返回 JSON → 前端渲染
```

---

## 八、不考虑做的事

- 用户登录/权限系统
- 历史查询记录持久化
- 多股票批量分析
- 实时行情推送
