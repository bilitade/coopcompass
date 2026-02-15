"""Authentication endpoints following OAuth2 and JWT standards."""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.models import User, Team, Department
from app.schemas import UserResponse, UserCreate, UserLogin, TokenResponse, OAuth2TokenResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
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
    user = db.query(User).filter(User.email == credentials.email).first()

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


@router.post("/token", response_model=OAuth2TokenResponse)
def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """OAuth2 RFC 6749 compliant token endpoint.

    This endpoint implements the OAuth2 Resource Owner Password Credentials flow.
    Returns an access token that can be used with Bearer authentication.

    Args:
        username: User email address (OAuth2 username field)
        password: User password
        db: Database session

    Returns:
        OAuth2 token response with access_token, token_type, and expires_in

    Note:
        - Username field contains the user's email address
        - Password field contains the user's password
    """
    # Validate user credentials
    user = db.query(User).filter(User.email == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(password, user.password_hash):
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
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        "scope": "",  # No scopes defined in this implementation
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current authenticated user information."""
    # Reload user with team and department relationships
    user = db.query(User).options(
        joinedload(User.team).joinedload(Team.department)
    ).filter(User.id == current_user.id).first()
    
    # Get department name from team if user has a team
    department_name = None
    if user.team and user.team.department:
        department_name = user.team.department.name
    else:
        # If no team, check if user is a director of a department
        department = db.query(Department).filter(Department.director_id == user.id).first()
        if department:
            department_name = department.name
    
    # Create a response dict with team_name and department_name
    user_dict = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'position': user.position,
        'role': user.role,
        'team_id': user.team_id,
        'team_name': user.team.name if user.team else None,
        'department_name': department_name,
        'is_active': user.is_active,
        'created_at': user.created_at,
        'updated_at': user.updated_at,
    }
    return UserResponse(**user_dict)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    """Logout (client should discard token)."""
    # JWT tokens don't require server-side logout
    # Client simply discards the token
    pass

