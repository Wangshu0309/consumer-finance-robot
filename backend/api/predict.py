"""POST /api/predict — main prediction endpoint."""

from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from services.data_fetcher import fetch_financial_data, fetch_stock_name, normalize_code, DataFetchError
from services.feature_engine import extract_features
from services.predictor import get_prediction
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
