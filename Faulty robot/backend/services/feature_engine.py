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
    if rev_growth is not None and not np.isnan(rev_growth):
        # THS returns growth rates as percentages (e.g. 15.66 = 15.66%), normalize to decimal
        if abs(rev_growth) > 0.5:
            rev_growth = rev_growth / 100.0
    else:
        c = _get(cur, "revenue")
        p = _get(prev, "revenue")
        rev_growth = float((c - p) / abs(p)) if (c is not None and p is not None and p != 0) else np.nan
    if rev_growth is None or np.isnan(rev_growth):
        return None

    # 2. Gross margin change
    gm_cur = _get(cur, "gross_margin")
    gm_prev = _get(prev, "gross_margin")
    gm_is_pct = (gm_cur is not None and gm_cur > 1.0) or (gm_prev is not None and gm_prev > 1.0)
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
        # If source data is in percentage form (e.g. 91.93%), convert to decimal
        if gm_is_pct:
            gm_change = gm_change / 100.0

    # 3. Net cash ratio (operating cash flow / net profit)
    ocf = _get(cur, "operating_cash_flow")
    np_val = _get(cur, "net_profit")
    cf_ratio = _safe_div(ocf, np_val)

    # 4. Selling expense ratio — prefer direct ratio, then period_expense_ratio as proxy
    se_ratio = _get(cur, "selling_expense_ratio")
    if se_ratio is None or np.isnan(se_ratio):
        rev = _get(cur, "revenue")
        se = _get(cur, "selling_expenses")
        se_ratio = _safe_div(se, rev)
    if se_ratio is None or np.isnan(se_ratio):
        per = _get(cur, "period_expense_ratio")
        se_ratio = float(per / 100.0) if (per is not None and not np.isnan(per)) else np.nan

    # 5. Inventory turnover days change
    inv_days_cur = _get(cur, "inventory_turnover_days")
    inv_days_prev = _get(prev, "inventory_turnover_days")
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
