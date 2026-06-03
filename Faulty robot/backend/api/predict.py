"""POST /api/predict — main prediction endpoint."""

from typing import Dict, Any

import numpy as np
from fastapi import APIRouter, HTTPException

from services.data_fetcher import fetch_financial_data, fetch_stock_name, normalize_code, DataFetchError, is_listed, fetch_stock_price, calc_returns_stats
from services.feature_engine import extract_features
from services.predictor import get_prediction
from services.rule_engine import check_rules, check_data_sufficient
from services.analysis_writer import generate_analysis, generate_summary
from services.deep_analysis import cross_validation, dupont_analysis, peer_comparison

router = APIRouter()


@router.get("/stock-name/{code}")
def stock_name_lookup(code: str):
    """Quick stock name lookup for autocomplete."""
    c = normalize_code(code)
    name = fetch_stock_name(c) or c
    return {"code": c, "name": name}


@router.post("/predict")
def predict(body: Dict[str, Any]) -> Dict[str, Any]:
    raw_code = str(body.get("stock_code", "")).strip()
    if not raw_code:
        raise HTTPException(status_code=400, detail="请输入股票代码")

    code = normalize_code(raw_code)

    if not is_listed(code):
        raise HTTPException(
            status_code=400,
            detail=f"股票 {code} 未在沪深京 A 股当前交易名单中，可能已退市、停牌或代码无效。本工具仅支持正在上市交易的 A 股。",
        )

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
                "trend": [],
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
                "trend": [],
                "features": None,
            },
        }

    prob, from_ml = get_prediction(feats)
    warnings = check_rules(annual, feats, target_year)
    analysis = generate_analysis(stock_name, prob, warnings, feats)
    summary = generate_summary(prob, warnings, feats)

    # Stock price data
    price_data = fetch_stock_price(code)
    returns = calc_returns_stats(price_data) if price_data else {}

    # Deep analysis
    validation = cross_validation(annual, target_year)
    dupont = dupont_analysis(annual, target_year)
    peers = peer_comparison(annual)

    # Build trend data for charting (last 8 years)
    trend = []
    for yr in sorted(annual.keys())[-8:]:
        rev = annual[yr].get("revenue")
        np_val = annual[yr].get("net_profit")
        gm = annual[yr].get("gross_margin")
        ocf = annual[yr].get("operating_cash_flow")
        rev_val = round(rev / 1e8, 2) if rev is not None and not (isinstance(rev, float) and np.isnan(rev)) else 0
        np2 = round((np_val or 0) / 1e8, 2)
        gm2 = round(gm or 0, 2) if gm is not None and not (isinstance(gm, float) and np.isnan(gm)) else 0
        ocf2 = round((ocf or 0) / 1e8, 2)

        # YoY growth rates
        prev_rev = annual.get(yr - 1, {}).get("revenue")
        prev_np = annual.get(yr - 1, {}).get("net_profit")
        rev_growth = 0.0
        np_growth = 0.0
        if prev_rev and prev_rev > 0:
            rev_growth = round((rev - prev_rev) / prev_rev * 100, 1)
        if prev_np and abs(prev_np) > 0:
            np_growth = round((np_val - prev_np) / abs(prev_np) * 100, 1) if np_val is not None else 0.0

        # Expense ratios from annual data
        per = annual[yr].get("period_expense_ratio")
        er = round(per, 2) if per is not None and not (isinstance(per, float) and np.isnan(per)) else 0

        # Turnover days
        inv_days = annual[yr].get("inventory_turnover_days")
        ar_days = annual[yr].get("ar_turnover_days")
        id_val = round(inv_days, 2) if inv_days is not None and not (isinstance(inv_days, float) and np.isnan(inv_days)) else 0
        ad_val = round(ar_days, 4) if ar_days is not None and not (isinstance(ar_days, float) and np.isnan(ar_days)) else 0

        if rev_val > 0:
            trend.append({
                "year": yr,
                "revenue": rev_val,
                "net_profit": np2,
                "gross_margin": gm2,
                "operating_cash_flow": ocf2,
                "revenue_growth": rev_growth,
                "np_growth": np_growth,
                "expense_ratio": er,
                "inventory_turnover_days": id_val,
                "ar_turnover_days": ad_val,
            })

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
            "analysis": analysis,
            "summary": summary,
            "trend": trend,
            "price_data": price_data[-60:],
            "returns": returns,
            "validation": validation,
            "dupont": dupont,
            "peers": peers,
            "features": features_display,
        },
    }
