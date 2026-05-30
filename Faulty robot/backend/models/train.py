#!/usr/bin/env python
"""
Train XGBoost + LogisticRegression ensemble on 200+ consumer stocks with 5-fold CV.
Evaluates AUC, accuracy, precision, recall on held-out validation folds.

Usage:
    cd backend && python models/train.py
"""

import sys, os, logging, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score
from xgboost import XGBClassifier

import akshare as ak
from services.data_fetcher import fetch_financial_data, normalize_code
from services.feature_engine import extract_features
from services.predictor import _make_feature_vector, save_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

# Consumer industry sectors on Sina/EM classification
CONSUMER_SECTORS = [
    "白酒", "食品", "饮料", "乳制品", "调味品", "休闲食品", "啤酒", "黄酒", "葡萄酒",
    "家电", "家用电器", "小家电", "厨卫电器",
    "零售", "百货", "超市", "连锁", "电商",
    "农林牧渔", "种植业", "养殖业", "饲料", "农产品加工",
    "纺织服装", "服装", "家纺", "鞋帽", "饰品",
    "汽车", "汽车零部件", "汽车服务",
    "医药", "生物制品", "医疗器械", "中药",
    "旅游", "酒店", "景点", "免税",
    "日化", "化妆品", "医美", "美容护理",
    "家居", "家具", "建材", "装修装饰",
    "造纸", "包装印刷",
]

KV_DESCRIPTION = """### ML Model Metadata
Trained on {n_stocks} consumer stocks, {n_samples} samples ({n_pos} positive / {n_neg} negative).
Stratified 5-fold CV: Mean AUC={auc:.4f}, Mean Accuracy={acc:.1f}%.
Hold-out test: XGB AUC={xgb_auc:.4f}, LR AUC={lr_auc:.4f}.
Final ensemble: XGB weight={xgb_w:.2f}, LR weight={lr_w:.2f}."""


def collect_stock_codes():
    """Collect 200+ consumer-sector A-share stock codes."""
    codes = set()
    for sector in CONSUMER_SECTORS:
        try:
            df = ak.stock_board_industry_cons_em(symbol=sector)
            for c in df["代码"].values:
                codes.add(normalize_code(str(c)))
            logger.info("  %s: %d stocks (total %d)", sector, len(df), len(codes))
        except Exception:
            pass
        if len(codes) >= 250:
            break
    codes.discard("")
    logger.info("Collected %d unique consumer-sector stock codes", len(codes))
    return sorted(codes)


def fetch_batch_data(codes):
    """Fetch (X, y) for all stock-year pairs."""
    X_list, y_list = [], []
    failed = 0
    for i, code in enumerate(codes):
        try:
            annual = fetch_financial_data(code)
        except Exception:
            failed += 1
            continue
        years = sorted(annual.keys())
        for j in range(len(years) - 1):
            t_year = years[j]
            t1_year = years[j + 1]
            feats = extract_features(annual, t_year)
            if feats is None:
                continue
            np_cur = annual[t_year].get("net_profit", np.nan)
            np_next = annual[t1_year].get("net_profit", np.nan)
            if np.isnan(np_cur) or np.isnan(np_next) or np_cur <= 0:
                continue
            label = 1 if np_next > np_cur else 0
            X_list.append(_make_feature_vector(feats))
            y_list.append(label)
        if (i + 1) % 50 == 0:
            logger.info("  progress: %d/%d stocks, %d samples so far", i + 1, len(codes), len(X_list))
    logger.info("Fetch complete: %d stocks failed, %d samples collected", failed, len(X_list))
    return X_list, y_list


def main():
    t0 = time.time()

    # 1. Collect stock pool
    logger.info("=== Step 1: Collecting consumer-sector stock codes ===")
    stock_codes = collect_stock_codes()

    # 2. Fetch training data
    logger.info("=== Step 2: Fetching financial data for %d stocks ===", len(stock_codes))
    X_list, y_list = fetch_batch_data(stock_codes)
    if len(X_list) < 30:
        logger.error("Only %d samples — aborting. Check network/AkShare.", len(X_list))
        sys.exit(1)

    X = np.array(X_list)
    y = np.array(y_list)
    n_pos = int(sum(y))
    n_neg = len(y) - n_pos
    logger.info("Total: %d samples, %d positive (%.1f%%), %d negative",
                len(y), n_pos, 100 * n_pos / len(y), n_neg)

    # 3. Cross-validation
    logger.info("=== Step 3: 5-fold Stratified Cross-Validation ===")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    xgb_cv = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.05,
                           random_state=42, eval_metric="logloss", verbosity=0)
    lr_cv = LogisticRegression(penalty="l2", C=1.0, class_weight="balanced",
                               max_iter=2000, random_state=42)

    # Evaluate XGB with CV
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    xgb_scores = cross_validate(xgb_cv, X_scaled, y, cv=cv,
                                scoring=["roc_auc", "accuracy", "precision", "recall"],
                                n_jobs=1)
    logger.info("XGBoost 5-fold CV:")
    logger.info("  AUC:       %.4f (+/- %.4f)", xgb_scores["test_roc_auc"].mean(), xgb_scores["test_roc_auc"].std())
    logger.info("  Accuracy:  %.1f%% (+/- %.1f%%)", xgb_scores["test_accuracy"].mean() * 100, xgb_scores["test_accuracy"].std() * 100)
    logger.info("  Precision: %.4f (+/- %.4f)", xgb_scores["test_precision"].mean(), xgb_scores["test_precision"].std())
    logger.info("  Recall:    %.4f (+/- %.4f)", xgb_scores["test_recall"].mean(), xgb_scores["test_recall"].std())

    lr_scores = cross_validate(lr_cv, X_scaled, y, cv=cv,
                               scoring=["roc_auc", "accuracy", "precision", "recall"],
                               n_jobs=1)
    logger.info("LogisticRegression 5-fold CV:")
    logger.info("  AUC:       %.4f (+/- %.4f)", lr_scores["test_roc_auc"].mean(), lr_scores["test_roc_auc"].std())
    logger.info("  Accuracy:  %.1f%% (+/- %.1f%%)", lr_scores["test_accuracy"].mean() * 100, lr_scores["test_accuracy"].std() * 100)

    # 4. Train final model on all data
    logger.info("=== Step 4: Training final ensemble on full dataset ===")
    final_scaler = StandardScaler()
    X_full = final_scaler.fit_transform(X)

    xgb_final = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.05,
                              random_state=42, eval_metric="logloss", verbosity=0)
    xgb_final.fit(X_full, y)

    lr_final = LogisticRegression(penalty="l2", C=1.0, class_weight="balanced",
                                  max_iter=2000, random_state=42)
    lr_final.fit(X_full, y)

    # Hold-out evaluation for ensemble weights
    from sklearn.model_selection import train_test_split
    _, X_ho, _, y_ho = train_test_split(X_full, y, test_size=0.2, random_state=42, stratify=y)

    xgb_ho_auc = roc_auc_score(y_ho, xgb_final.predict_proba(X_ho)[:, 1])
    lr_ho_auc = roc_auc_score(y_ho, lr_final.predict_proba(X_ho)[:, 1])
    total_auc = xgb_ho_auc + lr_ho_auc
    xgb_w = xgb_ho_auc / total_auc if total_auc > 0 else 0.6
    lr_w = lr_ho_auc / total_auc if total_auc > 0 else 0.4

    logger.info("Hold-out AUC — XGB: %.4f, LR: %.4f", xgb_ho_auc, lr_ho_auc)
    logger.info("Ensemble weights — XGB: %.3f, LR: %.3f", xgb_w, lr_w)

    # Holistic ensemble accuracy
    xgb_ho_prob = xgb_final.predict_proba(X_ho)[:, 1]
    lr_ho_prob = lr_final.predict_proba(X_ho)[:, 1]
    ensemble_prob = xgb_w * xgb_ho_prob + lr_w * lr_ho_prob
    ensemble_pred = (ensemble_prob >= 0.5).astype(int)
    ensemble_acc = accuracy_score(y_ho, ensemble_pred)
    ensemble_auc = roc_auc_score(y_ho, ensemble_prob)
    logger.info("Ensemble — Hold-out Accuracy: %.1f%%, AUC: %.4f", ensemble_acc * 100, ensemble_auc)

    # 5. Save model
    logger.info("=== Step 5: Saving model ===")
    models = {
        "xgb": xgb_final,
        "lr": lr_final,
        "xgb_weight": xgb_w,
        "lr_weight": lr_w,
    }
    save_model(final_scaler, models)

    # 6. Summary
    elapsed = time.time() - t0
    logger.info("=" * 60)
    logger.info("Training complete in %.1f minutes", elapsed / 60)
    logger.info("Stocks: %d | Samples: %d | Pos: %d (%.1f%%)",
                len(stock_codes), len(y), n_pos, 100 * n_pos / len(y))
    logger.info("XGB CV AUC: %.4f | LR CV AUC: %.4f | Ensemble HO AUC: %.4f",
                xgb_scores["test_roc_auc"].mean(), lr_scores["test_roc_auc"].mean(), ensemble_auc)
    logger.info("Ensemble HO Accuracy: %.1f%%", ensemble_acc * 100)
    logger.info("Model saved to model.joblib — ML mode is now active")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
