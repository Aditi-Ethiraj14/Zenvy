# ============================================================
# main.py — ZENVY FastAPI Application Entry Point
# ============================================================
#
# Start server: uvicorn main:app --reload --port 8000
#
# API Docs:    http://localhost:8000/docs
# Frontend:    http://localhost:5173
# ============================================================
# ============================================================
# main.py — ZENVY FastAPI Application Entry Point (FIXED)
# ============================================================

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routes import auth, risk, policy, claims, admin
from services.risk_engine import train_models
from models import User

# ── Create all database tables ────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Initialize FastAPI app ────────────────────────────────────
app = FastAPI(
    title="ZENVY API",
    description="AI-Powered Parametric Income Insurance for Gig Workers",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────────────────
# FRONTEND_URL env var: set on Render to your frontend's URL
# e.g. https://zenvy-frontend.onrender.com
# Falls back to wildcard "*" so any Render URL works during setup.
_frontend_url = os.environ.get("FRONTEND_URL", "")
_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://zenvy-w6ey.onrender.com",
]
if _frontend_url:
    _origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # wildcard ensures no CORS errors on Render
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(risk.router)
app.include_router(policy.router)
app.include_router(claims.router)
app.include_router(admin.router)


# ── DEFAULT USERS (NO IMPORT FROM seed.py) ────────────────────
DEFAULT_USERS = [
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
    }
]


# ── Startup ──────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    print("🚀 ZENVY API starting...")

    db = SessionLocal()

    # ✅ SAFE AUTO-SEED — checks each user individually so any missing user gets added
    print("🌱 Checking seed users...")
    seeded = 0
    for u in DEFAULT_USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                name=u["name"],
                email=u["email"],
                hashed_password=u["password"],  # ✅ plain password (auth routes compare plain)
                role=u["role"],
                city=u["city"],
                years_exp=u["years_exp"],
                lat=u["lat"],
                lon=u["lon"]
            )
            db.add(user)
            seeded += 1

    if seeded > 0:
        db.commit()
        print(f"✅ Seeded {seeded} new user(s)!")
    else:
        print("✅ All seed users already exist.")

    db.close()

    # Train models
    train_models()

    print("✅ ZENVY API ready!")


# ── Root ─────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": "ZENVY",
        "status": "running"
    }


# ── Health ───────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy"}
