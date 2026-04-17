# ============================================================
# models.py — SQLAlchemy ORM Models
# ============================================================
# All database tables are defined here.
# Each class maps to one table in zenvy.db
# ============================================================

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """
    Represents a gig worker or admin.
    role: 'food_delivery' | 'grocery_delivery' | 'ecommerce_delivery' | 'admin'
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="food_delivery")  # gig worker role
    city = Column(String, default="Mumbai")
    years_exp = Column(Float, default=1.0)       # worker experience in years
    lat = Column(Float, default=19.0760)          # latitude for map
    lon = Column(Float, default=72.8777)          # longitude for map
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    policies = relationship("Policy", back_populates="user")
    claims = relationship("Claim", back_populates="user")
    alerts = relationship("Alert", back_populates="user")


class Policy(Base):
    """
    Weekly insurance policy purchased by a worker.
    status: 'active' | 'expired' | 'cancelled'
    """
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weekly_premium = Column(Float, nullable=False)   # ₹10 / ₹17 / ₹25
    coverage_amount = Column(Float, nullable=False)  # max payout amount
    risk_level = Column(String, default="low")       # low/medium/high/critical
    risk_score = Column(Float, default=0.0)          # 0.0 to 1.0
    status = Column(String, default="active")
    start_date = Column(DateTime, server_default=func.now())
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="policies")
    claims = relationship("Claim", back_populates="policy")


class Claim(Base):
    """
    An insurance claim — can be auto-triggered (parametric) or manual.
    claim_type: 'parametric' | 'manual'
    status: 'pending' | 'approved' | 'paid' | 'rejected' | 'flagged'
    """
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    claim_type = Column(String, default="parametric")   # parametric | manual
    trigger_event = Column(String, nullable=True)       # e.g., "rain_15mm", "aqi_300"
    payout_amount = Column(Float, default=0.0)
    severity = Column(Float, default=0.5)               # 0.0 to 1.0
    duration_days = Column(Float, default=1.0)
    status = Column(String, default="pending")
    fraud_flagged = Column(Boolean, default=False)
    fraud_score = Column(Float, default=0.0)            # Z-score from fraud check
    upi_transaction_id = Column(String, nullable=True)  # simulated UPI ID
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="claims")
    policy = relationship("Policy", back_populates="claims")


class Alert(Base):
    """
    System alerts for workers about weather/AQI events.
    alert_type: 'rain' | 'flood' | 'aqi' | 'heat' | 'admin'
    severity: 'warning' | 'critical'
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # None = broadcast
    alert_type = Column(String, nullable=False)
    severity = Column(String, default="warning")
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    trigger_value = Column(Float, nullable=True)    # actual measured value
    trigger_threshold = Column(Float, nullable=True) # threshold that was breached
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="alerts")


class RiskSnapshot(Base):
    """
    Historical log of daily risk scores per city.
    Used for admin charts and trend analysis.
    """
    __tablename__ = "risk_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, default="Mumbai")
    date = Column(String, nullable=False)           # YYYY-MM-DD
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="low")
    rainfall_mm = Column(Float, default=0.0)
    aqi = Column(Float, default=100.0)
    temperature = Column(Float, default=28.0)
    created_at = Column(DateTime, server_default=func.now())
