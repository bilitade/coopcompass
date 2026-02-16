"""AI Engine module routers."""
from app.modules.ai_engine.okr_validator.routes import router as okr_validator_router
from app.modules.ai_engine.monthly_planner.routes import router as monthly_planner_router
from app.modules.ai_engine.weekly_planner.routes import router as weekly_planner_router
from app.modules.ai_engine.task_generator.routes import router as task_generator_router
from fastapi import APIRouter

# Create main AI engine router
router = APIRouter(prefix="/api/ai-engine", tags=["ai-engine"])

# Include OKR validator routes
router.include_router(okr_validator_router)

# Include monthly planner routes
router.include_router(monthly_planner_router)

# Include weekly planner routes
router.include_router(weekly_planner_router)

# Include task generator routes
router.include_router(task_generator_router)
