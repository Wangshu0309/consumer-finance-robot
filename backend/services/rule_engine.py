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
