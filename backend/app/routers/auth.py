"""Authentication endpoints following OAuth2 and JWT standards."""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT access token.

    This endpoint provides direct login functionality separate from OAuth2 flow.
    Use this for programmatic access or when OAuth2 flow is not needed.

    Args:
        credentials: User login credentials (email and password)
        db: Database session

    Returns:
        Token response with access token, token type, and user information
    """
    # Find and validate user
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create JWT access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "Bearer",  # Consistent capitalization with OAuth2
        "user": user
    }




@router.post("/token", response_model=schemas.OAuth2TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 RFC 6749 compliant token endpoint.

    This endpoint implements the OAuth2 Resource Owner Password Credentials flow.
    Returns an access token that can be used with Bearer authentication.

    Args:
        form_data: OAuth2 password request form with username/password
        db: Database session

    Returns:
        OAuth2 token response with access_token, token_type, and expires_in

    Note:
        - Username field contains the user's email address
        - Password field contains the user's password
    """
    # Validate user credentials
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create JWT access token
    access_token = create_access_token(data={"sub": str(user.id)})

    # Return OAuth2 compliant response
    return {
        "access_token": access_token,
        "token_type": "Bearer",  # OAuth2 standard capitalization
        "expires_in": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60,  # seconds
        "scope": "",  # No scopes defined in this implementation
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user
    pass


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    """Logout (client should discard token)."""
    # JWT tokens don't require server-side logout
    # Client simply discards the token
    pass

