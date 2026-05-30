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
