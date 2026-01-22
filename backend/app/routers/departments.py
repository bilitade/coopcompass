"""Department management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils.dependencies import get_current_user, get_current_executive

router = APIRouter(prefix="/api/departments", tags=["departments"])


@router.get("", response_model=list[schemas.DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all departments."""
    departments = db.query(models.Department).all()
    return departments


@router.get("/director", response_model=schemas.DepartmentDetailResponse)
def get_director_department(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get the current user's department (for directors only)."""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can access this endpoint"
        )
    
    # Find department where this user is the director
    department = db.query(models.Department).filter(
        models.Department.director_id == current_user.id
    ).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned as a director to any department"
        )
    
    return department


@router.post("", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_data: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_executive)
):
    """Create a new department (executives only)."""
    # Check if department name already exists
    existing = db.query(models.Department).filter(
        models.Department.name == dept_data.name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )
    
    # Validate director_id if provided
    if dept_data.director_id:
        director = db.query(models.User).filter(
            models.User.id == dept_data.director_id
        ).first()
        if not director:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Director user not found"
            )
    
    new_dept = models.Department(
        name=dept_data.name,
        description=dept_data.description,
        director_id=dept_data.director_id
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@router.get("/{dept_id}", response_model=schemas.DepartmentDetailResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get department details with teams and director info."""
    department = db.query(models.Department).filter(
        models.Department.id == dept_id
    ).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    return department


@router.put("/{dept_id}", response_model=schemas.DepartmentResponse)
def update_department(
    dept_id: int,
    dept_data: schemas.DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_executive)
):
    """Update a department (executives only)."""
    department = db.query(models.Department).filter(
        models.Department.id == dept_id
    ).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    if dept_data.name:
        # Check if new name conflicts with existing department
        existing = db.query(models.Department).filter(
            models.Department.name == dept_data.name,
            models.Department.id != dept_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department with this name already exists"
            )
        department.name = dept_data.name
    
    if dept_data.description is not None:
        department.description = dept_data.description
    
    if dept_data.director_id is not None:
        # Validate director_id
        director = db.query(models.User).filter(
            models.User.id == dept_data.director_id
        ).first()
        if not director:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Director user not found"
            )
        department.director_id = dept_data.director_id
    
    db.commit()
    db.refresh(department)
    return department


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_executive)
):
    """Delete a department (executives only)."""
    department = db.query(models.Department).filter(
        models.Department.id == dept_id
    ).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    db.delete(department)
    db.commit()


@router.get("/{dept_id}/teams", response_model=list[schemas.TeamResponse])
def get_department_teams(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all teams in a department."""
    department = db.query(models.Department).filter(
        models.Department.id == dept_id
    ).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    teams = db.query(models.Team).filter(
        models.Team.department_id == dept_id
    ).all()
    
    return teams

