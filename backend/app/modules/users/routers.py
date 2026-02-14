"""User management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import *
from app.schemas import *
from app.api.v1.deps import get_current_user, get_current_team_lead
from app.core.security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users."""
    users = db.query(User).options(
        joinedload(User.team).joinedload(Team.department)
    ).all()
    
    # Convert to response format with team_name and department_name
    result = []
    for user in users:
        # Get department name from team if user has a team
        department_name = None
        if user.team and user.team.department:
            department_name = user.team.department.name
        else:
            # If no team, check if user is a director of a department
            department = db.query(Department).filter(Department.director_id == user.id).first()
            if department:
                department_name = department.name
        
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
        result.append(UserResponse(**user_dict))
    
    return result


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user details."""
    user = db.query(User).options(
        joinedload(User.team).joinedload(Team.department)
    ).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get department name from team if user has a team
    department_name = None
    if user.team and user.team.department:
        department_name = user.team.department.name
    else:
        # If no team, check if user is a director of a department
        department = db.query(Department).filter(Department.director_id == user.id).first()
        if department:
            department_name = department.name
    
    # Convert to response format with team_name and department_name
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


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a new user."""
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
        position=user_data.position,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Reload with relationships for response
    db.refresh(new_user)
    user = db.query(User).options(
        joinedload(User.team).joinedload(Team.department)
    ).filter(User.id == new_user.id).first()
    
    # Get department name from team if user has a team
    department_name = None
    if user.team and user.team.department:
        department_name = user.team.department.name
    else:
        # If no team, check if user is a director of a department
        department = db.query(Department).filter(Department.director_id == user.id).first()
        if department:
            department_name = department.name
    
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


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a user."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if new email already exists (if email is being changed)
    if user_data.email and user_data.email != user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    if user_data.name:
        user.name = user_data.name
    if user_data.email:
        user.email = user_data.email
    if user_data.role:
        user.role = user_data.role
    if user_data.position is not None:
        user.position = user_data.position
    if user_data.password:
        # Update password if provided
        user.password_hash = hash_password(user_data.password)
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    # Reload with relationships for response
    user = db.query(User).options(
        joinedload(User.team).joinedload(Team.department)
    ).filter(User.id == user.id).first()
    
    # Get department name from team if user has a team
    department_name = None
    if user.team and user.team.department:
        department_name = user.team.department.name
    else:
        # If no team, check if user is a director of a department
        department = db.query(Department).filter(Department.director_id == user.id).first()
        if department:
            department_name = department.name
    
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


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a user."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()

