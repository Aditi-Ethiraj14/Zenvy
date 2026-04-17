# ============================================================
# schemas.py — Pydantic request/response models
# ============================================================
# These define what data goes IN and OUT of the API.
# Keeps API validation clean and auto-documented.
# ============================================================

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "food_delivery"   # food_delivery | grocery_delivery | ecommerce_delivery
    city: str = "Mumbai"
    years_exp: float = 1.0
    lat: float = 19.0760
    lon: float = 72.8777


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    name: str


# ── User ─────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    city: str
    years_exp: float
    lat: float
    lon: float
    created_at: datetime

    class Config:
        from_attributes = True


# ── Risk ─────────────────────────────────────────────────────

class RiskRequest(BaseModel):
    """Input features for RADAR risk prediction"""
    rainfall_mm: float = 0.0
    rainfall_7d_avg: float = 0.0
    aqi: float = 100.0
    temperature: float = 28.0
    humidity: float = 60.0
    wind_speed: float = 10.0
    hour_of_day: int = 12
    day_of_week: int = 1
    city_risk_index: float = 0.5
    historical_disruptions_30d: int = 2
    worker_years_exp: float = 1.0
    is_monsoon_season: int = 0
    is_weekend: int = 0


class RiskResponse(BaseModel):
    risk_score: float         # 0.0 to 1.0
    risk_level: str           # low / medium / high / critical
    weekly_premium: float     # ₹10 / ₹17 / ₹25
    xgboost_score: float      # XGBoost sub-model score
    rf_score: float           # Random Forest sub-model score
    alert_message: Optional[str] = None
    feature_importance: dict  # top contributing features


# ── Policy ───────────────────────────────────────────────────

class PolicyCreate(BaseModel):
    risk_score: float
    risk_level: str
    weekly_premium: float
    coverage_amount: float = 5000.0


class PolicyOut(BaseModel):
    id: int
    user_id: int
    weekly_premium: float
    coverage_amount: float
    risk_level: str
    risk_score: float
    status: str
    start_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ── Claims ───────────────────────────────────────────────────

class ClaimCreate(BaseModel):
    policy_id: int
    description: str = ""
    claim_type: str = "manual"


class ClaimOut(BaseModel):
    id: int
    user_id: int
    policy_id: int
    claim_type: str
    trigger_event: Optional[str]
    payout_amount: float
    severity: float
    duration_days: float
    status: str
    fraud_flagged: bool
    fraud_score: float
    upi_transaction_id: Optional[str]
    description: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Alerts ───────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    user_id: Optional[int]
    alert_type: str
    severity: str
    title: str
    message: str
    trigger_value: Optional[float]
    trigger_threshold: Optional[float]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Admin ────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    users_by_role: dict
    total_policies: int
    active_policies: int
    total_claims: int
    total_payout: float
    fraud_alerts: int
    avg_risk_score: float


class TriggerRequest(BaseModel):
    """Admin can manually trigger a parametric event"""
    event_type: str           # rain_15mm | flood_40mm | aqi_300 | heat_43 | admin
    trigger_value: float
    city: str = "Mumbai"
    message: str = ""
