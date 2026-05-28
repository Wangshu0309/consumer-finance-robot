#!/usr/bin/env python
"""
Train XGBoost + LogisticRegression ensemble on consumer/retail/manufacturing stocks.
Weights are determined by per-model AUC on validation set.

Usage:
    cd backend && python models/train.py
"""

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from xgboost import XGBClassifier

from services.data_fetcher import fetch_financial_data
from services.feature_engine import extract_features
from services.predictor import _make_feature_vector, save_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

TRAINING_STOCKS = [
    "600519", "000858", "002304", "600809", "000568",
    "600887", "603288", "002557", "600600", "000895",
    "002568", "603369",
    "000333", "000651", "600690", "002032", "002242", "002508",
    "601933", "002697", "603939", "002727",
    "002714", "300498",
    "603833", "002563",
    "600104", "000625",
    "600132", "603899",
]


def fetch_batch_data(codes):
    """Fetch training data: (feature_arrays, labels) for all stock-year pairs."""
    X_list, y_list = [], []
    for code in codes:
        try:
            annual = fetch_financial_data(code)
        except Exception:
            continue

        years = sorted(annual.keys())
        for i in range(len(years) - 1):
            t_year = years[i]
            t1_year = years[i + 1]
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

    return X_list, y_list


def main():
    logger.info("Fetching training data for %d stocks...", len(TRAINING_STOCKS))
    X_list, y_list = fetch_batch_data(TRAINING_STOCKS)
    logger.info("Got %d samples, %d positive", len(X_list), sum(y_list))

    if len(X_list) < 20:
        logger.error("Insufficient training samples (%d < 20).", len(X_list))
        sys.exit(1)

    X = np.array(X_list)
    y = np.array(y_list)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # Train XGBoost
    xgb = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        random_state=42,
        eval_metric="logloss",
    )
    xgb.fit(X_train_scaled, y_train)
    xgb_auc = roc_auc_score(y_val, xgb.predict_proba(X_val_scaled)[:, 1])
    xgb_acc = accuracy_score(y_val, xgb.predict(X_val_scaled))
    logger.info("XGBoost — AUC: %.4f, Accuracy: %.2f%%", xgb_auc, xgb_acc * 100)

    # Train LogisticRegression
    lr = LogisticRegression(
        penalty="l2", C=1.0, class_weight="balanced", max_iter=2000, random_state=42
    )
    lr.fit(X_train_scaled, y_train)
    lr_auc = roc_auc_score(y_val, lr.predict_proba(X_val_scaled)[:, 1])
    lr_acc = accuracy_score(y_val, lr.predict(X_val_scaled))
    logger.info("LogisticRegression — AUC: %.4f, Accuracy: %.2f%%", lr_auc, lr_acc * 100)

    # Weight by AUC
    total_auc = xgb_auc + lr_auc
    xgb_weight = xgb_auc / total_auc if total_auc > 0 else 0.6
    lr_weight = lr_auc / total_auc if total_auc > 0 else 0.4
    logger.info("Ensemble weights: XGB=%.2f, LR=%.2f", xgb_weight, lr_weight)

    models = {
        "xgb": xgb,
        "lr": lr,
        "xgb_weight": xgb_weight,
        "lr_weight": lr_weight,
    }
    save_model(scaler, models)
    logger.info("Model saved to model.joblib")


if __name__ == "__main__":
    main()
