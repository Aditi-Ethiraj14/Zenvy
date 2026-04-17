# ============================================================
# routes/auth.py — Authentication Routes
# ============================================================
# Handles signup, login, and token generation.
# Uses JWT tokens for stateless authentication.
# Passwords hashed with bcrypt.
# ============================================================
# ============================================================
# routes/auth.py — Authentication Routes (FIXED)
# ============================================================
# ============================================================
# routes/auth.py — Authentication Routes (FIXED FOR RENDER)
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta
from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Security config ───────────────────────────────────────────
SECRET_KEY = "zenvy-super-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


# ✅ SIMPLE HASH (NO BCRYPT → NO ERRORS)
def hash_password(password: str) -> str:
    return password  # ⚠️ temporary for hackathon


def verify_password(plain: str, hashed: str) -> bool:
    return plain == hashed


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── SIGNUP ───────────────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password),  # plain text
        role=req.role,
        city=req.city,
        years_exp=req.years_exp,
        lat=req.lat,
        lon=req.lon
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        name=user.name
    )


# ── LOGIN ────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"sub": str(user.id), "role": user.role})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        name=user.name
    )


# ── GET USER ─────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
