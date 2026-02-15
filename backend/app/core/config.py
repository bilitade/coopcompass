"""Application configuration and settings."""

import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
try:
    load_dotenv()
except:
    pass

class Settings(BaseSettings):
    """Application settings."""
    database_url: str = "sqlite:///./tpes.db"
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    debug: bool = False
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from environment

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tpes.db")
if "DATABASE_URL=" in DATABASE_URL:
    DATABASE_URL = "sqlite:///./tpes.db"

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Application configuration
DEBUG = os.getenv("DEBUG", "False") == "True"

def get_settings() -> Settings:
    """Get application settings."""
    return Settings()

# CORS configuration
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"  # Allow all in development
]

