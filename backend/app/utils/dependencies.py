"""FastAPI dependency injection utilities following security best practices."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_user_id_from_token
from app import models

# HTTP Bearer scheme for authentication (RFC 6750 compliant)
bearer_scheme = HTTPBearer(
    description="Enter your JWT token as: Bearer [token]. Get token from /api/auth/token or /auth page.",
    scheme_name="bearerAuth",
    auto_error=True  # Automatically return 401 if no token provided
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current authenticated user from JWT token.

    This dependency:
    1. Extracts the JWT token from Authorization header
    2. Validates the token signature and expiration
    3. Retrieves the user from database
    4. Verifies the user is active

    Args:
        credentials: HTTP Authorization credentials from request header
        db: Database session

    Returns:
        User model instance

    Raises:
        HTTPException: If token is invalid, expired, or user not found/inactive
    """
    token = credentials.credentials

    # Extract user ID from valid JWT token
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Retrieve user from database
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_team_lead(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Get current user and verify they are a team lead or executive."""
    if current_user.role not in ["lead", "executive"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This operation requires lead or executive role"
        )
    return current_user


def get_current_executive(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Get current user and verify they are an executive."""
    if current_user.role != "executive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This operation requires executive role"
        )
    return current_user

