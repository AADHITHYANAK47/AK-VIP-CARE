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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(drives.router, prefix=settings.API_V1_STR)
app.include_router(matching.router, prefix=settings.API_V1_STR)
app.include_router(fairness.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)
app.include_router(roadmap.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)

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
