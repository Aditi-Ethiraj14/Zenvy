# ============================================================
# routes/policy.py — Policy Management Routes
# ============================================================
# Workers can buy weekly policies, view active coverage,
# and check policy history here.
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Policy, User
from schemas import PolicyCreate, PolicyOut
from datetime import datetime, timedelta

router = APIRouter(prefix="/policy", tags=["Policy"])


@router.post("/buy", response_model=PolicyOut)
def buy_policy(user_id: int, req: PolicyCreate, db: Session = Depends(get_db)):
    """
    Purchase a weekly income insurance policy.
    
    A worker can only have ONE active policy at a time.
    Policy is valid for 7 days from purchase.
    Premium = ₹10/17/25 based on risk level.
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing active policy
    existing = db.query(Policy).filter(
        Policy.user_id == user_id,
        Policy.status == "active"
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have an active policy. It must expire before buying a new one."
        )

    # Create 7-day policy
    policy = Policy(
        user_id=user_id,
        weekly_premium=req.weekly_premium,
        coverage_amount=req.coverage_amount,
        risk_level=req.risk_level,
        risk_score=req.risk_score,
        status="active",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7)
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/active/{user_id}", response_model=PolicyOut)
def get_active_policy(user_id: int, db: Session = Depends(get_db)):
    """Get the current active policy for a worker."""
    policy = db.query(Policy).filter(
        Policy.user_id == user_id,
        Policy.status == "active"
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")
    return policy


@router.get("/history/{user_id}")
def get_policy_history(user_id: int, db: Session = Depends(get_db)):
    """Get all policies (active + expired) for a worker."""
    policies = (
        db.query(Policy)
        .filter(Policy.user_id == user_id)
        .order_by(Policy.created_at.desc())
        .all()
    )
    return policies


@router.post("/expire/{policy_id}")
def expire_policy(policy_id: int, db: Session = Depends(get_db)):
    """Mark a policy as expired (admin or system use)."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.status = "expired"
    db.commit()
    return {"message": "Policy expired"}
