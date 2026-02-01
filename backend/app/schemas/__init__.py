"""Pydantic schemas - centralized imports."""

# Import all schemas from modules
from app.modules.users.schemas import *
from app.modules.teams.schemas import *
from app.modules.departments.schemas import *
from app.modules.okrs.schemas import *
from app.modules.bau.schemas import *
from app.modules.work_items.schemas import *
from app.modules.weekly_priority.schemas import *

# Import types needed for forward reference resolution
from app.modules.teams.schemas import TeamResponse
from app.modules.departments.schemas import DepartmentResponse, DepartmentDetailResponse
from app.modules.okrs.schemas import KeyResultResponse
from app.modules.bau.schemas import BAUActivityResponse
from app.modules.work_items.schemas import WorkItemWithSourceResponse

# Update module namespaces to include types needed for forward reference resolution
import app.modules.departments.schemas as dept_schemas
import app.modules.work_items.schemas as wi_schemas
dept_schemas.TeamResponse = TeamResponse
wi_schemas.KeyResultResponse = KeyResultResponse
wi_schemas.BAUActivityResponse = BAUActivityResponse

# Rebuild models to resolve forward references after all imports
# This must be done after all modules are imported to avoid circular import issues
TeamResponse.model_rebuild()
DepartmentResponse.model_rebuild()
TeamDetailResponse.model_rebuild()
DepartmentDetailResponse.model_rebuild()
WorkItemWithSourceResponse.model_rebuild()

