# ============================================================
# routes/admin.py — Admin Dashboard Routes
# ============================================================
# Stats, user management, fraud overview, and map data.
# ============================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Policy, Claim, Alert, RiskSnapshot
from schemas import AdminStats

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db)):
    """Overview statistics for the admin dashboard."""
    total_users   = db.query(User).count()
    total_policies = db.query(Policy).count()
    active_policies = db.query(Policy).filter(Policy.status == "active").count()
    total_claims  = db.query(Claim).count()
    
    total_payout  = db.query(func.sum(Claim.payout_amount)).filter(
        Claim.status == "paid"
    ).scalar() or 0.0

    fraud_alerts  = db.query(Claim).filter(Claim.fraud_flagged == True).count()

    avg_risk = db.query(func.avg(Policy.risk_score)).scalar() or 0.0

    # Count users by role
    roles = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    users_by_role = {r: c for r, c in roles}

    return AdminStats(
        total_users=total_users,
        users_by_role=users_by_role,
        total_policies=total_policies,
        active_policies=active_policies,
        total_claims=total_claims,
        total_payout=round(total_payout, 2),
        fraud_alerts=fraud_alerts,
        avg_risk_score=round(float(avg_risk), 3)
    )


@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """Get all users with their latest policy info — for admin table."""
    users = db.query(User).filter(User.role != "admin").all()
    result = []
    for u in users:
        active_policy = db.query(Policy).filter(
            Policy.user_id == u.id,
            Policy.status == "active"
        ).first()
        claims_count = db.query(Claim).filter(Claim.user_id == u.id).count()
        fraud_count = db.query(Claim).filter(
            Claim.user_id == u.id,
            Claim.fraud_flagged == True
        ).count()
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "city": u.city,
            "lat": u.lat,
            "lon": u.lon,
            "years_exp": u.years_exp,
            "has_active_policy": active_policy is not None,
            "policy_risk_level": active_policy.risk_level if active_policy else "none",
            "claims_count": claims_count,
            "fraud_flags": fraud_count,
            "joined": u.created_at.isoformat()
        })
    return result


@router.get("/claims")
def get_all_claims(db: Session = Depends(get_db)):
    """Get all claims for admin review."""
    claims = db.query(Claim).order_by(Claim.created_at.desc()).limit(100).all()
    result = []
    for c in claims:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append({
            "id": c.id,
            "user_name": user.name if user else "Unknown",
            "user_role": user.role if user else "Unknown",
            "claim_type": c.claim_type,
            "trigger_event": c.trigger_event,
            "payout_amount": c.payout_amount,
            "status": c.status,
            "fraud_flagged": c.fraud_flagged,
            "fraud_score": c.fraud_score,
            "created_at": c.created_at.isoformat()
        })
    return result


@router.get("/map-data")
def get_map_data(db: Session = Depends(get_db)):
    """
    Get all worker locations for Leaflet map.
    Returns lat/lon, role, and risk level for each active worker.
    """
    users = db.query(User).filter(User.role != "admin").all()
    markers = []
    for u in users:
        policy = db.query(Policy).filter(
            Policy.user_id == u.id,
            Policy.status == "active"
        ).first()
        markers.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "city": u.city,
            "lat": u.lat,
            "lon": u.lon,
            "risk_level": policy.risk_level if policy else "none",
            "risk_score": policy.risk_score if policy else 0.0,
            "has_policy": policy is not None
        })
    return markers


@router.get("/fraud-alerts")
def get_fraud_alerts(db: Session = Depends(get_db)):
    """Get all manual claims needing admin review (flagged OR pending)."""
    # Include: fraud-flagged claims + clean manual claims still pending review
    review_claims = db.query(Claim).filter(
        (Claim.fraud_flagged == True) |
        ((Claim.claim_type == "manual") & (Claim.status == "pending"))
    ).order_by(Claim.created_at.desc()).all()

    result = []
    for c in review_claims:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append({
            "claim_id": c.id,
            "user_name": user.name if user else "Unknown",
            "user_role": user.role if user else "Unknown",
            "city": user.city if user else "Unknown",
            "fraud_score": c.fraud_score,
            "fraud_flagged": c.fraud_flagged,
            "claim_type": c.claim_type,
            "trigger_event": c.trigger_event,
            "payout_amount": c.payout_amount,
            "status": c.status,
            "description": c.description,
            "created_at": c.created_at.isoformat()
        })
    return result


@router.get("/risk-trend")
def get_risk_trend(db: Session = Depends(get_db)):
    """Get risk score trend data for admin charts (last 30 days, seeded if empty)."""
    import random
    from datetime import datetime, timedelta

    # Auto-seed 30 days of historical snapshots if table is empty
    count = db.query(RiskSnapshot).count()
    if count == 0:
        today = datetime.utcnow().date()
        risk_levels = ['low', 'medium', 'high', 'critical']
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            rain = round(random.uniform(0, 45), 2)
            aqi = round(random.uniform(60, 380), 1)
            temp = round(random.uniform(24, 45), 1)

            # Derive risk score from inputs
            rs = min(1.0, (rain / 80) * 0.4 + (aqi / 500) * 0.35 + (max(0, temp - 35) / 10) * 0.25)
            rs = round(rs, 3)
            level = 'low' if rs < 0.25 else 'medium' if rs < 0.50 else 'high' if rs < 0.75 else 'critical'

            snap = RiskSnapshot(
                city="Mumbai",
                date=day.strftime("%Y-%m-%d"),
                risk_score=rs,
                risk_level=level,
                rainfall_mm=rain,
                aqi=aqi,
                temperature=temp
            )
            db.add(snap)
        db.commit()

    snapshots = db.query(RiskSnapshot).order_by(
        RiskSnapshot.created_at.desc()
    ).limit(30).all()

    return [
        {
            "date": s.date,
            "risk_score": round(s.risk_score, 3),
            "risk_level": s.risk_level,
            "rainfall_mm": s.rainfall_mm,
            "aqi": s.aqi
        }
        for s in reversed(snapshots)
    ]

from pydantic import BaseModel
class ReviewRequest(BaseModel):
    status: str

from services.trigger_engine import generate_upi_id
from datetime import datetime

@router.post("/claims/{claim_id}/review")
def review_claim(claim_id: int, request: ReviewRequest, db: Session = Depends(get_db)):
    """
    Admin reviews a manual claim.
    Actions:
      approved → status=paid, UPI txn generated, worker notified
      rejected → status=rejected, worker notified (critical)
      flagged  → status=flagged, fraud_flagged=True, worker notified (critical)
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        return {"error": "Claim not found"}

    if request.status == "approved":
        upi_txn = generate_upi_id()
        claim.status = "paid"
        claim.upi_transaction_id = upi_txn
        claim.paid_at = datetime.utcnow()
        alert = Alert(
            user_id=claim.user_id,
            alert_type="admin",
            severity="warning",
            title="✅ Claim Approved & Paid",
            message=(
                f"Your manual claim #{claim_id} has been reviewed and approved. "
                f"Payout of \u20b9{claim.payout_amount:.0f} sent to your UPI. "
                f"Transaction ID: {upi_txn}"
            )
        )
        db.add(alert)

    elif request.status == "rejected":
        claim.status = "rejected"
        alert = Alert(
            user_id=claim.user_id,
            alert_type="admin",
            severity="critical",
            title="❌ Claim Rejected",
            message=(
                f"Your manual claim #{claim_id} has been rejected after admin review. "
                f"If you believe this is an error, please contact support with your Claim ID."
            )
        )
        db.add(alert)

    elif request.status == "flagged":
        # Admin manually marks a clean-pending claim as fraudulent
        claim.status = "flagged"
        claim.fraud_flagged = True
        alert = Alert(
            user_id=claim.user_id,
            alert_type="admin",
            severity="critical",
            title="⚠️ Claim Flagged as Suspicious",
            message=(
                f"Your manual claim #{claim_id} has been flagged as suspicious by admin after review. "
                f"Payout is on hold pending fraud investigation. "
                f"You will be notified of the outcome."
            )
        )
        db.add(alert)

    db.commit()
    return {"success": True, "status": claim.status}


@router.get("/notifications")
def get_admin_notifications(db: Session = Depends(get_db)):
    """Get recent system-wide events for admin notification feed."""
    # Latest alerts across all users
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(20).all()
    result = []
    for a in recent_alerts:
        user = db.query(User).filter(User.id == a.user_id).first() if a.user_id else None
        result.append({
            "id": a.id,
            "type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "user_name": user.name if user else "System",
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat()
        })
    return result
