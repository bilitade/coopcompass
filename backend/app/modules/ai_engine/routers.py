"""AI Engine module routers."""
from app.modules.ai_engine.okr_validator.routes import router as okr_validator_router
from fastapi import APIRouter

# Create main AI engine router
router = APIRouter(prefix="/ai-engine", tags=["ai-engine"])

# Include OKR validator routes
router.include_router(okr_validator_router)
