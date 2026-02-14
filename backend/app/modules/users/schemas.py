"""User schemas."""

from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema."""
    name: str
    email: EmailStr
    position: Optional[str] = None
    role: str = Field(..., pattern="^(member|lead|director|executive|admin)$")


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""
    name: Optional[str] = Field(None, min_length=1)
    email: Optional[EmailStr] = None
    position: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(member|lead|director|executive|admin)$")
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """User response schema."""
    id: int
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    position: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response following OAuth2 standards."""
    access_token: str
    token_type: str = "Bearer"  # OAuth2 standard capitalization
    user: UserResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "Bearer",
                "user": {
                    "id": 1,
                    "name": "John Doe",
                    "email": "john@example.com",
                    "role": "member"
                }
            }
        }


class OAuth2TokenResponse(BaseModel):
    """OAuth2 RFC 6749 compliant token response."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    scope: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "Bearer",
                "expires_in": 1800,
                "scope": ""
            }
        }

