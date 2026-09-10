from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
import app.models.db_models as db_models
from app.api import auth, students, drives, matching, fairness, feedback, roadmap, analytics, system, chatbot

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VIPCARE AI: AI-Powered Placement & Career Management System with Fairness Auditing and Self-Improving Matching Engine"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers (both under /api and at root for client URL compatibility)
routers = [
    auth.router,
    students.router,
    drives.router,
    matching.router,
    fairness.router,
    feedback.router,
    roadmap.router,
    analytics.router,
    system.router,
    chatbot.router,
]

for r in routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    app.include_router(r)  # Also available without /api prefix (e.g. /auth/login)

@app.get("/")
def root():
    return {
        "message": "VIPCARE AI Backend API is online",
        "docs_url": "/docs",
        "version": settings.VERSION,
        "differentiators": [
            "Fairness & Bias Audit Engine (EEOC 80% Rule)",
            "Self-Improving Match Engine (Logistic Regression Feedback Loop)",
            "Explainable AI (XAI) Attributions"
        ]
    }
