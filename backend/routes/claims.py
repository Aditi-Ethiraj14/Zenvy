# ============================================================
# routes/claims.py — Claims & Payout Routes
# ============================================================
# Handles manual claims, payout history, and admin triggers.
# Parametric claims are auto-created by trigger_engine.py
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import Claim, Policy, User, Alert
from schemas import ClaimCreate, ClaimOut, TriggerRequest
from services.fraud_detection import run_fraud_check
from services.trigger_engine import process_parametric_trigger, generate_upi_id, calculate_payout
from datetime import datetime

router = APIRouter(prefix="/claims", tags=["Claims"])


@router.post("/file", response_model=ClaimOut)
def file_claim(user_id: int, req: ClaimCreate, db: Session = Depends(get_db)):
    """
    Worker manually files an income loss claim.

    Flow:
    1. Verify active policy exists
    2. Run 4-layer fraud detection
    3. Calculate estimated payout (held pending admin review)
    4. ALL manual claims go to pending_review — never auto-approved
       Only parametric weather triggers (via trigger_engine) auto-pay.
    5. Notify admin panel for review.
    """
    # Check active policy
    policy = db.query(Policy).filter(
        Policy.id == req.policy_id,
        Policy.user_id == user_id,
        Policy.status == "active"
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found for this ID")

    user = db.query(User).filter(User.id == user_id).first()

    # Run 4-layer fraud detection
    fraud = run_fraud_check(
        user_id=user_id,
        trigger_event="manual",
        db=db,
        worker_lat=user.lat,
        worker_lon=user.lon,
        city=user.city
    )

    # Calculate estimated payout (not paid yet)
    payout = calculate_payout(user.role, severity=0.5, duration=1.0)

    # Manual claims are ALWAYS pending admin review — never auto-paid
    # fraud_flagged=True means fraud score high (shown in admin fraud tab)
    # status="flagged" if fraud detected, "pending" if clean — both need admin action
    is_fraud_flagged = fraud["is_flagged"]
    claim_status = "flagged" if is_fraud_flagged else "pending"

    claim = Claim(
        user_id=user_id,
        policy_id=req.policy_id,
        claim_type="manual",
        trigger_event="manual_claim",
        payout_amount=payout,
        severity=0.5,
        duration_days=1.0,
        fraud_flagged=is_fraud_flagged,
        fraud_score=fraud["fraud_score"],
        upi_transaction_id=None,  # Not paid yet — awaits admin approval
        description=req.description,
        status=claim_status,
        paid_at=None
    )
    db.add(claim)
    db.flush()  # Get claim.id before commit

    # Create admin alert for the new manual claim
    fraud_summary = ", ".join(fraud["flagged_reasons"]) if fraud["flagged_reasons"] else "No fraud indicators"
    admin_alert = Alert(
        user_id=None,  # Broadcast to admin
        alert_type="admin",
        severity="critical" if is_fraud_flagged else "warning",
        title=f"{'⚠️ Fraud Flagged' if is_fraud_flagged else '📝 Manual Claim'}: {user.name}",
        message=f"Manual claim #{claim.id} from {user.name} ({user.city}). "
                f"Fraud score: {fraud['fraud_score']*100:.0f}%. {fraud_summary}. "
                f"Estimated payout: \u20b9{payout:.0f}. Awaiting admin review."
    )
    db.add(admin_alert)
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/history/{user_id}")
def get_claims_history(user_id: int, db: Session = Depends(get_db)):
    """Get all claims for a worker with payout details."""
    claims = (
        db.query(Claim)
        .filter(Claim.user_id == user_id)
        .order_by(Claim.created_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "claim_type": c.claim_type,
            "trigger_event": c.trigger_event,
            "payout_amount": c.payout_amount,
            "status": c.status,
            "fraud_flagged": c.fraud_flagged,
            "upi_transaction_id": c.upi_transaction_id,
            "description": c.description,
            "created_at": c.created_at,
            "paid_at": c.paid_at,
            # Simulated UPI receipt
            "upi_receipt": {
                "amount": f"₹{c.payout_amount:.0f}",
                "transaction_id": c.upi_transaction_id,
                "timestamp": c.paid_at.isoformat() if c.paid_at else None,
                "status": "SUCCESS" if c.status == "paid" else c.status.upper(),
                "bank": "ZENVY Insurance (Simulated UPI)"
            } if c.upi_transaction_id else None
        }
        for c in claims
    ]


@router.post("/trigger")
def admin_trigger(req: TriggerRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Admin endpoint to manually trigger a parametric event.
    This simulates what would happen when weather thresholds are crossed.
    
    Example: POST /claims/trigger
    {
      "event_type": "rain_15mm",
      "trigger_value": 22.5,
      "city": "Mumbai",
      "message": "Heavy monsoon rain causing delivery disruptions"
    }
    """
    result = process_parametric_trigger(
        event_type=req.event_type,
        trigger_value=req.trigger_value,
        city=req.city,
        custom_message=req.message,
        db=db
    )
    return result


@router.get("/alerts/{user_id}")
def get_alerts(user_id: int, db: Session = Depends(get_db)):
    """Get all alerts for a worker (broadcast + personal)."""
    alerts = (
        db.query(Alert)
        .filter((Alert.user_id == user_id) | (Alert.user_id == None))
        .order_by(Alert.created_at.desc())
        .limit(20)
        .all()
    )
    return alerts


@router.post("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as read."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"message": "Alert marked as read"}
