import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file from backend or root directory if present
env_backend = Path(__file__).resolve().parent.parent.parent / ".env"
env_root = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if env_backend.exists():
    load_dotenv(dotenv_path=env_backend)
elif env_root.exists():
    load_dotenv(dotenv_path=env_root)

class Settings(BaseSettings):
    PROJECT_NAME: str = "VIPCARE AI"
    VERSION: str = "1.1.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./careerlens.db")
    CORS_ORIGINS: list[str] = ["*"]
    SECRET_KEY: str = os.getenv("SECRET_KEY", "vipcare-enterprise-secret-key-2026-sha256")
    
    # SMTP / Email Configuration for OTP Verification
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "VIPCARE India <noreply@vipcare.ai>")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ["true", "1", "yes"]

    # AI Chatbot & Copilot Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Matching Engine Defaults
    DEFAULT_WEIGHT_SKILL: float = 0.45
    DEFAULT_WEIGHT_CGPA: float = 0.25
    DEFAULT_WEIGHT_PROJECT: float = 0.20
    DEFAULT_WEIGHT_BACKLOG_PENALTY: float = 0.10
    
    # Fairness Auditing Thresholds
    EEOC_FOUR_FIFTHS_THRESHOLD: float = 0.80  # 80% Rule

    class Config:
        case_sensitive = True

settings = Settings()

