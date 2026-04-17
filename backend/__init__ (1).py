# ============================================================
# services/fraud_detection.py — 4-Layer Fraud Detection
# ============================================================
#
# FRAUD DETECTION APPROACH:
#
# Layer 1 — GPS Spoofing Detection
#   Check if worker location is impossibly far from their registered city.
#
# Layer 2 — Duplicate Claims
#   Flag if same worker submits 2+ claims within 24 hours.
#
# Layer 3 — High Claim Frequency
#   Z-score: Z = (X - μ) / σ
#   Flag if worker's claim rate is > 2 std deviations above mean.
#
# Layer 4 — Weather Consistency
#   If a rain claim is submitted but rainfall_mm < 5, flag it.
#
# Fraud Score: 0.0 = clean, 1.0 = definitely fraud
# Flag threshold: score > 0.5
# ============================================================

import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Claim, User
import math


# Approximate city bounding boxes (lat_min, lat_max, lon_min, lon_max)
CITY_BOUNDS = {
    "Mumbai":    (18.8, 19.4, 72.7, 73.0),
    "Delhi":     (28.3, 28.9, 76.8, 77.4),
    "Bangalore": (12.8, 13.2, 77.4, 77.8),
    "Chennai":   (12.9, 13.3, 80.0, 80.4),
    "Hyderabad": (17.2, 17.6, 78.3, 78.7),
    "Kolkata":   (22.4, 22.8, 88.2, 88.6),
}


def check_gps_spoofing(worker_lat: float, worker_lon: float, city: str) -> dict:
    """
    Layer 1: GPS Spoofing Detection
    
    Check if the worker's reported location is within their registered city.
    If they are too far away, it may indicate GPS spoofing to avoid rejection.
    
    Returns: {'flagged': bool, 'reason': str, 'score': float}
    """
    bounds = CITY_BOUNDS.get(city, (10.0, 30.0, 68.0, 90.0))  # India fallback
    lat_min, lat_max, lon_min, lon_max = bounds

    in_bounds = (lat_min <= worker_lat <= lat_max) and (lon_min <= worker_lon <= lon_max)

    if not in_bounds:
        return {
            "flagged": True,
            "reason": f"Worker location ({worker_lat:.3f}, {worker_lon:.3f}) is outside {city} bounds",
            "score": 0.4
        }
    return {"flagged": False, "reason": "GPS location OK", "score": 0.0}


def check_duplicate_claims(user_id: int, db: Session) -> dict:
    """
    Layer 2: Duplicate Claims Detection

    Check if the user has filed 3+ claims in the past 24 hours.
    Allows up to 2 claims/day (e.g. worker refiles after rejection).
    3 or more in a single day is suspicious.
    """
    cutoff = datetime.utcnow() - timedelta(hours=24)
    recent_claims = db.query(Claim).filter(
        Claim.user_id == user_id,
        Claim.created_at >= cutoff
    ).count()

    if recent_claims >= 3:
        return {
            "flagged": True,
            "reason": f"User has {recent_claims} claims in past 24 hours (limit: 2)",
            "score": 0.6
        }
    return {"flagged": False, "reason": "No duplicate claims", "score": 0.0}


def check_claim_frequency(user_id: int, db: Session) -> dict:
    """
    Layer 3: High Claim Frequency (Z-Score)
    
    Formula: Z = (X - μ) / σ
    
    X = this user's monthly claim count
    μ = average claims per user per month (population mean)
    σ = standard deviation
    
    Flag if |Z| > 2.0 (more than 2 std deviations above mean)
    """
    # Get all users' claim counts in last 30 days
    cutoff_30d = datetime.utcnow() - timedelta(days=30)
    all_claims = db.query(Claim).filter(Claim.created_at >= cutoff_30d).all()

    # Build per-user claim counts
    user_counts: dict = {}
    for c in all_claims:
        user_counts[c.user_id] = user_counts.get(c.user_id, 0) + 1

    counts = list(user_counts.values())
    
    if len(counts) < 3:
        # Not enough data to compute meaningful stats
        return {"flagged": False, "reason": "Insufficient data for frequency check", "score": 0.0}

    mu = np.mean(counts)
    sigma = np.std(counts)

    user_count = user_counts.get(user_id, 0)
    
    if sigma == 0:
        z_score = 0.0
    else:
        z_score = (user_count - mu) / sigma

    if abs(z_score) > 2.0:
        return {
            "flagged": True,
            "reason": f"Claim frequency Z-score={z_score:.2f} exceeds threshold (2.0). User has {user_count} claims vs avg {mu:.1f}",
            "score": min(abs(z_score) / 5.0, 0.8)   # cap at 0.8
        }
    return {
        "flagged": False,
        "reason": f"Claim frequency Z-score={z_score:.2f} is within normal range",
        "score": 0.0
    }


def check_weather_consistency(trigger_event: str, rainfall_mm: float = 0.0, aqi: float = 100.0) -> dict:
    """
    Layer 4: Weather Consistency Check
    
    If the claim is triggered by rain but actual rainfall is low → suspicious.
    If the claim is triggered by AQI but AQI is normal → suspicious.
    
    Prevents fabricated claims that don't match real weather data.
    """
    if trigger_event == "rain_15mm" and rainfall_mm < 5.0:
        return {
            "flagged": True,
            "reason": f"Rain claim filed but recorded rainfall is only {rainfall_mm}mm (threshold: 15mm)",
            "score": 0.6
        }
    if trigger_event == "flood_40mm" and rainfall_mm < 20.0:
        return {
            "flagged": True,
            "reason": f"Flood claim filed but rainfall is only {rainfall_mm}mm (threshold: 40mm)",
            "score": 0.7
        }
    if trigger_event == "aqi_300" and aqi < 200:
        return {
            "flagged": True,
            "reason": f"AQI claim filed but AQI is only {aqi} (threshold: 300)",
            "score": 0.6
        }
    return {"flagged": False, "reason": "Weather data consistent with claim", "score": 0.0}


def run_fraud_check(
    user_id: int,
    trigger_event: str,
    db: Session,
    worker_lat: float = 19.0760,
    worker_lon: float = 72.8777,
    city: str = "Mumbai",
    rainfall_mm: float = 0.0,
    aqi: float = 100.0
) -> dict:
    """
    Master fraud check — runs all 4 layers and returns aggregate score.
    
    Final fraud_score = max of individual layer scores (worst case wins).
    If fraud_score > 0.5 → claim is flagged for review.
    """
    results = []

    # Layer 1: GPS
    gps_result = check_gps_spoofing(worker_lat, worker_lon, city)
    results.append(gps_result)

    # Layer 2: Duplicate claims
    dup_result = check_duplicate_claims(user_id, db)
    results.append(dup_result)

    # Layer 3: Frequency Z-score
    freq_result = check_claim_frequency(user_id, db)
    results.append(freq_result)

    # Layer 4: Weather consistency
    weather_result = check_weather_consistency(trigger_event, rainfall_mm, aqi)
    results.append(weather_result)

    # Aggregate: take the max fraud score across all layers
    fraud_score = max(r["score"] for r in results)
    is_flagged  = fraud_score >= 0.5   # 50%+ fraud score → flagged for review

    flagged_reasons = [r["reason"] for r in results if r["flagged"]]

    return {
        "fraud_score":    round(fraud_score, 4),
        "is_flagged":     is_flagged,
        "layers": {
            "gps_spoofing":       gps_result,
            "duplicate_claims":   dup_result,
            "claim_frequency":    freq_result,
            "weather_consistency": weather_result
        },
        "flagged_reasons": flagged_reasons
    }
