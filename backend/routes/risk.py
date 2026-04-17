# ============================================================
# routes/risk.py — Risk Assessment Routes
# ============================================================
# Exposes the RADAR AI engine via HTTP endpoints.
# Workers call /risk/assess to get their current risk score
# before purchasing a policy.
# ============================================================

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import RiskRequest, RiskResponse
from services.risk_engine import predict_risk, train_models
from models import RiskSnapshot
from datetime import datetime
import requests
import os

router = APIRouter(prefix="/risk", tags=["Risk"])

# OpenWeatherMap API key — falls back to mock data if not set
OWM_API_KEY = os.getenv("OWM_API_KEY", "")


def fetch_weather_mock(city: str) -> dict:
    """
    Mock weather data when no API key is available.
    Returns realistic values for demonstration.
    """
    import random
    # Simulate varying weather
    rain = random.uniform(0, 30)
    return {
        "rainfall_mm": round(rain, 2),
        "rainfall_7d_avg": round(rain * 0.6, 2),
        "aqi": round(random.uniform(50, 350), 1),
        "temperature": round(random.uniform(24, 44), 1),
        "humidity": round(random.uniform(40, 95), 1),
        "wind_speed": round(random.uniform(5, 40), 1),
        "hour_of_day": datetime.utcnow().hour,
        "day_of_week": datetime.utcnow().weekday(),
        "city_risk_index": 0.6,
        "is_monsoon_season": 1 if datetime.utcnow().month in [6, 7, 8, 9] else 0,
        "is_weekend": 1 if datetime.utcnow().weekday() >= 5 else 0,
        "historical_disruptions_30d": random.randint(1, 8),
    }


def fetch_weather_live(city: str) -> dict:
    """
    Fetch real weather from OpenWeatherMap API.
    Requires OWM_API_KEY environment variable.
    """
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city},IN&appid={OWM_API_KEY}&units=metric"
        resp = requests.get(url, timeout=5)
        data = resp.json()

        rain = data.get("rain", {}).get("1h", 0.0)
        return {
            "rainfall_mm": rain,
            "rainfall_7d_avg": rain * 0.7,
            "aqi": 150.0,  # AQI needs separate API call
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "hour_of_day": datetime.utcnow().hour,
            "day_of_week": datetime.utcnow().weekday(),
            "city_risk_index": 0.6,
            "is_monsoon_season": 1 if datetime.utcnow().month in [6, 7, 8, 9] else 0,
            "is_weekend": 1 if datetime.utcnow().weekday() >= 5 else 0,
            "historical_disruptions_30d": 3,
        }
    except Exception:
        return fetch_weather_mock(city)


@router.post("/assess", response_model=RiskResponse)
def assess_risk(req: RiskRequest, role: str = Query("food_delivery"), db: Session = Depends(get_db)):
    """
    Main RADAR risk assessment endpoint.
    
    Pass weather/environmental features → get back:
    - risk_score (0-1)
    - risk_level (low/medium/high/critical)
    - weekly_premium (₹10/17/25)
    - feature importance breakdown
    """
    features = req.model_dump()
    result = predict_risk(features, role=role)

    # Save snapshot to DB for trend charts
    snapshot = RiskSnapshot(
        city="Mumbai",
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        rainfall_mm=req.rainfall_mm,
        aqi=req.aqi,
        temperature=req.temperature
    )
    db.add(snapshot)
    db.commit()

    return result


@router.get("/weather/{city}")
def get_weather_risk(city: str, role: str = Query("food_delivery"), db: Session = Depends(get_db)):
    """
    Convenience endpoint: fetch weather for a city + auto-assess risk.
    Uses live weather if API key available, else mock data.
    """
    if OWM_API_KEY:
        weather = fetch_weather_live(city)
    else:
        weather = fetch_weather_mock(city)

    result = predict_risk(weather, role=role)

    return {
        "city": city,
        "weather": weather,
        "risk": result
    }


@router.get("/snapshots")
def get_risk_snapshots(city: str = "Mumbai", limit: int = 30, db: Session = Depends(get_db)):
    """Get historical risk snapshots for trend charts (admin dashboard)."""
    snapshots = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.city == city)
        .order_by(RiskSnapshot.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "date": s.date,
            "risk_score": round(s.risk_score, 3),
            "risk_level": s.risk_level,
            "rainfall_mm": s.rainfall_mm,
            "aqi": s.aqi,
            "temperature": s.temperature
        }
        for s in reversed(snapshots)
    ]
