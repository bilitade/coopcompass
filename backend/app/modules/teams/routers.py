"""Team management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import *
from app.schemas import *
from app.api.v1.deps import get_current_user, get_current_team_lead

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=list[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List teams based on role visibility."""
    query = db.query(Team).options(
        joinedload(Team.department),
        joinedload(Team.users)
    )

    if current_user.role == "director":
        # Find department(s) led by this director
        dept_ids = [d.id for d in db.query(Department).filter(Department.director_id == current_user.id).all()]
        query = query.filter(Team.department_id.in_(dept_ids))
    
    # Executives and Admins see all
    return query.all()


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Create a new team."""
    new_team = Team(
        name=team_data.name,
        description=team_data.description,
        department_id=team_data.department_id
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    # Reload with relationships
    team = db.query(Team).options(
        joinedload(Team.department),
        joinedload(Team.users)
    ).filter(Team.id == new_team.id).first()
    
    return team


@router.get("/{team_id}", response_model=TeamDetailResponse)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team details with users and department."""
    team = db.query(Team).filter(Team.id == team_id).options(
        joinedload(Team.department),
        joinedload(Team.users)
    ).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Authorization: Directors can only see teams in their own department
    if current_user.role == "director":
        if not team.department or team.department.director_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This team does not belong to your department"
            )
    
    return team


@router.get("/{team_id}/users", response_model=list[UserResponse])
def list_team_users(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users in a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Authorization: Directors can only see teams in their own department
    if current_user.role == "director":
        if not team.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This team does not belong to your department"
            )
        department = db.query(Department).filter(Department.id == team.department_id).first()
        if not department or department.director_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This team does not belong to your department"
            )
    
    users = db.query(User).filter(User.team_id == team_id).all()
    return users


@router.get("/available-users/all", response_model=list[UserResponse])
def list_available_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all available users (not yet assigned to any team)."""
    users = db.query(User).filter(User.team_id == None).all()
    return users


@router.post("/{team_id}/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_user_to_team(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Add an existing user to a team."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add user to team
    user.team_id = team_id
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{team_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_team(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Remove a user from a team."""
    # Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check user exists and is in the team
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this team"
        )
    
    # Remove user from team
    user.team_id = None
    db.commit()


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Update a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if team_data.name:
        team.name = team_data.name
    
    if team_data.description is not None:
        team.description = team_data.description
    
    if team_data.department_id is not None:
        team.department_id = team_data.department_id
    
    db.commit()
    db.refresh(team)
    
    # Reload with relationships
    team = db.query(Team).options(
        joinedload(Team.department),
        joinedload(Team.users)
    ).filter(Team.id == team_id).first()
    
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_team_lead)
):
    """Delete a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    db.delete(team)
    db.commit()



