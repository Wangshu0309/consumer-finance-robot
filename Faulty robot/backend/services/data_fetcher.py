"""AkShare data fetching with SQLite cache for annual financial indicators."""

import os
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

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache.db")
CACHE_TTL_DAYS = 7


def _get_cache() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
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
    for suffix in (".SH", ".SZ", ".BJ", ".SS"):
        if code.endswith(suffix):
            code = code[:-len(suffix)]
    code = re.sub(r"[^0-9]", "", code)
    return code.zfill(6)


# ---- Stock listing validation (cached) ----
_listed_codes: Optional[set] = None
_listed_names: Optional[Dict[str, str]] = None
_listed_at = datetime.min


def _refresh_listed_codes() -> Optional[set]:
    global _listed_codes, _listed_names, _listed_at
    if _listed_codes is not None and (datetime.now() - _listed_at) < timedelta(hours=8):
        return _listed_codes
    try:
        df = ak.stock_info_a_code_name()
        _listed_codes = set()
        _listed_names = {}
        for _, row in df.iterrows():
            c = str(row["code"]).zfill(6)
            n = str(row["name"]).strip()
            _listed_codes.add(c)
            _listed_names[c] = n
        _listed_at = datetime.now()
        logger.info("Refreshed stock list: %d codes", len(_listed_codes))
    except Exception as e:
        logger.warning("Failed to refresh stock list: %s", e)
        if _listed_codes is None:
            return None
    return _listed_codes


def get_stock_name_from_list(code: str) -> str:
    code = normalize_code(code)
    _refresh_listed_codes()
    if _listed_names and code in _listed_names:
        return _listed_names[code]
    return ""


def is_listed(code: str) -> bool:
    code = normalize_code(code)
    codes = _refresh_listed_codes()
    if codes is None:
        return True
    return code in codes


class DataFetchError(Exception):
    """All data sources failed for this stock."""


# Mapping from stock_financial_abstract indicator names to canonical names
_ABSTRACT_INDICATOR_MAP = {
    "营业总收入": "revenue",
    "营业收入": "revenue",
    "营业成本": "cost_of_revenue",
    "归母净利润": "net_profit",
    "归属于母公司所有者的净利润": "net_profit",
    "净利润": "net_profit_all",
    "扣非净利润": "deducted_net_profit",
    "毛利率": "gross_margin",
    "销售净利率": "net_margin",
    "经营现金流量净额": "operating_cash_flow",
    "经营活动产生的现金流量净额": "operating_cash_flow",
    "期间费用率": "period_expense_ratio",
    "销售费用": "selling_expenses",
    "管理费用": "admin_expenses",
    "净资产收益率(ROE)": "roe",
    "资产负债率": "debt_ratio",
    "股东权益合计(净资产)": "equity",
    "资产总计": "total_assets",
}


def _fetch_financial_abstract(code: str) -> Optional[Dict[int, Dict[str, float]]]:
    """
    Primary source: stock_financial_abstract returns indicator×date matrix.
    We filter to annual reports (12-31) and pivot to {year: {metric: value}}.
    """
    try:
        df = ak.stock_financial_abstract(symbol=code)
        if df is None or df.empty:
            return None

        # Columns: 选项, 指标, YYYYMMDD, YYYYMMDD, ...
        # Filter to annual report dates (ending in 1231)
        date_cols = [c for c in df.columns if c.isdigit() and len(c) == 8 and c.endswith("1231")]
        if not date_cols:
            return None

        result: Dict[int, Dict[str, float]] = {}

        for _, row in df.iterrows():
            indicator = str(row["指标"]).strip()
            canon = _ABSTRACT_INDICATOR_MAP.get(indicator)
            if canon is None:
                continue

            for dc in date_cols:
                year = int(dc[:4])
                if year not in result:
                    result[year] = {}
                val = row[dc]
                try:
                    result[year][canon] = float(val) if pd.notna(val) else np.nan
                except (ValueError, TypeError):
                    result[year][canon] = np.nan

        return result if result else None
    except Exception as e:
        logger.warning("stock_financial_abstract failed for %s: %s", code, e)
        return None


def _fetch_balance_sheet_items(code: str) -> Dict[int, Dict[str, float]]:
    """
    Fetch AR and inventory from balance sheet (stock_zcfz_em).
    Returns {year: {"accounts_receivable": val, "inventory": val}}.
    """
    result: Dict[int, Dict[str, float]] = {}
    try:
        # Fetch recent balance sheet data (try a few dates)
        for report_date in ("20241231", "20231231", "20221231", "20211231", "20201231",
                            "20191231", "20181231", "20171231", "20161231"):
            try:
                df = ak.stock_zcfz_em(date=report_date)
                if df is None or df.empty:
                    continue
                row = df[df["股票代码"] == code]
                if row.empty:
                    continue
                row = row.iloc[0]
                year = int(report_date[:4])
                entry: Dict[str, float] = {}
                for col, canon in [("资产-应收账款", "accounts_receivable"),
                                   ("资产-存货", "inventory")]:
                    val = row.get(col, np.nan)
                    try:
                        entry[canon] = float(val) if pd.notna(val) else np.nan
                    except (ValueError, TypeError):
                        entry[canon] = np.nan
                if entry:
                    result[year] = entry
            except Exception:
                continue
    except Exception as e:
        logger.warning("Balance sheet fetch failed for %s: %s", code, e)

    return result


def _try_ths_abstract(code: str) -> Optional[Dict[int, Dict[str, float]]]:
    """Fallback: THS financial abstract (annual only)."""
    try:
        df = ak.stock_financial_abstract_ths(symbol=code, indicator="按年度")
        if df is None or df.empty:
            return None
        df = df.copy()

        # The first column is the report period (year)
        year_col = df.columns[0]
        result: Dict[int, Dict[str, float]] = {}

        # Map THS column positions/names to canonical
        # THS columns vary, try common patterns
        col_to_canon = {}
        for col in df.columns:
            col_str = str(col).strip()
            if "营业收入" in col_str and "同比" not in col_str:
                col_to_canon[col] = "revenue"
            elif "净利润" in col_str and "同比" not in col_str and "扣非" not in col_str:
                col_to_canon[col] = "net_profit"
            elif "扣非净利润" in col_str:
                col_to_canon[col] = "deducted_net_profit"
            elif "营业成本" in col_str:
                col_to_canon[col] = "cost_of_revenue"
            elif "销售费用" in col_str:
                col_to_canon[col] = "selling_expenses"
            elif "经营现金流" in col_str or "经营活动" in col_str:
                col_to_canon[col] = "operating_cash_flow"
            elif "应收账款" in col_str and "周转" not in col_str:
                col_to_canon[col] = "accounts_receivable"
            elif "存货" in col_str and "周转" not in col_str:
                col_to_canon[col] = "inventory"
            elif "毛利率" in col_str:
                col_to_canon[col] = "gross_margin"
            elif "销售费用率" in col_str:
                col_to_canon[col] = "selling_expense_ratio"
            elif "存货周转天数" in col_str:
                col_to_canon[col] = "inventory_turnover_days"
            elif "应收账款周转天数" in col_str:
                col_to_canon[col] = "ar_turnover_days"
            elif "存货周转率" in col_str:
                col_to_canon[col] = "inventory_turnover_ratio"
            elif "应收账款周转率" in col_str:
                col_to_canon[col] = "ar_turnover_ratio"
            elif "营业总收入同比增长" in col_str or "营收同比增长" in col_str:
                col_to_canon[col] = "revenue_growth_yoy"

        for _, row in df.iterrows():
            try:
                year = int(str(row[year_col])[:4])
            except (ValueError, TypeError):
                continue
            entry: Dict[str, float] = {}
            for col, canon in col_to_canon.items():
                val = row[col]
                try:
                    # Parse Chinese number formats like "1.47亿", "2.16亿"
                    if isinstance(val, str):
                        val_str = val.replace(",", "").replace("%", "")
                        if "亿" in val_str:
                            val = float(val_str.replace("亿", "")) * 1e8
                        elif "万" in val_str:
                            val = float(val_str.replace("万", "")) * 1e4
                        else:
                            val = float(val_str)
                    entry[canon] = float(val) if pd.notna(val) else np.nan
                except (ValueError, TypeError):
                    entry[canon] = np.nan
            if entry:
                result[year] = entry

        return result if result else None
    except Exception as e:
        logger.warning("stock_financial_abstract_ths failed for %s: %s", code, e)
        return None


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
    # Fallback: use the preloaded stock name list
    name = get_stock_name_from_list(code)
    if name:
        return name
    return ""


def _merge_annual_data(*dicts: Dict[int, Dict[str, float]]) -> Dict[int, Dict[str, float]]:
    """Merge multiple annual data dicts, preferring non-NaN values from earlier dicts."""
    result: Dict[int, Dict[str, float]] = {}
    for d in dicts:
        if not d:
            continue
        for year, metrics in d.items():
            if year not in result:
                result[year] = {}
            for k, v in metrics.items():
                if k not in result[year] or (isinstance(result[year].get(k), float) and np.isnan(result[year][k])):
                    result[year][k] = v
    return result


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
            result = {int(k): v for k, v in json.loads(data_json).items()}
            conn.close()
            return result
        else:
            logger.info("Cache expired for %s", code)

    # Fetch from fast sources and merge
    abstract_data = _fetch_financial_abstract(code)
    ths_data = _try_ths_abstract(code)

    annual = _merge_annual_data(abstract_data or {}, ths_data or {})

    if len(annual) < 1:
        conn.close()
        raise DataFetchError(f"无法获取股票 {code} 的年度财务数据，请确认代码是否正确或稍后重试。")

    # Cache it
    name = fetch_stock_name(code)
    cache_data = {}
    for k, v in annual.items():
        entry = {}
        for mk, mv in v.items():
            entry[mk] = None if (isinstance(mv, float) and np.isnan(mv)) else mv
        cache_data[str(k)] = entry
    conn.execute(
        "INSERT OR REPLACE INTO annual_data (code, data, stock_name, updated_at) VALUES (?, ?, ?, ?)",
        (code, json.dumps(cache_data), name, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()
    return annual


def fetch_stock_price(code: str) -> list:
    """Fetch monthly stock price history (past 3 years), forward-adjusted."""
    import datetime
    code = normalize_code(code)
    # Try multiple AkShare price sources
    methods = [
        lambda: ak.stock_zh_a_hist(symbol=code, period='monthly', start_date='20220101', end_date='20260601', adjust='qfq'),
        lambda: ak.stock_zh_a_hist(symbol=code, period='monthly', adjust='qfq'),
    ]
    for fn in methods:
        try:
            df = fn()
            if df is not None and not df.empty:
                result = []
                for _, row in df.iterrows():
                    try:
                        result.append({
                            "date": str(row["日期"])[:10],
                            "open": round(float(row["开盘"]), 2),
                            "close": round(float(row["收盘"]), 2),
                            "high": round(float(row["最高"]), 2),
                            "low": round(float(row["最低"]), 2),
                        })
                    except (ValueError, TypeError, KeyError):
                        continue
                if result:
                    return result
        except Exception as e:
            logger.warning("Price source failed for %s: %s", code, str(e)[:80])
            continue
    return []


def calc_returns_stats(monthly: list) -> dict:
    """Calculate performance stats from monthly close prices."""
    import statistics
    if len(monthly) < 12:
        return {}
    closes = [m["close"] for m in monthly]
    first_price, last_price = closes[0], closes[-1]

    # Annual returns
    annual_returns = {}
    for m in monthly:
        yr = int(m["date"][:4])
        if yr not in annual_returns:
            annual_returns[yr] = {"start": m["close"], "end": m["close"]}
        annual_returns[yr]["end"] = m["close"]
    yr_list = []
    for yr in sorted(annual_returns.keys()):
        d = annual_returns[yr]
        yr_list.append({"year": yr, "return_pct": round((d["end"] - d["start"]) / d["start"] * 100, 2)})

    # Total return
    total_ret = round((last_price - first_price) / first_price * 100, 2)

    # CAGR
    years = len(monthly) / 12
    cagr = round((pow(last_price / first_price, 1 / years) - 1) * 100, 2) if years > 0 and first_price > 0 else 0

    # Max drawdown
    peak = closes[0]
    max_dd = 0.0
    for c in closes:
        if c > peak: peak = c
        dd = (peak - c) / peak * 100
        if dd > max_dd: max_dd = dd
    max_dd = round(max_dd, 2)

    # Annualized volatility
    monthly_rets = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
    ann_vol = round(statistics.stdev(monthly_rets) * (12 ** 0.5) * 100, 2) if len(monthly_rets) > 1 else 0

    # Sharpe ratio (rf=2%)
    sharpe = round((cagr - 2.0) / ann_vol, 2) if ann_vol > 0 else 0

    # Win rate
    wins = sum(1 for r in monthly_rets if r > 0)
    win_rate = round(wins / len(monthly_rets) * 100, 2) if monthly_rets else 0

    return {
        "current_price": last_price,
        "total_return_pct": total_ret,
        "cagr_pct": cagr,
        "max_drawdown_pct": max_dd,
        "annual_volatility_pct": ann_vol,
        "sharpe_ratio": sharpe,
        "win_rate_pct": win_rate,
        "annual_returns": yr_list,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    data = fetch_financial_data("600519")
    for yr in sorted(data.keys()):
        m = data[yr]
        print(f"{yr}: revenue={m.get('revenue')}, net_profit={m.get('net_profit')}, "
              f"gross_margin={m.get('gross_margin')}, ocf={m.get('operating_cash_flow')}, "
              f"ar={m.get('accounts_receivable')}, inv={m.get('inventory')}")
