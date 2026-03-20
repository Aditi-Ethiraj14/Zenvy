# 🛡️ Zenvy — AI-Powered Parametric Income Insurance for India's Gig Economy

> **Guidewire DEVTrails 2026 | Team Submission | Phase 1**
> *Protecting the last mile, one week at a time.*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Persona & Problem Scope](#2-persona--problem-scope)
3. [Core Scenarios & Workflows](#3-core-scenarios--workflows)
4. [Weekly Premium Model](#4-weekly-premium-model)
5. [Parametric Trigger Framework](#5-parametric-trigger-framework)
6. [AI/ML Architecture — Full Engine Breakdown](#6-aiml-architecture--full-engine-breakdown)
7. [System Architecture — Full Component Map](#7-system-architecture--full-component-map)
8. [Tech Stack](#8-tech-stack)
9. [Novel Features & Differentiators](#9-novel-features--differentiators)
10. [Adversarial Defense & Anti-Spoofing Strategy](#10-adversarial-defense--anti-spoofing-strategy)
11. [Development Plan & Milestones](#11-development-plan--milestones)
12. [API Integrations](#12-api-integrations)
13. [Test Cases & Edge Cases](#13-test-cases--edge-cases)
14. [Business Viability](#14-business-viability)

---

## 1. Executive Summary

**Zenvy** is a mobile-first, AI-enabled parametric income insurance platform built exclusively for **Food Delivery Partners** (Zomato / Swiggy). When an insured partner loses earning hours due to a verifiable external disruption — extreme weather, flooding, severe pollution, or city-wide curfews — Zenvy detects the event automatically, validates the worker's exposure, and triggers an instant payout with **zero manual claim filing**.

Our core insight: gig workers don't have time to file claims. They need money in their UPI wallet within minutes of a disruption, not days. Zenvy's entire architecture is built around this truth.

**What we cover:** Loss of hourly income during verified external disruption events.  
**What we don't cover:** Health, life, accidents, vehicle repair (strict exclusion per problem constraints).  
**Pricing cadence:** Weekly subscription, deducted every Monday, aligned with the gig economy's weekly payout cycle.

---

## 2. Persona & Problem Scope

### Chosen Persona: Food Delivery Partners (Zomato / Swiggy)

| Attribute | Detail |
|---|---|
| Platform | Zomato, Swiggy |
| Work Pattern | 6–10 hours/day, 5–7 days/week |
| Avg. Weekly Earnings | ₹3,500 – ₹7,000 (city-dependent) |
| Peak Hours | 12–2 PM (lunch), 7–10 PM (dinner) |
| Vulnerability Window | Rainstorms, heat waves, curfews during peak hours |
| Device | Android smartphone (primary interface) |
| Payment Preference | UPI (PhonePe, GPay, Paytm) |

### Why Food Delivery?

Food delivery workers are the **most exposed** persona to weather disruptions because:
- Their income is directly tied to real-time delivery slots
- Rain is the #1 cause of lost shifts — platforms suspend deliveries or workers refuse to ride
- They operate during concentrated peak windows, so a 2-hour disruption erases 30–40% of daily income
- They have the highest smartphone penetration among gig worker categories, making a mobile-first app viable

### What We Are NOT Building

- ❌ Health or accident insurance
- ❌ Vehicle breakdown or repair coverage
- ❌ Life insurance
- ❌ Worker compensation / occupational hazard insurance

---

## 3. Core Scenarios & Workflows

### Scenario A: Heavy Rain During Peak Hours

**Trigger:** IMD (India Meteorological Department) API reports rainfall ≥ 15mm/hr in the worker's registered zone.

**Workflow:**
```
Worker is Active (GPS confirms zone) 
    → Weather API crosses threshold (15mm/hr rain)
    → Multi-signal validator runs (GPS + accelerometer + platform login status)
    → AI Risk Engine confirms worker is genuinely in disruption zone
    → Claim auto-initiated (no worker action required)
    → Fraud Engine scores claim
    → If score < threshold → Instant UPI payout within 5 minutes
    → Worker receives push notification: "₹320 credited for 2 hours of disruption"
```

### Scenario B: Red-Alert Pollution Day (AQI > 400)

**Trigger:** CPCB (Central Pollution Control Board) API issues AQI > 400 for worker's zone.

**Workflow:**
```
Worker opts into "Pollution Shield" add-on during onboarding
    → AQI threshold crossed city-wide
    → Platform API (mocked) confirms delivery volume drop > 40%
    → Auto-claim for all insured workers in affected zone
    → Batch payout processed
    → Workers notified with breakdown: disruption type, hours covered, amount paid
```

### Scenario C: Sudden Curfew / Shutdown

**Trigger:** Curfew event logged via Zenvy's curated social intelligence feed (government alerts + verified news sources).

**Workflow:**
```
Event ingested from govt alert / news API
    → Zone mapping: affected PIN codes identified
    → All active workers in affected zones automatically protected
    → No GPS confirmation required for declared zone-wide events
    → Claims processed in batch; payouts within 15 minutes
```

### Scenario D: Flagged / Suspicious Claim (Anti-Spoofing Path)

**Trigger:** Fraud engine flags anomalous GPS or behavioral signals.

**Workflow:**
```
Claim initiated → Fraud Engine Score > 0.75
    → Claim enters "Soft Hold" (not rejected)
    → Worker receives: "We're verifying your coverage. This takes up to 2 hours."
    → Secondary validator runs: cross-checks platform login events, cell tower triangulation, peer density
    → If cleared → Payout released (with apology message for delay)
    → If confirmed fraud → Claim denied + account flagged for review
    → Pattern fraud (coordinated ring) → Escalated to fraud ops team
```

---

## 4. Weekly Premium Model

### Philosophy

Gig workers earn and spend weekly. They cannot commit to monthly premiums. Zenvy's subscription is **deducted every Monday morning** and covers the full upcoming week (Monday–Sunday). Workers can pause any week with 48-hour notice.

### Premium Tiers (Per Week)

| Tier | Weekly Premium | Coverage | Best For |
|---|---|---|---|
| **Basic Shield** | ₹29/week | Up to ₹150/hour, max 8 hours/week | Part-time workers |
| **Standard Shield** | ₹59/week | Up to ₹250/hour, max 10 hours/week | Average earners |
| **Pro Shield** | ₹99/week | Up to ₹400/hour, max 15 hours/week | Full-time earners |
| **Elite Shield** | ₹149/week | Up to ₹600/hour, max 20 hours/week | High-earning partners |

### AI-Driven Dynamic Premium Adjustment

The base tier premium is **not static**. Our ML engine recalculates a worker-specific risk multiplier each week based on:

| Factor | Premium Impact |
|---|---|
| Worker's historical zone (flood-prone) | +5% to +15% |
| City-level seasonal forecast (monsoon week) | +8% to +20% |
| Worker's claim history (low claims) | −5% loyalty discount |
| Zone historically safe from waterlogging | −₹5 flat discount |
| Active weeks streak (no pauses) | −2% per streak month |

**Example:**  
Ravi works in Dharavi, Mumbai. His base Pro Shield is ₹99/week. July monsoon season triggers +12% weather risk surcharge. But his 3-month clean history gives −5%. Final premium: ₹104.88 → rounded to ₹105/week. Worker sees full breakdown in the app.

### Payout Calculation

```
Hourly Payout = min(Worker's Actual Avg Hourly Earning, Tier Coverage Cap)
Total Payout = Hourly Payout × Verified Disrupted Hours
```

Verified Disrupted Hours are calculated as:
- The overlap between the disruption event window AND the worker's active shift window
- Capped at the tier's maximum weekly hours

---

## 5. Parametric Trigger Framework

Parametric insurance pays based on **event thresholds**, not loss assessment. No adjuster. No claim form. Just: "did the event happen? Was the worker there? Pay."

### Trigger 1: Heavy Rain

| Parameter | Threshold |
|---|---|
| Rainfall rate | ≥ 15mm/hr (moderate) → 50% hourly payout; ≥ 35mm/hr (heavy) → 100% hourly payout |
| Duration | Minimum 30 continuous minutes |
| Source | IMD API + OpenWeatherMap cross-validation |
| Granularity | PIN code level (≤ 5km radius) |

### Trigger 2: Extreme Heat

| Parameter | Threshold |
|---|---|
| Temperature | ≥ 43°C (Red Alert) |
| Duration | ≥ 2 continuous hours between 11 AM – 4 PM |
| Source | IMD Heat Wave API |
| Additional condition | State govt must have issued heat advisory |

### Trigger 3: Severe Air Pollution

| Parameter | Threshold |
|---|---|
| AQI | ≥ 400 (Severe) |
| Duration | ≥ 3 continuous hours |
| Source | CPCB API + IQAir API |
| Worker opt-in | Required (add-on coverage) |

### Trigger 4: Flooding / Waterlogging

| Parameter | Threshold |
|---|---|
| Flood alert | State Disaster Management Authority Red/Orange alert |
| OR | IMD rainfall > 65mm in 24 hours |
| Source | NDMA API + IMD |
| Granularity | Ward/zone level |

### Trigger 5: Curfew / Shutdown Events

| Parameter | Threshold |
|---|---|
| Event type | Declared curfew, Section 144, bandh, civic shutdown |
| Source | Government gazette feed + NewsAPI (verified sources only) |
| Validation | Minimum 2 independent source confirmations |
| Coverage | Full shift hours during declared period |

---

## 6. AI/ML Architecture — Full Engine Breakdown

Zenvy's intelligence layer consists of **four distinct AI/ML engines**, each with a specific function and model choice.

---

### Engine 1: Dynamic Premium Calculation Engine (DPCE)

**Purpose:** Calculate a personalized weekly premium for each worker based on risk signals.

**Model:** Gradient Boosted Trees (XGBoost) with weekly retraining pipeline

**Input Features:**

| Feature Category | Specific Inputs |
|---|---|
| Geographic | Worker's registered zone, zone's historical flood/rain frequency, distance from water bodies |
| Temporal | Week of year, month, season, historical disruption frequency in this week |
| Behavioral | Worker's active weeks streak, historical claim rate, average weekly hours |
| Environmental Forecast | 7-day weather forecast score for worker's zone, seasonal anomaly index |
| Platform Signal | Zone's average order volume trend (platform API or mock) |

**Output:** Risk multiplier (0.80 – 1.40) applied to base tier premium

**Training Data:** 3 years of IMD weather records + synthetic disruption/claim data for initial model; retrained weekly with live data after launch

**Explainability:** SHAP values surfaced to worker in-app as plain-language explanation ("Your premium is ₹5 higher this week due to forecasted heavy rain in your zone")

---

### Engine 2: Disruption Detection & Validation Engine (DDVE)

**Purpose:** Confirm a real-world disruption event is occurring, resolve its geographic boundaries, and determine its severity tier.

**Model:** Rule-based threshold engine + Spatial Clustering (DBSCAN) for zone mapping

**Pipeline:**
```
Raw API Data (Weather/AQI/NDMA) 
    → Threshold Evaluator (hard rules per trigger type)
    → Cross-API Validator (≥2 sources must agree within 15% variance)
    → Zone Geometry Engine (maps disruption to PIN codes using DBSCAN clustering on sensor data)
    → Severity Classifier (3-tier: Partial/Full/Extreme)
    → Disruption Event Object created with: {event_id, type, zone_ids, start_time, severity, source_confidence}
```

**Key Design Decision:** We never rely on a single API. Every disruption event requires corroboration from at least 2 independent data sources before it becomes a payable trigger. This prevents false positives from API glitches.

---

### Engine 3: Fraud Detection Engine (FDE)

**Purpose:** Assign a fraud risk score (0.0 – 1.0) to every claim before payout.

**Model:** Isolation Forest (anomaly detection) + Random Forest Classifier, with a rule-based override layer

**Input Signals (50+ features):**

**GPS & Movement Signals:**
- GPS coordinate consistency over 30-minute window
- GPS accuracy radius (spoofed GPS often has artificially perfect accuracy)
- Speed-of-movement pattern (genuine outdoor exposure shows micro-movement; spoofed shows perfect stationarity)
- GPS altitude variance (multi-floor detection)
- Cell tower ID triangulation — does it match GPS-reported location?
- Wi-Fi BSSID cross-check — is the worker connected to home Wi-Fi while claiming outdoor exposure?

**Device Signals:**
- Accelerometer/gyroscope patterns (is the device actually moving? Rain riders show phone vibration from bike movement)
- Screen-on/off pattern during claimed disruption hours
- Battery drain pattern (outdoor navigation drains battery faster than home use)
- Mock GPS app detection (checks for known spoofing apps via device fingerprint — optional, requires user consent on install)

**Behavioral Signals:**
- Claim frequency vs. historical baseline
- Claim timing — does it match historical shift pattern?
- Time-of-claim vs. disruption window (claims submitted 10 minutes after event end are suspicious)
- Platform login events — was the worker's Zomato/Swiggy app active during the claimed period?

**Network / Contextual Signals:**
- How many other workers in the same zone also claimed? (High density = more legitimate; zero density = suspicious)
- Peer density score: are 0 or 100 workers from the same building claiming simultaneously?
- Historical zone risk score vs. claim location

**Output:** Fraud Score (0.0 – 1.0) + top 3 flag reasons

**Decision Thresholds:**
| Score | Action |
|---|---|
| 0.0 – 0.40 | Auto-approve → instant payout |
| 0.41 – 0.74 | Soft Hold → secondary validation (up to 2 hours) |
| 0.75 – 1.0 | Deny + account flag |

---

### Engine 4: Coordinated Fraud Ring Detector (CFRD)

**Purpose:** Identify organized fraud syndicates (e.g., 50+ workers in the same building all claiming simultaneously).

**Model:** Graph Neural Network (GNN) — workers as nodes, shared device/IP/location as edges

**Signals analyzed:**
- Shared Wi-Fi BSSID across multiple claimants
- Claim submission timestamps within a 2-minute burst window
- Same cell tower ID for geographically dispersed claimed locations
- Social graph: accounts created within 24 hours of each other
- Telegram/WhatsApp group detection proxy: sudden surge of new enrollments from same IP subnet

**Output:** Ring confidence score. If a ring is confirmed, all claims within that ring enter manual review. New members from suspected ring IPs are flagged during onboarding.

**Important:** This engine does NOT auto-deny claims. It flags for human review. We do not penalize individual workers for network-level fraud patterns without human verification.

---

### Engine 5: Payout Optimization Engine (POE)

**Purpose:** Ensure the insurance liquidity pool remains solvent by dynamically adjusting coverage parameters within predefined bounds.

**Model:** Reinforcement Learning (PPO — Proximal Policy Optimization)

**State inputs:** Current pool balance, active subscriber count, upcoming weather forecast, seasonal risk index, current claim rate

**Actions available:** Adjust payout rate (within ±10% of base), trigger reinsurance reserve draw, issue premium surge notification to new subscribers

**Reward function:** Maximize long-term pool solvency and subscriber satisfaction simultaneously

**Guardrails:** This engine cannot reduce payouts below the contracted minimum. It can only suggest reinsurance draws or flag the need for premium adjustment at renewal.

---

## 7. System Architecture — Full Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ZENVY PLATFORM                           │
├─────────────────┬───────────────────┬───────────────────────────────┤
│   MOBILE APP    │    BACKEND API    │       DATA & ML LAYER         │
│  (React Native) │  (FastAPI/Python) │    (Python + Cloud ML)        │
└────────┬────────┴────────┬──────────┴──────────────┬────────────────┘
         │                 │                           │
    ┌────▼────┐       ┌────▼──────────────────────────▼────────────┐
    │  Worker │       │              CORE SERVICES                  │
    │   App   │       │  ┌──────────────┐  ┌──────────────────────┐ │
    │         │       │  │  Auth Service│  │  Premium Calc Service │ │
    │  ┌────┐ │       │  │  (JWT+OTP)   │  │  (DPCE Engine)        │ │
    │  │KYC │ │       │  └──────────────┘  └──────────────────────┘ │
    │  │Dash│ │       │  ┌──────────────┐  ┌──────────────────────┐ │
    │  │Clm │ │       │  │  Policy Svc  │  │  Fraud Engine (FDE)   │ │
    │  │Pay │ │       │  │              │  │  + Ring Detector      │ │
    │  └────┘ │       │  └──────────────┘  └──────────────────────┘ │
    └────┬────┘       │  ┌──────────────┐  ┌──────────────────────┐ │
         │            │  │  Claim Svc   │  │  Payout Service       │ │
    ┌────▼────┐       │  │              │  │  (UPI/Razorpay Mock)  │ │
    │ Admin   │       │  └──────────────┘  └──────────────────────┘ │
    │Dashboard│       │  ┌──────────────┐  ┌──────────────────────┐ │
    │(Web)    │       │  │Notification  │  │  Event Trigger Svc    │ │
    └─────────┘       │  │  Service     │  │  (DDVE Engine)        │ │
                      │  │(FCM/SMS)     │  └──────────────────────┘ │
                      │  └──────────────┘                            │
                      └─────────────────────────────────────────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────┐
          │         EXTERNAL APIs        │     DATA STORES           │
          │  ┌─────────────────────┐     │  ┌──────────────────────┐ │
          │  │ IMD Weather API     │     │  │  PostgreSQL           │ │
          │  │ CPCB AQI API        │     │  │  (Worker profiles,   │ │
          │  │ NDMA Disaster API   │     │  │   Policies, Claims)   │ │
          │  │ OpenWeatherMap API  │     │  └──────────────────────┘ │
          │  │ IQAir API           │     │  ┌──────────────────────┐ │
          │  │ NewsAPI (curfews)   │     │  │  Redis               │ │
          │  │ Razorpay (mock)     │     │  │  (Session cache,     │ │
          │  │ Twilio (SMS/OTP)    │     │  │   real-time events)  │ │
          │  └─────────────────────┘     │  └──────────────────────┘ │
          │                              │  ┌──────────────────────┐ │
          │                              │  │  S3 / Object Store   │ │
          │                              │  │  (KYC docs, logs)    │ │
          │                              │  └──────────────────────┘ │
          └──────────────────────────────┴──────────────────────────┘
```

### Service-by-Service Breakdown

#### Auth Service
- Mobile OTP login via Twilio SMS
- JWT access tokens (15 min) + refresh tokens (7 days)
- Device fingerprint binding (prevents account sharing)
- KYC via Digilocker API integration (Aadhaar + platform worker ID)

#### Policy Service
- Policy lifecycle: DRAFT → ACTIVE → PAUSED → LAPSED → CANCELLED
- Weekly auto-renewal via scheduled job (every Monday 6 AM)
- Tier upgrade/downgrade: effective next Monday
- Pause window: worker can pause up to 4 weeks/year

#### Claim Service
- Claims are system-generated, not worker-filed (zero-touch default)
- Worker-initiated manual claims allowed for edge cases (requires supporting context)
- Claim states: INITIATED → FRAUD_CHECK → VALIDATED → PROCESSING → PAID / REJECTED / ON_HOLD
- All state transitions logged with timestamp + reason

#### Event Trigger Service (DDVE)
- Polls external weather/AQI/disaster APIs every 5 minutes
- Event deduplication (same event doesn't trigger twice)
- Zone mapping: all active workers in affected zones get claim initiated automatically
- Event log stored for audit and model retraining

#### Payout Service
- Primary: Razorpay Payout API (test/sandbox mode for Phase 2; live for Phase 3)
- Secondary: UPI direct transfer via mock
- Payout confirmation: webhook received → worker notified via push + SMS
- Failed payout: retry 3× with exponential backoff; fallback to manual processing queue

#### Notification Service
- Push: Firebase Cloud Messaging
- SMS: Twilio (for workers who disable notifications)
- Language support: English, Hindi, Tamil, Telugu, Kannada (Phase 2 priority: Hindi)
- Message types: premium deducted, disruption detected, payout sent, claim on hold

---

## 8. Tech Stack

### Frontend (Mobile — React Native)

| Component | Technology | Reason |
|---|---|---|
| Framework | React Native (Expo managed) | Single codebase for Android; fast dev cycle |
| State management | Zustand | Lightweight, minimal boilerplate |
| API layer | React Query + Axios | Caching, retry logic, background sync |
| Maps | react-native-maps (Google Maps) | Zone visualization |
| Charts | Victory Native | Dashboard charts |
| Push notifications | Expo Notifications + FCM | Cross-platform push |
| Local storage | Expo SecureStore | JWT token storage |
| UI kit | Custom components + NativeWind (Tailwind for RN) | Consistent styling |

### Frontend (Admin Web — React)

| Component | Technology |
|---|---|
| Framework | React + Vite |
| State | Zustand |
| Charts | Recharts |
| Tables | TanStack Table |
| Styling | Tailwind CSS |

### Backend

| Component | Technology | Reason |
|---|---|---|
| API Framework | FastAPI (Python) | Async-native, fast, auto-generates OpenAPI docs |
| Authentication | python-jose (JWT) + Twilio | OTP + stateless auth |
| ORM | SQLAlchemy + Alembic (migrations) | Robust DB management |
| Task Queue | Celery + Redis | Background jobs: API polling, payout processing |
| Scheduler | APScheduler | Weekly premium deduction, API polling cron |
| Caching | Redis | Session cache, event dedup, rate limiting |
| WebSockets | FastAPI WebSocket | Real-time dashboard updates |

### Data & ML

| Component | Technology |
|---|---|
| ML framework | scikit-learn, XGBoost, PyTorch (GNN) |
| Feature store | Feast (open source) |
| Experiment tracking | MLflow |
| Model serving | FastAPI ML endpoints (inline for Phase 1-2; move to BentoML in Phase 3) |
| Data pipeline | Apache Airflow (Phase 3); manual scripts (Phase 1-2) |

### Infrastructure

| Component | Technology |
|---|---|
| Cloud | AWS (EC2 + RDS + S3 + ElastiCache) |
| Database | PostgreSQL 15 (RDS) |
| Cache | Redis 7 (ElastiCache) |
| Object storage | S3 (KYC docs, model artifacts) |
| CI/CD | GitHub Actions → Docker → EC2 |
| Containerization | Docker + Docker Compose |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack (Elasticsearch, Logstash, Kibana) |
| Secrets | AWS Secrets Manager |

### External APIs

| API | Purpose | Phase |
|---|---|---|
| IMD (India Met. Dept) | Rain/heat triggers | Phase 1+ |
| OpenWeatherMap (free tier) | Cross-validation weather | Phase 1+ |
| CPCB AQI API | Pollution trigger | Phase 1+ |
| IQAir API | AQI cross-validation | Phase 2+ |
| NDMA (mock) | Disaster/flood alerts | Phase 1+ (mocked) |
| NewsAPI | Curfew/shutdown events | Phase 2+ |
| Razorpay Payout (sandbox) | Payouts | Phase 2+ |
| Twilio | SMS OTP + notifications | Phase 1+ |
| Firebase FCM | Push notifications | Phase 1+ |
| Digilocker (mock) | KYC / Aadhaar verification | Phase 2+ |

---

## 9. Novel Features & Differentiators

### 1. ShiftGuard™ — Predictive Coverage Alerts

**What it does:** 24 hours before a likely disruption (based on weather forecast), Zenvy notifies workers: "Tomorrow 2–5 PM looks risky. You're covered. Plan accordingly."

**Why it's different:** Most insurance is reactive. ShiftGuard makes it proactive — workers can choose to work during high-risk hours because they know they're protected, rather than staying home and earning nothing.

**Implementation:** DPCE engine's forecast model runs daily at 8 PM for next-day predictions. Threshold for alert: disruption probability > 65%.

---

### 2. ZoneSafe Map — Real-Time Disruption Heatmap

**What it does:** A live in-app map showing which zones are currently under active disruption (color-coded: yellow = watch, orange = active disruption / partial payout, red = extreme / full payout).

**Why it's different:** Workers can see exactly where payouts are active and plan routes to either earn in safe zones or rest during covered disruptions. Turns passive insurance into an active financial tool.

**Implementation:** React Native Maps with zone polygons overlaid. Updated every 5 minutes via WebSocket push.

---

### 3. Disruption Calendar — Monthly Earnings Protection Ledger

**What it does:** A calendar view showing every day of the past month: green days (full earnings), orange days (partial disruption, partial payout), red days (full disruption, full payout). Total protected income displayed at month-end.

**Why it's different:** Workers can see the concrete rupee value of their insurance subscription — "Zenvy protected ₹1,840 of your income this month." This is a retention tool built into the product itself.

---

### 4. Peer Trust Score — Community-Based Claim Credibility

**What it does:** Anonymized, aggregated signal: "87 other delivery partners in your zone confirmed disruption at this time." This is surfaced to workers as social proof, and used internally by the Fraud Engine as a positive signal.

**Why it's different:** Turns the worker community into a self-verifying claim network. Coordinated fraud rings will show anomalous peer scores (everyone from the same building, but 0 workers from the same street), which is a strong fraud signal.

---

### 5. GigCoins — Loyalty Reward Program

**What it does:** Workers earn GigCoins for every clean week (no claim + premium paid on time). GigCoins can be redeemed for premium discounts, tier upgrades, or donated to a community fund for other gig workers.

**Why it's different:** Addresses the adverse selection problem (only high-risk workers buy insurance). The loyalty program incentivizes low-risk, consistent workers to stay enrolled, which is critical for pool solvency.

---

### 6. Buddy Claim — Offline Claim for Low-Connectivity Events

**What it does:** During extreme weather events, workers often lose connectivity. Zenvy allows a trusted "buddy" worker (pre-registered in the app) to confirm exposure on behalf of another worker who is offline during the disruption.

**Fraud guard:** Buddy confirmation counts as a soft signal only. Full payout still requires system-level disruption confirmation. Buddy cannot initiate claims for workers outside their verified zone.

---

## 10. Adversarial Defense & Anti-Spoofing Strategy

> **This section is a direct response to the Market Crash Scenario (Phase 1): 500 delivery workers exploiting a beta platform via GPS-spoofing Telegram ring.**

### The Threat Model

A sophisticated coordinated fraud ring operates as follows:
1. Organized via private Telegram groups with 50–500 members
2. Members install GPS-spoofing APKs (Fake GPS apps on Android)
3. All members simultaneously set their spoofed GPS to a known flood/rain zone
4. They submit claims (or auto-triggering systems detect their "presence")
5. Mass payouts drain the liquidity pool in hours

Simple GPS verification fails entirely against this attack. Our defense is multi-layered.

---

### Layer 1: The Differentiation

**How Zenvy distinguishes a genuinely stranded worker from a bad actor:**

| Signal | Genuine Worker | Spoofed Worker |
|---|---|---|
| GPS accuracy radius | Variable (5–30m in rain, with GPS drift) | Artificially perfect (1–3m constant) |
| GPS update pattern | Micro-movement from rain, wind, bike vibration | Perfectly static or robotic pattern |
| Accelerometer | Continuous micro-movement (bike engine vibration, walking) | Near-zero movement |
| Cell tower ID | Matches GPS-reported location within ±500m | Often mismatches GPS (spoofed GPS, real tower) |
| Wi-Fi BSSID | Not connected to home Wi-Fi, or intermittent outdoor hotspot | Often still connected to home router |
| Battery drain | Elevated (outdoor navigation + rain screen use) | Normal home usage pattern |
| Platform app active | Zomato/Swiggy app running in foreground | Often closed or inactive |
| Speed history | Shows movement between delivery locations | Static for 30+ minutes claiming outdoor exposure |

**Our AI model combines all 8+ signals into a single Behavioral Authenticity Score (BAS).** No single signal is disqualifying — a genuine worker experiencing a GPS glitch in heavy rain shouldn't be penalized. It's the combination that reveals fraud.

---

### Layer 2: The Data — Beyond GPS Coordinates

**Specific data points our system analyzes to detect coordinated fraud rings:**

**Device-level forensics:**
- **GPS accuracy radius** — real outdoor GPS in rain has accuracy 10–40m; spoofed GPS is suspiciously perfect at 1–3m
- **Accelerometer signature** — delivery workers on bikes show a distinct vibration frequency (80–120 Hz); stationary phone shows flat accelerometer
- **Network interface** — is the device connected to cellular data (outdoor) or a home Wi-Fi SSID (indoor)?
- **Cell tower triangulation** — mobile networks log cell tower IDs; we cross-reference the reported GPS with the expected cell tower coverage polygon
- **Known spoofing app detection** — on install, Zenvy's background service checks for the presence of known GPS mock apps (e.g., Fake GPS Location, Mock GPS) and flags accounts with such apps installed. This is disclosed in the app's privacy policy.

**Behavioral pattern analysis:**
- **Claim submission velocity** — 50 claims from workers in the same building within a 2-minute window is statistically impossible for genuine disruptions
- **Historical shift pattern match** — does this claim occur during the worker's typical working hours? A worker who always works 6–10 PM claiming a noon disruption is anomalous
- **Platform login cross-check** — if the Zomato/Swiggy app was not open during the claimed disruption, the worker was likely not working

**Network-level ring detection:**
- **Shared IP address at registration** — multiple accounts registered from the same IP subnet within 48 hours is a strong ring signal
- **Shared device fingerprint** — same device IMEI registering multiple accounts (multi-accounting fraud)
- **Temporal burst pattern** — all ring members submit claims in the same 60-second window; genuine claims are distributed across the disruption event window
- **Geo-clustering anomaly** — 30 workers claiming exposure from a 200m radius residential area during a disruption that only affects a 5km zone

---

### Layer 3: The UX Balance — Fairness for Honest Workers

**The hardest design problem:** In a real rainstorm, a genuine worker might have:
- GPS drift due to weather interference
- Intermittent connectivity causing location gaps
- Platform app crash (it happens during storms)
- Genuine home-shelter decision (they stopped working because of rain, but they're an honest subscriber)

**Our solution: The Graduated Response System, not binary approve/reject.**

**Tier 1 — Auto-Approved (BAS > 0.60, Fraud Score < 0.40):**
Instant payout. No friction. No message beyond "Payout sent."

**Tier 2 — Soft Hold (BAS 0.40–0.60 or Fraud Score 0.41–0.74):**
- Worker receives: *"We're verifying your coverage. Expect your payout within 2 hours."*
- Secondary validation runs automatically (cell tower check, peer density, platform log cross-check)
- If cleared: payout released with message: *"Sorry for the brief delay. ₹X has been credited."*
- Worker is never told they were suspected of fraud unless confirmed

**Tier 3 — Manual Review (Fraud Score > 0.74):**
- Claim denied automatically with a neutral message: *"Your claim requires additional review. Our team will contact you within 24 hours."*
- A human fraud ops agent reviews within 24 hours
- If false positive: payout released with apology and GigCoins compensation
- If confirmed fraud: account suspended with appeal option

**Why this matters:** In a genuine storm, GPS signals are noisy. Up to 15% of legitimate claims may get a Soft Hold during extreme weather events. Our design ensures those workers get paid within 2 hours, not denied outright. The system is calibrated to have a **false negative rate (missed legitimate claims) below 2%**, even at the cost of more manual reviews.

**The "honest network drop" protection:** If more than 30% of workers in a zone simultaneously show connectivity gaps, the system treats it as a weather-induced network event and temporarily relaxes the connectivity requirement for claims in that zone. Genuine storms cause collective connectivity degradation — a coordinated fraud ring doesn't cause this.

---

## 11. Development Plan & Milestones

### Phase 1 (March 4–20): Ideation & Foundation ✅

| Week | Deliverable | Status |
|---|---|---|
| Week 1 | Persona research, problem scoping, tech stack finalization | Done |
| Week 2 | README + architecture document, initial wireframes, GitHub repo setup, 2-min video | **Due March 20** |

### Phase 2 (March 21 – April 4): Automation & Protection

| Week | Sprint Goal | Key Tasks |
|---|---|---|
| Week 3 | Core backend + Registration | FastAPI setup, DB schema, Auth service, KYC mock, Worker onboarding API |
| Week 4 | Policy + Claims + Premium Engine | Policy CRUD, Dynamic premium calculation (DPCE v1), Claims state machine, Razorpay mock integration, 2-min demo video |

### Phase 3 (April 5–17): Scale & Optimize

| Week | Sprint Goal | Key Tasks |
|---|---|---|
| Week 5 | Fraud Engine + Event Triggers + Dashboard | FDE v1, DDVE live integration (weather APIs), Worker dashboard, Admin dashboard, Anti-spoofing layer |
| Week 6 | Polish + Final Submission | Advanced fraud (ring detection), ShiftGuard alerts, ZoneSafe map, end-to-end test, 5-min demo video, pitch deck |

---

## 12. API Integrations

### Weather & Environment

```python
# IMD API (India Meteorological Department)
# Endpoint: https://internal.imd.gov.in/section/nhac/dynamic/  (or mock)
# Rate limit: 100 req/hour (free tier)
# Used for: Rain triggers, heat wave alerts

# OpenWeatherMap (cross-validation)
# Endpoint: https://api.openweathermap.org/data/2.5/weather
# Rate limit: 60 req/min (free tier)
# Used for: Cross-validating IMD rain data

# CPCB AQI API
# Endpoint: https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69
# Used for: Pollution triggers

# Polling interval: every 5 minutes via Celery beat
```

### Payout

```python
# Razorpay Payout API (sandbox)
# Endpoint: https://api.razorpay.com/v1/payouts
# Auth: Key ID + Key Secret (test mode)
# Used for: Worker UPI payouts

# Twilio (SMS + OTP)
# Endpoint: https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
# Used for: OTP delivery, payout confirmation SMS
```

### KYC (Mocked for Phase 1–2)

```python
# Digilocker API (mock for Phase 1-2, integrate in Phase 3)
# Validates: Aadhaar number + Platform Worker ID
# Mock response: { "verified": true, "name": "...", "aadhaar_last4": "XXXX" }
```

---

## 13. Test Cases & Edge Cases

### Claim Processing

| Test Case | Expected Behavior |
|---|---|
| Worker in rain zone, platform app active, accelerometer shows movement | Auto-approve: instant payout |
| Worker in rain zone, platform app inactive (app crashed) | Soft Hold: secondary validation via cell tower |
| Worker's GPS shows rain zone, Wi-Fi shows home BSSID | Fraud flag: Soft Hold + investigation |
| 50 workers from same PIN code claim within 60 seconds | Ring detector flags: all claims enter manual review |
| Worker paused subscription but disruption occurs | No payout; worker notified of lapsed coverage |
| Worker claims disruption 4 hours after event ended | Claim rejected: outside valid claim window (max 2 hours post-event) |
| Genuine worker with known GPS spoofer app installed | Elevated fraud score; requires secondary validation |
| Network outage during heavy storm (30%+ workers offline) | System enters "storm mode": relaxed connectivity requirement |
| API downtime (single weather API fails) | Uses secondary API; if both fail, event held pending until one recovers |

### Premium Processing

| Test Case | Expected Behavior |
|---|---|
| Worker has insufficient balance for premium deduction | Policy enters GRACE_PERIOD (48 hours); reminder sent; lapse if not resolved |
| Worker upgrades tier mid-week | Upgrade effective next Monday; prorated credit issued |
| First-week user with no history | Base multiplier (1.0) applied; historical features default to zone average |

### Anti-Spoofing

| Test Case | Expected Behavior |
|---|---|
| Perfect GPS accuracy (1m) + zero accelerometer | GPS spoofing flag raised; BAS lowered |
| Cell tower mismatch > 2km from GPS | Fraud signal; combined with other signals |
| Genuine GPS drift in heavy rain (40m accuracy radius) | Accepted as genuine; accuracy variance is expected in real weather |
| Worker submits manual claim during system-generated auto-claim | Deduplication: one claim per event-worker pair only |

---

## 14. Business Viability

### Unit Economics (Per Worker, Per Week)

| Metric | Value |
|---|---|
| Avg. weekly premium (Standard tier) | ₹59 |
| Avg. expected payout cost per week | ₹18 (based on 1.2 disruption events/month × 2 hours × ₹200/hr × 30% coverage ratio) |
| Gross margin per worker per week | ₹41 (69%) |
| Customer acquisition cost (target) | ₹200 |
| Payback period | 5 weeks |

### Break-Even Analysis

- Fixed costs: ₹50,000/month (infra + ops at scale)
- Break-even at: ~1,220 active weekly subscribers
- Target Year 1: 10,000 subscribers across 3 cities (Mumbai, Delhi, Bengaluru)
- Year 1 revenue at 10K subscribers: ₹59 × 52 weeks × 10,000 = ₹3.07 Crore ARR

### Why Parametric Insurance Is the Right Model

Traditional insurance requires loss assessment (adjuster visits, receipts, documentation). For a gig worker who earns ₹500/day, spending 2 hours filing a claim to recover ₹300 is irrational. Parametric insurance eliminates this entirely. The trade-off: the worker may not receive the exact amount of their actual loss — but they receive a fair, pre-agreed amount, instantly, with zero friction. For the gig economy, speed and simplicity beat precision.

---

## Repository Structure

```
zenvy/
├── README.md                   ← This file
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/               ← FastAPI route handlers
│   │   ├── services/          ← Business logic services
│   │   ├── models/            ← SQLAlchemy ORM models
│   │   ├── ml/                ← AI/ML engine modules
│   │   │   ├── dpce.py        ← Dynamic Premium Calc Engine
│   │   │   ├── fde.py         ← Fraud Detection Engine
│   │   │   ├── ddve.py        ← Disruption Detection Engine
│   │   │   ├── cfrd.py        ← Coordinated Fraud Ring Detector
│   │   │   └── poe.py         ← Payout Optimization Engine
│   │   ├── tasks/             ← Celery async tasks
│   │   └── core/              ← Config, DB, Auth
│   ├── tests/
│   ├── alembic/               ← DB migrations
│   └── requirements.txt
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── store/
│   │   └── api/
│   └── package.json
├── admin/
│   ├── src/
│   └── package.json
├── infrastructure/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── nginx.conf
└── docs/
    ├── architecture.md
    ├── api-spec.yaml          ← OpenAPI spec
    └── ml-model-cards/
```

---
## Demo Video

🎬 **[Strategy & Prototype Video](https://youtu.be/fTuWLnSoWsg)**

---

*Zenvy — Built for the last mile. Powered by AI. Secured by design.*

> **Phase 1 Submission | Guidewire DEVTrails 2026** |
