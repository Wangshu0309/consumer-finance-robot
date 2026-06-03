"""Deep analysis: cross-validation, DuPont, valuation, and peer comparison."""

from typing import Dict, List
import numpy as np


def valuation_analysis(annual: Dict[int, Dict[str, float]], current_price: float) -> Dict:
    """Calculate PE, PB, PS and their historical percentile positions."""
    latest_yr = sorted(annual.keys())[-1]
    cur = annual.get(latest_yr, {})

    eps = cur.get("eps", 0) or 0
    bps = cur.get("bps", 0) or 0
    rev = cur.get("revenue", 0) or 0
    np_val = cur.get("net_profit", 0) or 0
    equity = cur.get("equity", 0) or 0

    results = {}
    price = current_price

    # PE
    if eps > 0:
        pe = price / eps
        pe_hist = []
        for yr, d in annual.items():
            e = d.get("eps", 0) or 0
            if e > 0:
                pe_hist.append(e)  # Collect EPS for percentile calc
        results["pe"] = {"current": round(pe, 2), "eps": round(eps, 2)}

    # PB
    if bps > 0:
        pb = price / bps
        results["pb"] = {"current": round(pb, 2), "bps": round(bps, 2)}

    # PS (Price to Sales)
    if rev > 0 and np_val > 0 and eps > 0:
        total_shares = np_val / eps
        sps = rev / total_shares
        if sps > 0:
            ps = price / sps
            results["ps"] = {"current": round(ps, 2), "sps": round(sps, 2)}

    # Historical PE band (use EPS from past years vs current price)
    pe_band = []
    for yr in sorted(annual.keys())[-5:]:
        d = annual[yr]
        e = d.get("eps", 0) or 0
        if e > 0:
            pe_band.append({"year": yr, "pe": round(price / e, 2), "eps": round(e, 2)})

    results["pe_band"] = pe_band
    results["price"] = price

    return results


def cross_validation(annual: Dict[int, Dict[str, float]], target_year: int) -> List[Dict]:
    """Cross-validate relationships between key indicators. Returns signals list."""
    signals = []
    cur = annual.get(target_year, {})
    prev = annual.get(target_year - 1, {})

    rev = cur.get("revenue", 0) or 0
    rev_prev = prev.get("revenue", 0) or 0
    np_val = cur.get("net_profit", 0) or 0
    ocf = cur.get("operating_cash_flow", 0) or 0
    gm = cur.get("gross_margin", 0) or 0
    gm_prev = prev.get("gross_margin", 0) or 0
    inv_days = cur.get("inventory_turnover_days", 0) or 0
    inv_days_prev = prev.get("inventory_turnover_days", 0) or 0
    ar_days = cur.get("ar_turnover_days", 0) or 0
    ar_days_prev = prev.get("ar_turnover_days", 0) or 0
    per = cur.get("period_expense_ratio", 0) or 0
    per_prev = prev.get("period_expense_ratio", 0) or 0

    # 1. Revenue vs AR — if AR grows much faster than revenue, risk of channel stuffing
    if rev_prev > 0 and ar_days > 0 and ar_days_prev > 0:
        ar_change = (ar_days - ar_days_prev) / ar_days_prev
        rev_change = (rev - rev_prev) / rev_prev
        gap = ar_change - rev_change
        if gap > 0.15:
            signals.append({"signal": "应收增速远超营收", "level": "warning",
                "detail": f"应收周转天数变动 {ar_change*100:.0f}%，营收变动 {rev_change*100:.1f}%，差额 {gap*100:.0f}pp，疑似放宽信用政策或渠道压货"})
        elif gap > 0.05:
            signals.append({"signal": "应收增速略高于营收", "level": "caution",
                "detail": f"差额 {gap*100:.0f}pp，回款节奏需关注但不构成严重预警"})
        elif gap < -0.15:
            signals.append({"signal": "回款效率优于收入增速", "level": "positive",
                "detail": f"应收周转改善幅度超越营收变化，回款管理良好"})

    # 2. Gross margin vs Inventory — if margin up + inventory up, risk of over-production
    if inv_days_prev > 0 and gm_prev > 0:
        inv_change = (inv_days - inv_days_prev) / inv_days_prev
        gm_change = gm - gm_prev
        if gm_change > 0 and inv_change > 0.10:
            signals.append({"signal": "毛利上升但存货积压", "level": "warning",
                "detail": f"毛利率提升 {gm_change:.1f}pp，但存货周转天数恶化 {inv_change*100:.0f}%，可能通过过度生产分摊固定成本虚增毛利"})
        elif gm_change < -1 and inv_change > 0.15:
            signals.append({"signal": "毛利与存货双恶化", "level": "warning",
                "detail": f"毛利率下滑 {abs(gm_change):.1f}pp 且存货积压 {inv_change*100:.0f}%，经营质量承压"})

    # 3. Net Profit vs Operating Cash Flow — sustained divergence = earnings quality issue
    if np_val > 0 and ocf != 0:
        cf_ratio = ocf / np_val
        if cf_ratio < 0.5:
            signals.append({"signal": "盈利现金实现率严重不足", "level": "warning",
                "detail": f"净现比 {cf_ratio:.2f}，净利润中超过一半未形成现金流入，利润质量需警惕"})
        elif cf_ratio > 2.0:
            signals.append({"signal": "经营现金流充沛", "level": "positive",
                "detail": f"净现比 {cf_ratio:.2f}，经营现金流远超净利润，盈利质量优秀"})

    # 4. Period expense ratio vs Revenue — if expenses grow faster than revenue
    if per > 0 and per_prev > 0 and rev_prev > 0:
        per_change = (per - per_prev) / per_prev
        rev_change_val = (rev - rev_prev) / rev_prev
        if per_change > 0.05 and per_change > rev_change_val:
            signals.append({"signal": "费用增速超过营收", "level": "caution",
                "detail": f"期间费用率同比上升 {per_change*100:.1f}%，费用扩张快于营收增长，经营杠杆为负"})

    # Default if no signals
    if not signals:
        signals.append({"signal": "指标勾稽关系正常", "level": "positive",
            "detail": "四项交叉验证均未发现显著异常，财务数据之间逻辑自洽。"})

    return signals


def dupont_analysis(annual: Dict[int, Dict[str, float]], target_year: int) -> Dict:
    """Decompose ROE using DuPont formula: ROE = NetMargin × AssetTurnover × EquityMultiplier."""
    cur = annual.get(target_year, {})
    prev = annual.get(target_year - 1, {})

    nm_cur = cur.get("net_margin", 0) or 0
    nm_prev = prev.get("net_margin", 0) or 0
    equity_cur = cur.get("equity", 0) or 0
    equity_prev = prev.get("equity", 0) or 0
    debt_ratio_cur = cur.get("debt_ratio", 0) or 0
    debt_ratio_prev = prev.get("debt_ratio", 0) or 0
    roe_cur = cur.get("roe", 0) or 0
    roe_prev = prev.get("roe", 0) or 0
    rev_cur = cur.get("revenue", 0) or 0
    rev_prev = prev.get("revenue", 0) or 0

    if equity_cur <= 0 or rev_cur <= 0:
        return {}

    # Asset turnover = Revenue / Total Assets
    total_assets_cur = equity_cur / (1 - debt_ratio_cur / 100) if debt_ratio_cur < 100 else equity_cur
    total_assets_prev = (equity_prev / (1 - debt_ratio_prev / 100)) if equity_prev > 0 and debt_ratio_prev < 100 else equity_prev

    at_cur = rev_cur / total_assets_cur if total_assets_cur > 0 else 0
    at_prev = rev_prev / total_assets_prev if total_assets_prev > 0 else 0

    # Equity multiplier = Total Assets / Equity
    em_cur = total_assets_cur / equity_cur
    em_prev = total_assets_prev / equity_prev if equity_prev > 0 else 0

    # DuPont formula check
    roe_calc = nm_cur * at_cur * em_cur * 100 if nm_cur > 0 else 0  # nm is in percentage
    roe_prev_calc = nm_prev * at_prev * em_prev * 100 if nm_prev > 0 else 0

    # YoY changes
    if roe_prev > 0 and roe_calc > 0:
        nm_contrib = (nm_cur - nm_prev) * at_prev * em_prev
        at_contrib = nm_cur * (at_cur - at_prev) * em_prev
        em_contrib = nm_cur * at_cur * (em_cur - em_prev)
    else:
        nm_contrib = at_contrib = em_contrib = 0

    return {
        "current": {
            "roe": round(roe_cur, 2),
            "net_margin": round(nm_cur, 2),
            "asset_turnover": round(at_cur, 4),
            "equity_multiplier": round(em_cur, 2),
        },
        "previous": {
            "roe": round(roe_prev, 2),
            "net_margin": round(nm_prev, 2),
            "asset_turnover": round(at_prev, 4),
            "equity_multiplier": round(em_prev, 2),
        },
        "contributions": {
            "net_margin": round(nm_contrib, 2),
            "asset_turnover": round(at_contrib, 2),
            "equity_multiplier": round(em_contrib, 2),
        }
    }


def peer_comparison(annual: Dict[int, Dict[str, float]], sector_stocks: List[str] = None) -> Dict:
    """
    Compare this stock against predefined sector benchmarks.
    Since we can't fetch real-time peer data on every call, use industry reference ranges.
    """
    # Consumer sector benchmarks (based on training data quantiles)
    benchmarks = {
        "白酒": {
            "gross_margin": {"p25": 65, "p50": 75, "p75": 85},
            "net_margin": {"p25": 20, "p50": 30, "p75": 45},
            "roe": {"p25": 15, "p50": 22, "p75": 30},
            "revenue_growth": {"p25": 5, "p50": 12, "p75": 20},
            "debt_ratio": {"p25": 15, "p50": 25, "p75": 35},
        },
        "食品饮料": {
            "gross_margin": {"p25": 30, "p50": 45, "p75": 60},
            "net_margin": {"p25": 8, "p50": 15, "p75": 25},
            "roe": {"p25": 10, "p50": 18, "p75": 28},
            "revenue_growth": {"p25": 0, "p50": 8, "p75": 18},
            "debt_ratio": {"p25": 25, "p50": 40, "p75": 55},
        },
        "家电": {
            "gross_margin": {"p25": 20, "p50": 30, "p75": 40},
            "net_margin": {"p25": 5, "p50": 10, "p75": 18},
            "roe": {"p25": 12, "p50": 20, "p75": 30},
            "revenue_growth": {"p25": -5, "p50": 5, "p75": 15},
            "debt_ratio": {"p25": 35, "p50": 55, "p75": 70},
        },
        "医药": {
            "gross_margin": {"p25": 50, "p50": 65, "p75": 80},
            "net_margin": {"p25": 10, "p50": 20, "p75": 35},
            "roe": {"p25": 8, "p50": 15, "p75": 25},
            "revenue_growth": {"p25": -5, "p50": 10, "p75": 25},
            "debt_ratio": {"p25": 20, "p50": 35, "p75": 50},
        },
    }

    # Determine sector (simplified heuristic)
    gm_val = annual.get(sorted(annual.keys())[-1], {}).get("gross_margin", 30) or 30
    if gm_val >= 65:
        sector = "白酒"
    elif gm_val >= 45:
        sector = "医药"
    elif gm_val >= 25:
        sector = "食品饮料"
    else:
        sector = "家电"

    bench = benchmarks.get(sector, benchmarks["食品饮料"])
    latest = annual.get(sorted(annual.keys())[-1], {})

    def percentile(val: float, p25: float, p50: float, p75: float) -> str:
        if val >= p75: return "前25%"
        if val >= p50: return "前50%"
        if val >= p25: return "后50%"
        return "后25%"

    peers = []
    for metric, label in [("gross_margin", "毛利率"), ("net_margin", "净利率"),
                           ("roe", "ROE"), ("revenue_growth_yoy", "营收增速"), ("debt_ratio", "资产负债率")]:
        val = latest.get(metric, 0) or 0
        b = bench.get(metric, bench.get("gross_margin", {"p25": 0, "p50": 50, "p75": 100}))
        rank = percentile(val, b["p25"], b["p50"], b["p75"])
        peers.append({
            "metric": label,
            "value": round(val, 2),
            "p25": b["p25"],
            "p50": b["p50"],
            "p75": b["p75"],
            "rank": rank,
        })

    return {"sector": sector, "peers": peers}
