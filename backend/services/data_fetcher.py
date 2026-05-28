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
