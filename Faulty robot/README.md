# 大消费行业智能财务分析机器人

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange)](https://xgboost.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Consumer Finance Intelligence Robot** — 一款基于 Web 的智能化投研辅助工具，专注于大消费与零售制造行业。通过机器学习模型预测企业年度归母净利润增长概率，结合财务红线规则进行风险排雷，输出直观的确定性结论与多维度深度分析报告。

🌐 **在线访问**：[https://consumer-finance-robot.onrender.com](https://consumer-finance-robot.onrender.com)

---

## 目录

- [功能概览](#功能概览)
- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [ML 模型训练](#ml-模型训练)
- [部署指南](#部署指南)
- [项目结构](#项目结构)
- [数据来源](#数据来源)
- [免责声明](#免责声明)

---

## 功能概览

### 🔮 盈利预测
基于 XGBoost + Logistic Regression 集成模型，从 6 项核心财务指标出发，预测公司下一财年归母净利润同比增长的概率，输出 0-100% 的百分比数值。

### 🛡️ 风险排雷
三条硬性审计规则自动检测财务异常：
| 规则 | 触发条件 |
|------|---------|
| 收入真实性预警 | 营收增长 > 20% 且销售费用增长 < 5% |
| 渠道健康度预警 | 应收或存货周转天数同比恶化 > 15% |
| 利润含金量预警 | 净现比（经营现金流 / 归母净利润）< 1.0 |

### 🔍 指标交叉验证
检查营收 vs 应收、毛利 vs 存货、净利 vs 现金流等关键指标间的逻辑自洽性，识别潜在的财务异常信号。

### 📊 杜邦分析
将 ROE 拆解为净利率 × 资产周转率 × 权益乘数三个驱动因子，展示各因子的贡献度归因。

### 🏷️ 同业对比
基于大消费行业统计基准，展示公司在毛利率、净利率、ROE、营收增速等 5 项指标的行业分位排名。

### 💰 估值分析
计算 PE / PB / PS 估值倍数，并通过 PE Band 柱状图展示当前股价在历史估值区间中的位置。

### 📈 行情表现
展示近 5 年月线股价走势图 + 收益统计表（年化收益、最大回撤、夏普比率、月度胜率）。

### 📝 AI 投资分析
结构化生成核心结论、关键指标解读和投资建议段落。

---

## 系统架构

```
用户浏览器
    │
    ▼
Render Static Site (React 前端)
    │  API 调用
    ▼
Render Web Service (FastAPI 后端)
    │
    ├── SQLite 缓存 (7 天 TTL)
    │
    └── AkShare 数据接口
         ├── 新浪财经 (stock_financial_abstract)
         └── 同花顺 (stock_financial_abstract_ths)
```

**数据分析管线：**

```
数据获取 → 特征工程 (6项指标) → ML 预测 (XGBoost+LR) → 规则排雷 (3条) → AI 分析
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Tailwind CSS + Vite 5 |
| **后端** | Python 3.11 + FastAPI + uvicorn |
| **ML** | scikit-learn + XGBoost 2.0 |
| **数据** | pandas + numpy + AkShare |
| **缓存** | SQLite (WAL 模式) |
| **图表** | 纯 SVG 原生绘制 |
| **部署** | Render (Web Service + Static Site) |

---

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- npm 9+

### 安装与运行

**1. 克隆仓库**

```bash
git clone https://github.com/Wangshu0309/consumer-finance-robot.git
cd consumer-finance-robot/Faulty\ robot
```

**2. 安装 Python 依赖**

```bash
cd backend
pip install -r requirements.txt
```

**3. 启动后端**

```bash
python -c "import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=False)"
```

**4. 安装 Node 依赖并启动前端**

```bash
cd ../frontend
npm install
npx vite --host 0.0.0.0
```

**5. 打开浏览器**

访问 [http://localhost:5173](http://localhost:5173)

> 💡 Windows 用户可直接双击 `start-servers.bat` 一键启动后端和前端。

---

## ML 模型训练

```bash
cd backend
python models/train.py
```

训练脚本将：
1. 自动从大消费行业板块获取 280+ 只 A 股的财务数据
2. 进行 5 折分层交叉验证
3. 输出 AUC、准确率、精确率、召回率等评估指标
4. 将训练好的模型保存为 `model.joblib`

### 当前模型表现

| 指标 | XGBoost CV | LR CV | 集成 (留出) |
|------|-----------|-------|------------|
| AUC | 0.5795 | 0.5188 | **0.71** |
| Accuracy | 59.8% | 56.1% | **66.2%** |
| 样本量 | | | 4,540 条 |

---

## 部署指南

### 本地开发

```bash
# 终端 1：后端
cd backend
python -c "import uvicorn; uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=False)"

# 终端 2：前端
cd frontend
npx vite --host 0.0.0.0
```

### 生产部署 (Render)

**后端 (Web Service)**
- Root Directory: `Faulty robot/backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**前端 (Static Site)**
- Root Directory: `Faulty robot/frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_API_URL` = 后端地址

---

## 项目结构

```
Faulty robot/
├── backend/                     # Python FastAPI 后端
│   ├── main.py                  # FastAPI 入口, CORS 配置
│   ├── api/
│   │   └── predict.py           # POST /api/predict, 股票名称查询
│   ├── services/
│   │   ├── data_fetcher.py      # AkShare 数据获取 + SQLite 缓存
│   │   ├── feature_engine.py    # 6 项核心特征提取
│   │   ├── predictor.py         # XGBoost+LR 预测引擎 + 启发式回退
│   │   ├── rule_engine.py       # 三条硬性审计规则
│   │   ├── analysis_writer.py   # AI 投资分析生成 + 摘要卡片
│   │   └── deep_analysis.py     # 交叉验证/杜邦分析/同业对比/估值分析
│   ├── models/
│   │   └── train.py             # ML 模型训练脚本 (280+ 股, 5-fold CV)
│   └── requirements.txt
├── frontend/                    # React + TypeScript 前端
│   ├── src/
│   │   ├── App.tsx              # 根组件, 7 区布局编排
│   │   ├── main.tsx             # React 入口
│   │   ├── index.css            # Tailwind + 自定义暗色主题
│   │   ├── components/
│   │   │   ├── StockInput.tsx       # 输入组件 (自动补全 + 历史记录)
│   │   │   ├── SummaryCard.tsx      # 核心结论卡片
│   │   │   ├── ProbDisplay.tsx      # 概率大字展示
│   │   │   ├── WarningList.tsx      # 风险预警列表
│   │   │   ├── FeatureTable.tsx      # 核心指标表
│   │   │   ├── AnalysisText.tsx     # 结构化 AI 分析
│   │   │   ├── ValidationPanel.tsx  # 交叉验证信号面板
│   │   │   ├── DuPontPanel.tsx      # 杜邦分析面板
│   │   │   ├── PeerComparisonPanel.tsx # 同业对比面板
│   │   │   ├── ValuationPanel.tsx   # 估值分析面板
│   │   │   ├── PriceChart.tsx       # 股价走势图
│   │   │   ├── ReturnsTable.tsx     # 收益统计表
│   │   │   ├── TrendChart.tsx       # 营收与利润图
│   │   │   ├── RevenueBarChart.tsx  # 营收条形图
│   │   │   ├── MarginLineChart.tsx  # 毛利率折线图
│   │   │   ├── CashFlowChart.tsx    # 现金流对比图
│   │   │   ├── TurnoverChart.tsx    # 周转效率图
│   │   │   └── LoadingProgress.tsx  # 加载进度条
│   │   ├── hooks/
│   │   │   └── usePredict.ts    # API 调用 hook
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript 类型定义
│   │   └── utils/
│   │       └── format.ts        # 数值格式化工具
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── vercel.json
├── docs/                        # 设计文档
│   ├── superpowers/
│   │   ├── specs/2026-05-28-consumer-finance-robot-design.md
│   │   └── plans/2026-05-28-consumer-finance-robot.md
│   └── deploy-guide.md
├── start-servers.bat            # Windows 一键启动脚本
└── README.md
```

---

## 数据来源

本工具使用的所有财务数据均来自以下公开数据接口（通过 [AkShare](https://github.com/akfamily/akshare) 调用）：

- **新浪财经** — 财务摘要 (`stock_financial_abstract`)：营收、利润、毛利率、现金流、ROE 等核心指标
- **同花顺 (THS)** — 财务摘要 (`stock_financial_abstract_ths`)：周转天数、增长率等补充指标
- **新浪财经** — 日线行情 (`stock_zh_a_daily`)：股价走势数据

所有数据均已公开披露，本工具仅进行整合分析和可视化呈现。

---

## 免责声明

> ⚠️ **分析结果仅供参考，不构成投资建议。投资有风险，决策须谨慎。**
>
> 机器学习模型基于历史财务数据训练，不对未来表现做任何保证。模型 AUC 约 0.71，准确率约 66%，仍存在较大的预测误差空间。任何投资决策应结合个人风险承受能力、市场环境和专业意见综合判断。

---

## License

MIT License

---

**Built with ❤️ by Wangshu0309 · 2026**
