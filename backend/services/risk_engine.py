# ============================================================
# services/risk_engine.py — RADAR AI Risk Engine
# ============================================================
#
# RADAR = Risk-Adaptive Dynamic Assessment for Riders
# Part of the DPRSM (Dynamic Parametric Risk Scoring Model)
#
# Architecture:
#   - XGBoost model  → 70% weight
#   - Random Forest  → 30% weight
#   Final: R = 0.7 × XGB_score + 0.3 × RF_score
#
# Since we want zero setup friction, we use scikit-learn's
# GradientBoostingClassifier as the XGBoost stand-in and
# RandomForestClassifier for the RF component.
#
# Both models are trained on SYNTHETIC data at startup.
# In production, replace with real historical data.
# ============================================================

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import random

# ── Role-specific risk weights ────────────────────────────────
# Each role has different sensitivity to different risk factors.
# Food delivery workers are most exposed to weather (rain = bad).
# E-commerce delivery is more traffic/time sensitive.

ROLE_WEIGHTS = {
    "food_delivery": {
        "weather": 0.40,  # highest weather exposure
        "aqi": 0.20,
        "traffic": 0.20,
        "historical": 0.20
    },
    "grocery_delivery": {
        "weather": 0.30,
        "aqi": 0.25,
        "traffic": 0.25,
        "historical": 0.20
    },
    "ecommerce_delivery": {
        "weather": 0.25,
        "aqi": 0.20,
        "traffic": 0.35,  # most traffic-sensitive
        "historical": 0.20
    }
}

# ── Premium mapping ───────────────────────────────────────────
PREMIUM_MAP = {
    "low": 10,
    "medium": 17,
    "high": 25,
    "critical": 25   # same price + alert sent
}

# ── Global model objects ──────────────────────────────────────
xgb_model = None
rf_model = None
scaler = None


def generate_synthetic_training_data(n_samples=1000):
    """
    Generate synthetic training data for RADAR models.
    
    In production: replace with historical disruption records.
    Each row = one observation. Label = was_disrupted (1/0).
    
    The synthetic logic: higher rain + AQI + historical disruptions
    → higher chance of disruption (label=1).
    """
    np.random.seed(42)  # reproducibility

    # Generate 14 features
    rainfall_mm         = np.random.exponential(scale=5, size=n_samples)       # mostly low, spikes high
    rainfall_7d_avg     = np.random.exponential(scale=3, size=n_samples)
    aqi                 = np.random.normal(150, 80, n_samples).clip(0, 500)
    temperature         = np.random.normal(32, 8, n_samples).clip(15, 50)
    humidity            = np.random.normal(65, 20, n_samples).clip(10, 100)
    wind_speed          = np.random.normal(15, 8, n_samples).clip(0, 80)
    hour_of_day         = np.random.randint(0, 24, n_samples)
    day_of_week         = np.random.randint(0, 7, n_samples)
    city_risk_index     = np.random.uniform(0.1, 1.0, n_samples)
    hist_disruptions    = np.random.poisson(3, n_samples)
    worker_years_exp    = np.random.uniform(0.5, 10, n_samples)
    is_monsoon          = (np.random.rand(n_samples) > 0.6).astype(int)
    is_weekend          = (day_of_week >= 5).astype(int)
    rain_monsoon        = rainfall_mm * is_monsoon    # interaction term

    X = np.column_stack([
        rainfall_mm, rainfall_7d_avg, aqi, temperature, humidity,
        wind_speed, hour_of_day, day_of_week, city_risk_index,
        hist_disruptions, worker_years_exp, is_monsoon, is_weekend, rain_monsoon
    ])

    # Create labels: disruption likely if rain heavy OR AQI high OR hist disruptions high
    disruption_score = (
        0.35 * (rainfall_mm / 50).clip(0, 1) +
        0.25 * (aqi / 500).clip(0, 1) +
        0.20 * (city_risk_index) +
        0.20 * (hist_disruptions / 10).clip(0, 1)
    )
    # Add noise, then threshold at 0.5 for binary label
    labels = (disruption_score + np.random.normal(0, 0.1, n_samples) > 0.45).astype(int)

    return X, labels


def train_models():
    """
    Train XGBoost (GBM) and Random Forest on synthetic data.
    Called once at application startup.
    """
    global xgb_model, rf_model, scaler

    print("🧠 RADAR: Training risk models...")
    X, y = generate_synthetic_training_data(n_samples=2000)

    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # XGBoost-equivalent: GradientBoostingClassifier
    xgb_model = GradientBoostingClassifier(
        n_estimators=100,    # 100 trees
        learning_rate=0.1,
        max_depth=4,
        random_state=42
    )
    xgb_model.fit(X_scaled, y)

    # Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42
    )
    rf_model.fit(X_scaled, y)

    print("✅ RADAR: Models trained successfully")


def build_feature_vector(data: dict) -> np.ndarray:
    """Convert API input dict → numpy feature array (14 features)."""
    rainfall_mm    = data.get("rainfall_mm", 0.0)
    is_monsoon     = data.get("is_monsoon_season", 0)
    rain_monsoon   = rainfall_mm * is_monsoon   # interaction term

    return np.array([[
        rainfall_mm,
        data.get("rainfall_7d_avg", 0.0),
        data.get("aqi", 100.0),
        data.get("temperature", 28.0),
        data.get("humidity", 60.0),
        data.get("wind_speed", 10.0),
        data.get("hour_of_day", 12),
        data.get("day_of_week", 1),
        data.get("city_risk_index", 0.5),
        data.get("historical_disruptions_30d", 2),
        data.get("worker_years_exp", 1.0),
        is_monsoon,
        data.get("is_weekend", 0),
        rain_monsoon
    ]])


def score_to_level(score: float) -> str:
    """Map 0–1 risk score to categorical level."""
    if score < 0.25:
        return "low"
    elif score < 0.50:
        return "medium"
    elif score < 0.75:
        return "high"
    else:
        return "critical"


def predict_risk(features: dict, role: str = "food_delivery") -> dict:
    """
    Main RADAR prediction function.
    
    Steps:
    1. Build feature vector from input dict
    2. Scale features
    3. Get probability from XGBoost and Random Forest
    4. Ensemble: R = 0.7 × XGB + 0.3 × RF
    5. Apply role-specific adjustment
    6. Map to premium tier
    
    Returns dict with score, level, premium, feature importance
    """
    if xgb_model is None or rf_model is None:
        train_models()

    # Build and scale features
    X = build_feature_vector(features)
    X_scaled = scaler.transform(X)

    # Get disruption probability from each model
    xgb_prob = float(xgb_model.predict_proba(X_scaled)[0][1])  # prob of disruption
    rf_prob  = float(rf_model.predict_proba(X_scaled)[0][1])

    # Ensemble score: R = 0.7 × XGB + 0.3 × RF
    ensemble_score = 0.7 * xgb_prob + 0.3 * rf_prob

    # Role-based adjustment using R = w1·Weather + w2·AQI + w3·Traffic + w4·Historical
    weights = ROLE_WEIGHTS.get(role, ROLE_WEIGHTS["food_delivery"])
    
    rainfall_factor   = min(features.get("rainfall_mm", 0) / 50.0, 1.0)
    aqi_factor        = min(features.get("aqi", 100) / 500.0, 1.0)
    city_factor       = features.get("city_risk_index", 0.5)
    hist_factor       = min(features.get("historical_disruptions_30d", 2) / 10.0, 1.0)

    role_score = (
        weights["weather"]    * rainfall_factor +
        weights["aqi"]        * aqi_factor +
        weights["traffic"]    * city_factor +
        weights["historical"] * hist_factor
    )

    # Blend ensemble + role scores (70/30)
    final_score = 0.6 * ensemble_score + 0.4 * role_score
    final_score = float(np.clip(final_score, 0.0, 1.0))

    # Map to risk level + premium
    risk_level    = score_to_level(final_score)
    weekly_premium = PREMIUM_MAP[risk_level]

    # Feature importance (simplified — top contributors)
    feature_names = [
        "rainfall_mm", "rainfall_7d_avg", "aqi", "temperature", "humidity",
        "wind_speed", "hour_of_day", "day_of_week", "city_risk_index",
        "historical_disruptions_30d", "worker_years_exp", "is_monsoon_season",
        "is_weekend", "rain×monsoon"
    ]
    importances = xgb_model.feature_importances_
    top_features = dict(sorted(
        zip(feature_names, [round(float(v), 4) for v in importances]),
        key=lambda x: -x[1]
    )[:5])  # top 5 features

    # Build alert message if critical
    alert_msg = None
    if risk_level == "critical":
        alert_msg = "⚠️ CRITICAL RISK: Severe disruption expected. Parametric payout may trigger soon."
    elif features.get("rainfall_mm", 0) >= 15:
        alert_msg = f"🌧️ Heavy rain ({features['rainfall_mm']}mm) detected. Stay safe."

    return {
        "risk_score":         final_score,
        "risk_level":         risk_level,
        "weekly_premium":     weekly_premium,
        "xgboost_score":      round(xgb_prob, 4),
        "rf_score":           round(rf_prob, 4),
        "alert_message":      alert_msg,
        "feature_importance": top_features
    }
