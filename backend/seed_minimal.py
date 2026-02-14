"""Script to seed minimal test data into the database."""

import os
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models import Base, Team, User, Department
from app.core.security import hash_password

# Load environment variables
try:
    load_dotenv()
except:
    pass

# Get database URL from environment
database_url = os.getenv("DATABASE_URL")
if not database_url or "DATABASE_URL=" in database_url:
    database_url = "postgresql://postgres:12345678@localhost:5432/compass"

DATABASE_URL = database_url

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_minimal_data():
    """Seed the database with minimal test data."""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_user = db.query(User).first()
        if existing_user:
            print("✓ Database already contains data. Skipping seed.")
            return
        
        # Create a department
        dept = Department(
            name="Technology Department",
            description="Technology and IT Operations"
        )
        
        db.add(dept)
        db.commit()
        db.refresh(dept)
        
        print(f"✓ Created department: {dept.name} (ID: {dept.id})")
        
        # Create a team
        team = Team(
            name="Core Banking Team",
            department_id=dept.id
        )
        
        db.add(team)
        db.commit()
        db.refresh(team)
        
        print(f"✓ Created team: {team.name} (ID: {team.id})")
        
        # Create users
        admin_user = User(
            name="Admin User",
            email="admin@compass.com",
            password_hash=hash_password("admin123"),
            role="admin",
            position="System Administrator",
            team_id=team.id
        )
        
        manager_user = User(
            name="Team Manager",
            email="manager@compass.com",
            password_hash=hash_password("manager123"),
            role="lead",
            position="Team Lead",
            team_id=team.id
        )
        
        member_user = User(
            name="Team Member",
            email="member@compass.com",
            password_hash=hash_password("member123"),
            role="member",
            position="Software Engineer",
            team_id=team.id
        )
        
        db.add_all([admin_user, manager_user, member_user])
        db.commit()
        
        print(f"✓ Created admin user: {admin_user.email}")
        print(f"✓ Created manager user: {manager_user.email}")
        print(f"✓ Created member user: {member_user.email}")
        
        print("\n" + "="*60)
        print("✅ Minimal seed data created successfully!")
        print("="*60)
        print("\nTest Credentials:")
        print("  Admin:   admin@compass.com   / admin123")
        print("  Manager: manager@compass.com / manager123")
        print("  Member:  member@compass.com  / member123")
        print("="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_minimal_data()

