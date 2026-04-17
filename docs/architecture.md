# ZENVY System Architecture

## Data Flow

```
User (Worker) → Frontend (React)
                     ↓
              Axios HTTP Request
                     ↓
           FastAPI Backend (port 8000)
                     ↓
         ┌───────────┴───────────┐
         ▼                       ▼
   RADAR Service           Trigger Engine
   (Risk Prediction)       (Payout Processing)
         ↓                       ↓
   SQLite Database         Fraud Detection
   (zenvy.db)                    ↓
                           UPI Payout (Simulated)
```

## Database Schema

```
users (id, name, email, role, city, lat, lon, years_exp)
  └── policies (id, user_id, weekly_premium, risk_level, status)
        └── claims (id, user_id, policy_id, payout_amount, status, upi_txn_id)
  └── alerts (id, user_id, alert_type, severity, title, message)
risk_snapshots (id, city, date, risk_score, rainfall_mm, aqi)
```

## Security

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens expire in 24 hours
- Secret key should be set via environment variable in production
- CORS restricted to frontend origin in production

## Scaling Notes

- Replace SQLite with PostgreSQL for production
- Add Redis cache for weather API responses (5-min TTL)
- Use Celery for background trigger processing
- Add Prometheus metrics for fraud detection monitoring
