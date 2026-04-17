# ============================================================
# database.py — SQLite connection + session management
# ============================================================
# We use SQLAlchemy with SQLite for simplicity.
# SQLite stores everything in a single file (zenvy.db).
# ============================================================

import os

# ── Database path ─────────────────────────────────────────────
# Render injects the RENDER env var automatically on all services.
# /tmp is always writable on Render. Locally we use ./zenvy.db.
if os.environ.get("RENDER"):
    DB_PATH = "/tmp/zenvy.db"
else:
    DB_PATH = "./zenvy.db"

DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create the engine — check_same_thread=False needed for SQLite + FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db():
    """
    Dependency injected into every route that needs DB access.
    Yields a session, then closes it after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
