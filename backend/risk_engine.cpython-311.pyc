# ============================================================
# services/trigger_engine.py — Parametric Trigger Engine
# ============================================================
#
# PARAMETRIC INSURANCE CORE CONCEPT:
#   Traditional insurance: You file a claim, adjuster verifies, waits weeks.
#   Parametric insurance: A measurable event threshold is crossed → payout AUTOMATIC.
#
# ZENVY TRIGGERS:
#   ┌─────────────────────────────┬──────────────┬──────────────┐
#   │ Event                       │ Threshold    │ Severity     │
#   ├─────────────────────────────┼──────────────┼──────────────┤
#   │ Moderate Rain               │ ≥ 15 mm/hr   │ 0.5 (50%)   │
#   │ Heavy Flood Rain            │ ≥ 40 mm/hr   │ 0.8 (80%)   │
#   │ Hazardous AQI               │ AQI ≥ 300    │ 0.6 (60%)   │
#   │ Extreme Heat                │ ≥ 43°C       │ 0.5 (50%)   │
#   │ Admin Event                 │ Manual       │ Configurable │
#   └─────────────────────────────┴──────────────┴──────────────┘
#
# PAYOUT FORMULA:
#   Payout = ExpectedDailyIncome × Severity × Duration
#   Where:
#     ExpectedDailyIncome ≈ ₹800 (default for gig workers)
#     Severity            = 0.0 to 1.0 (how bad the event is)
#     Duration            = days affected (1–3 typically)
# ============================================================

from sqlalchemy.orm import Session
from models import User, Policy, Claim, Alert
from services.fraud_detection import run_fraud_check
from datetime import datetime
import uuid


# ── Trigger thresholds ────────────────────────────────────────
TRIGGERS = {
    "rain_15mm": {
        "threshold": 15.0,
        "field": "rainfall_mm",
        "severity": 0.5,
        "duration": 1.0,
        "title": "🌧️ Moderate Rain Alert",
        "alert_type": "rain"
    },
    "flood_40mm": {
        "threshold": 40.0,
        "field": "rainfall_mm",
        "severity": 0.8,
        "duration": 2.0,
        "title": "🌊 Flood Warning",
        "alert_type": "flood"
    },
    "aqi_300": {
        "threshold": 300.0,
        "field": "aqi",
        "severity": 0.6,
        "duration": 1.0,
        "title": "😷 Hazardous AQI Alert",
        "alert_type": "aqi"
    },
    "heat_43": {
        "threshold": 43.0,
        "field": "temperature",
        "severity": 0.5,
        "duration": 1.0,
        "title": "🌡️ Extreme Heat Alert",
        "alert_type": "heat"
    },
    "traffic_80": {
        "threshold": 80.0,
        "field": "traffic_index",
        "severity": 0.5,
        "duration": 1.0,
        "title": "🚗 Severe Traffic Disruption",
        "alert_type": "traffic"
    },
    "zone_restriction_1": {
        "threshold": 1.0,
        "field": "zone_locked",
        "severity": 0.6,
        "duration": 1.0,
        "title": "🚧 Zone Restriction Active",
        "alert_type": "restriction"
    },
    "admin": {
        "threshold": 0.0,
        "field": "custom",
        "severity": 0.7,
        "duration": 1.0,
        "title": "🚨 Admin-Triggered Event",
        "alert_type": "admin"
    }
}

# Expected daily income by role (₹)
DAILY_INCOME = {
    "food_delivery":     800,
    "grocery_delivery":  700,
    "ecommerce_delivery": 750
}


def calculate_payout(role: str, severity: float, duration: float) -> float:
    """
    PAYOUT FORMULA:
    Payout = ExpectedDailyIncome × Severity × Duration
    
    Example:
      Role = food_delivery → Income = ₹800
      Severity = 0.8 (flood)
      Duration = 2 days
      Payout = 800 × 0.8 × 2 = ₹1,280
    """
    daily_income = DAILY_INCOME.get(role, 750)
    payout = daily_income * severity * duration
    return round(payout, 2)


def generate_upi_id() -> str:
    """Simulate a UPI transaction ID (like HDFC/NPCI format)."""
    return f"ZENVY{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:6].upper()}"


def process_parametric_trigger(
    event_type: str,
    trigger_value: float,
    city: str,
    custom_message: str,
    db: Session,
    background_tasks=None
) -> dict:
    """
    Main trigger processing function.
    
    Steps:
    1. Check if event_type is a valid trigger
    2. Check if the value meets/exceeds threshold
    3. Find all ACTIVE policy holders in the affected city
    4. For each affected worker:
       a. Create Alert (broadcast)
       b. Run fraud check
       c. Create Claim (auto-parametric)
       d. Calculate payout
       e. Mark claim as PAID (simulated UPI)
    
    Returns summary of triggered payouts.
    """
    if event_type not in TRIGGERS:
        return {"error": f"Unknown event type: {event_type}"}

    config = TRIGGERS[event_type]
    severity = config["severity"]
    duration = config["duration"]

    # For admin events, use provided value as severity if given
    if event_type == "admin" and trigger_value > 0:
        severity = min(trigger_value / 100.0, 1.0)

    # Find all active policy holders
    # In a real system, you'd filter by city polygon
    active_policies = db.query(Policy).filter(Policy.status == "active").all()

    # Filter users in that city
    affected_users = []
    for policy in active_policies:
        user = db.query(User).filter(User.id == policy.user_id).first()
        if user and (user.city == city or city == "all"):
            affected_users.append((user, policy))

    payouts_created = []
    alerts_created = 0

    for user, policy in affected_users:
        # ── Step 1: Create broadcast alert ───────────────────
        message = custom_message or f"{config['title']} in {city}. Value: {trigger_value}. Payout triggered automatically."
        alert = Alert(
            user_id=user.id,
            alert_type=config["alert_type"],
            severity="critical" if severity >= 0.7 else "warning",
            title=config["title"],
            message=message,
            trigger_value=trigger_value,
            trigger_threshold=config["threshold"]
        )
        db.add(alert)

        # ── Step 2: Fraud check ───────────────────────────────
        # For parametric claims, only check GPS + weather consistency
        rainfall_mm = trigger_value if "rain" in event_type or "flood" in event_type else 0.0
        aqi_val     = trigger_value if event_type == "aqi_300" else 100.0

        fraud_result = run_fraud_check(
            user_id=user.id,
            trigger_event=event_type,
            db=db,
            worker_lat=user.lat,
            worker_lon=user.lon,
            city=user.city,
            rainfall_mm=rainfall_mm,
            aqi=aqi_val
        )

        # ── Step 3: Create claim ──────────────────────────────
        payout = calculate_payout(user.role, severity, duration)
        upi_id = generate_upi_id()

        claim = Claim(
            user_id=user.id,
            policy_id=policy.id,
            claim_type="parametric",
            trigger_event=event_type,
            payout_amount=payout,
            severity=severity,
            duration_days=duration,
            fraud_flagged=fraud_result["is_flagged"],
            fraud_score=fraud_result["fraud_score"],
            upi_transaction_id=upi_id if not fraud_result["is_flagged"] else None,
            description=f"Auto-triggered by {event_type}. {message}",
            # Auto-approve parametric claims unless fraud flagged
            status="paid" if not fraud_result["is_flagged"] else "flagged",
            paid_at=datetime.utcnow() if not fraud_result["is_flagged"] else None
        )
        db.add(claim)

        payouts_created.append({
            "user_id":     user.id,
            "user_name":   user.name,
            "user_role":   user.role,
            "payout":      payout,
            "upi_id":      upi_id,
            "fraud_flagged": fraud_result["is_flagged"],
            "status":      "paid" if not fraud_result["is_flagged"] else "flagged"
        })
        alerts_created += 1

    db.commit()

    return {
        "event_type":         event_type,
        "trigger_value":      trigger_value,
        "city":               city,
        "workers_affected":   len(affected_users),
        "alerts_sent":        alerts_created,
        "payouts_created":    len([p for p in payouts_created if not p["fraud_flagged"]]),
        "fraud_flagged":      len([p for p in payouts_created if p["fraud_flagged"]]),
        "total_payout_amount": sum(p["payout"] for p in payouts_created if not p["fraud_flagged"]),
        "payout_details":     payouts_created
    }


def check_weather_triggers(weather_data: dict, city: str, db: Session) -> list:
    """
    Check if incoming weather data crosses any parametric trigger threshold.
    Called automatically when weather is fetched.
    Returns list of triggered events (could be empty).
    """
    triggered = []

    # Check each trigger
    for event_type, config in TRIGGERS.items():
        if event_type == "admin":
            continue

        field = config["field"]
        threshold = config["threshold"]
        actual_value = weather_data.get(field, 0.0)

        if actual_value >= threshold:
            result = process_parametric_trigger(
                event_type=event_type,
                trigger_value=actual_value,
                city=city,
                custom_message="",
                db=db
            )
            triggered.append(result)

    return triggered
