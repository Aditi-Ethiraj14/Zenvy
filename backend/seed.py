# ============================================================
# seed.py — Seed default users into the database
# ============================================================
# Run: python seed.py
# Creates: food@test.com, grocery@test.com, 
#          ecommerce@test.com, admin@test.com (all pwd: 1234)
# Also creates sample policies, claims, and risk snapshots.
# ============================================================

import sys
sys.path.insert(0, ".")

from database import engine, SessionLocal, Base
from models import User, Policy, Claim, Alert, RiskSnapshot
from passlib.context import CryptContext
from datetime import datetime, timedelta
import random
import uuid

# Create all tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

print("🌱 Seeding ZENVY database...")

# ── Default Users ─────────────────────────────────────────────
USERS = [
    {
        "name": "Ravi Kumar",
        "email": "food@test.com",
        "password": "1234",
        "role": "food_delivery",
        "city": "Mumbai",
        "years_exp": 3.5,
        "lat": 19.0760,
        "lon": 72.8777
    },
    {
        "name": "Priya Singh",
        "email": "grocery@test.com",
        "password": "1234",
        "role": "grocery_delivery",
        "city": "Delhi",
        "years_exp": 2.0,
        "lat": 28.7041,
        "lon": 77.1025
    },
    {
        "name": "Arjun Mehta",
        "email": "ecommerce@test.com",
        "password": "1234",
        "role": "ecommerce_delivery",
        "city": "Bangalore",
        "years_exp": 1.5,
        "lat": 12.9716,
        "lon": 77.5946
    },
    {
        "name": "Admin User",
        "email": "admin@test.com",
        "password": "1234",
        "role": "admin",
        "city": "Mumbai",
        "years_exp": 10.0,
        "lat": 19.0760,
        "lon": 72.8777
    },
    # Extra workers for richer map/stats
    {
        "name": "Sanjay Rao",
        "email": "sanjay@test.com",
        "password": "1234",
        "role": "food_delivery",
        "city": "Mumbai",
        "years_exp": 2.0,
        "lat": 19.1136,
        "lon": 72.8697
    },
    {
        "name": "Deepa Nair",
        "email": "deepa@test.com",
        "password": "1234",
        "role": "grocery_delivery",
        "city": "Mumbai",
        "years_exp": 4.0,
        "lat": 19.0330,
        "lon": 72.8654
    },
    {
        "name": "Amit Sharma",
        "email": "amit@test.com",
        "password": "1234",
        "role": "ecommerce_delivery",
        "city": "Delhi",
        "years_exp": 3.0,
        "lat": 28.6139,
        "lon": 77.2090
    },
]

created_users = []
for u in USERS:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if not existing:
        user = User(
            name=u["name"],
            email=u["email"],
            hashed_password=pwd_context.hash(u["password"]),
            role=u["role"],
            city=u["city"],
            years_exp=u["years_exp"],
            lat=u["lat"],
            lon=u["lon"]
        )
        db.add(user)
        db.flush()
        created_users.append(user)
        print(f"  ✅ Created user: {u['email']} ({u['role']})")
    else:
        created_users.append(existing)
        print(f"  ⏭️  User exists: {u['email']}")

db.commit()

# ── Sample Policies ───────────────────────────────────────────
RISK_LEVELS = ["low", "medium", "high", "critical"]
PREMIUMS    = {"low": 10, "medium": 17, "high": 25, "critical": 25}

for user in created_users:
    if user.role == "admin":
        continue
    existing_policy = db.query(Policy).filter(
        Policy.user_id == user.id,
        Policy.status == "active"
    ).first()
    if not existing_policy:
        rl = random.choice(RISK_LEVELS)
        policy = Policy(
            user_id=user.id,
            weekly_premium=PREMIUMS[rl],
            coverage_amount=5000.0,
            risk_level=rl,
            risk_score=random.uniform(0.1, 0.95),
            status="active",
            start_date=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
            end_date=datetime.utcnow() + timedelta(days=random.randint(1, 7))
        )
        db.add(policy)
        db.flush()
        print(f"  📋 Created policy for: {user.name} ({rl})")

        # Add sample paid claims
        for _ in range(random.randint(1, 3)):
            payout = random.uniform(200, 1500)
            is_fraud = random.random() < 0.1  # 10% fraud rate
            c = Claim(
                user_id=user.id,
                policy_id=policy.id,
                claim_type=random.choice(["parametric", "manual"]),
                trigger_event=random.choice(["rain_15mm", "aqi_300", "flood_40mm", "manual_claim"]),
                payout_amount=round(payout, 2),
                severity=random.uniform(0.3, 0.9),
                duration_days=random.uniform(0.5, 2.0),
                fraud_flagged=is_fraud,
                fraud_score=random.uniform(0.6, 0.9) if is_fraud else random.uniform(0.0, 0.3),
                upi_transaction_id=f"ZENVY{datetime.utcnow().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}" if not is_fraud else None,
                status="paid" if not is_fraud else "flagged",
                description="Sample seeded claim",
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                paid_at=datetime.utcnow() - timedelta(days=random.randint(0, 5)) if not is_fraud else None
            )
            db.add(c)

db.commit()

# ── Sample Alerts ─────────────────────────────────────────────
SAMPLE_ALERTS = [
    {
        "alert_type": "rain",
        "severity": "warning",
        "title": "🌧️ Moderate Rain Alert - Mumbai",
        "message": "Rainfall detected at 18mm/hr. Income loss protection active.",
        "trigger_value": 18.0,
        "trigger_threshold": 15.0
    },
    {
        "alert_type": "aqi",
        "severity": "critical",
        "title": "😷 Hazardous AQI - Delhi",
        "message": "AQI has crossed 310. Avoid outdoor delivery. Auto-payout triggered.",
        "trigger_value": 310.0,
        "trigger_threshold": 300.0
    },
    {
        "alert_type": "flood",
        "severity": "critical",
        "title": "🌊 Flood Warning - Mumbai",
        "message": "Flood conditions detected (45mm rainfall). Payout processing.",
        "trigger_value": 45.0,
        "trigger_threshold": 40.0
    }
]

for a_data in SAMPLE_ALERTS:
    existing = db.query(Alert).filter(Alert.title == a_data["title"]).first()
    if not existing:
        alert = Alert(
            user_id=None,  # broadcast
            **a_data,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10))
        )
        db.add(alert)

db.commit()

# ── Risk Snapshots (30 days of trend data) ────────────────────
from datetime import date
for i in range(30):
    day = (datetime.utcnow() - timedelta(days=30 - i)).strftime("%Y-%m-%d")
    existing = db.query(RiskSnapshot).filter(
        RiskSnapshot.date == day,
        RiskSnapshot.city == "Mumbai"
    ).first()
    if not existing:
        rain = random.uniform(0, 45)
        score = min(0.1 + (rain / 50) * 0.6 + random.uniform(-0.1, 0.1), 1.0)
        snap = RiskSnapshot(
            city="Mumbai",
            date=day,
            risk_score=round(score, 3),
            risk_level="critical" if score > 0.75 else "high" if score > 0.5 else "medium" if score > 0.25 else "low",
            rainfall_mm=round(rain, 2),
            aqi=round(random.uniform(80, 350), 1),
            temperature=round(random.uniform(24, 44), 1)
        )
        db.add(snap)

db.commit()
db.close()

print("\n🚀 ZENVY database seeded successfully!")
print("\n📧 Default Logins:")
print("   food@test.com     / 1234  (Food Delivery)")
print("   grocery@test.com  / 1234  (Grocery Delivery)")
print("   ecommerce@test.com / 1234  (E-commerce Delivery)")
print("   admin@test.com    / 1234  (Admin)")
