"""Script to seed demo data into the database."""

import os
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models import Base, Team, User, OKR, KeyResult, BAUActivity, BAUMetric, WorkItem, Task, WeeklyPriority
from app.auth import hash_password

# Load environment variables
try:
    load_dotenv()
except:
    pass

# Get database URL from environment
database_url = os.getenv("DATABASE_URL")
if not database_url or "DATABASE_URL=" in database_url:
    # Handle case where .env is malformed or doesn't exist
    database_url = "postgresql://postgres:12345678@localhost:5432/compass"

DATABASE_URL = database_url

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)


def seed_demo_data():
    """Seed the database with demo data."""
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Task).delete()
        db.query(WeeklyPriority).delete()
        db.query(WorkItem).delete()
        db.query(KeyResult).delete()
        db.query(OKR).delete()
        db.query(BAUMetric).delete()
        db.query(BAUActivity).delete()
        db.query(User).delete()
        db.query(Team).delete()
        db.commit()
        
        print("✓ Cleared existing data")
        
        # Create team
        team = Team(name="Engineering Team")
        db.add(team)
        db.commit()
        db.refresh(team)
        print(f"✓ Created team: {team.name} (ID: {team.id})")
        
        # Create users
        users = [
            User(
                team_id=team.id,
                name="Sarah Chen",
                email="sarah@bank.com",
                role="lead",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team.id,
                name="John Smith",
                email="john@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team.id,
                name="Mike Johnson",
                email="mike@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team.id,
                name="Emily Davis",
                email="emily@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        print(f"✓ Created {len(users)} users")
        
        for user in users:
            db.refresh(user)
        
        sarah = users[0]
        john = users[1]
        mike = users[2]
        emily = users[3]
        
        # Create OKR
        okr = OKR(
            team_id=team.id,
            quarter="Q1 2026",
            objective="Modernize Core Banking Infrastructure",
            is_active=True
        )
        db.add(okr)
        db.commit()
        db.refresh(okr)
        print(f"✓ Created OKR: {okr.objective}")
        
        # Create Key Results
        key_results = [
            KeyResult(
                okr_id=okr.id,
                description="Migrate 5 services to cloud",
                target_value=Decimal("5"),
                current_value=Decimal("2"),
                unit="services"
            ),
            KeyResult(
                okr_id=okr.id,
                description="Reduce system downtime by 50%",
                target_value=Decimal("2"),
                current_value=Decimal("0.8"),
                unit="hours/month"
            ),
            KeyResult(
                okr_id=okr.id,
                description="Deploy new API gateway",
                target_value=Decimal("100"),
                current_value=Decimal("45"),
                unit="%"
            ),
        ]
        
        for kr in key_results:
            db.add(kr)
        db.commit()
        print(f"✓ Created {len(key_results)} key results")
        
        for kr in key_results:
            db.refresh(kr)
        
        # Create BAU Activities
        bau_activities = [
            BAUActivity(
                team_id=team.id,
                name="Incident Management",
                description="Track and manage incidents",
                is_active=True
            ),
            BAUActivity(
                team_id=team.id,
                name="System Reliability",
                description="Monitor system uptime and performance",
                is_active=True
            ),
        ]
        
        for bau in bau_activities:
            db.add(bau)
        db.commit()
        print(f"✓ Created {len(bau_activities)} BAU activities")
        
        for bau in bau_activities:
            db.refresh(bau)
        
        # Create BAU Metrics
        incident_bau = bau_activities[0]
        reliability_bau = bau_activities[1]
        
        metrics = [
            BAUMetric(
                bau_activity_id=incident_bau.id,
                name="SLA Adherence",
                target_value=Decimal("95"),
                current_value=Decimal("93"),
                unit="%",
                weight=Decimal("0.5"),
                is_higher_better=True
            ),
            BAUMetric(
                bau_activity_id=incident_bau.id,
                name="MTTR",
                target_value=Decimal("30"),
                current_value=Decimal("35"),
                unit="minutes",
                weight=Decimal("0.5"),
                is_higher_better=False
            ),
            BAUMetric(
                bau_activity_id=reliability_bau.id,
                name="Uptime",
                target_value=Decimal("99.9"),
                current_value=Decimal("99.8"),
                unit="%",
                weight=Decimal("0.6"),
                is_higher_better=True
            ),
            BAUMetric(
                bau_activity_id=reliability_bau.id,
                name="Error Rate",
                target_value=Decimal("0.5"),
                current_value=Decimal("0.3"),
                unit="%",
                weight=Decimal("0.4"),
                is_higher_better=False
            ),
        ]
        
        for metric in metrics:
            db.add(metric)
        db.commit()
        print(f"✓ Created {len(metrics)} BAU metrics")
        
        for metric in metrics:
            db.refresh(metric)
        
        # Create Work Items (monthly)
        work_items = [
            WorkItem(
                team_id=team.id,
                name="Migrate authentication service",
                description="Move auth service to cloud infrastructure",
                source_type="OKR",
                source_id=key_results[0].id,
                owner_id=sarah.id,
                month="2026-01"
            ),
            WorkItem(
                team_id=team.id,
                name="Implement auto-failover",
                description="Set up automatic failover for critical services",
                source_type="OKR",
                source_id=key_results[1].id,
                owner_id=sarah.id,
                month="2026-01"
            ),
            WorkItem(
                team_id=team.id,
                name="Deploy security patches",
                description="Apply monthly security updates",
                source_type="BAU",
                source_id=incident_bau.id,
                owner_id=john.id,
                month="2026-01"
            ),
            WorkItem(
                team_id=team.id,
                name="System monitoring improvements",
                description="Enhance monitoring and alerting",
                source_type="BAU",
                source_id=reliability_bau.id,
                owner_id=mike.id,
                month="2026-01"
            ),
        ]
        
        for wi in work_items:
            db.add(wi)
        db.commit()
        print(f"✓ Created {len(work_items)} work items")
        
        for wi in work_items:
            db.refresh(wi)
        
        # Create Weekly Priorities
        current_week = datetime.utcnow().strftime("%Y-W%U")
        priorities = [
            WeeklyPriority(
                work_item_id=work_items[0].id,
                week=current_week,
                priority=1
            ),
            WeeklyPriority(
                work_item_id=work_items[2].id,
                week=current_week,
                priority=1
            ),
        ]
        
        for p in priorities:
            db.add(p)
        db.commit()
        print(f"✓ Created {len(priorities)} weekly priorities")
        
        # Create Tasks
        tasks = [
            # Migration work item tasks (2 done, 3 not done)
            Task(
                work_item_id=work_items[0].id,
                description="Setup AWS account and infrastructure",
                assignee_id=john.id,
                status="Done",
                effort_hours=8,
                completed_at=datetime.utcnow() - timedelta(days=3)
            ),
            Task(
                work_item_id=work_items[0].id,
                description="Configure database connectivity",
                assignee_id=sarah.id,
                status="Done",
                effort_hours=6,
                completed_at=datetime.utcnow() - timedelta(days=2)
            ),
            Task(
                work_item_id=work_items[0].id,
                description="Migrate user data",
                assignee_id=mike.id,
                status="In Progress",
                effort_hours=12
            ),
            Task(
                work_item_id=work_items[0].id,
                description="Update API endpoints",
                assignee_id=emily.id,
                status="Not Started",
                effort_hours=8
            ),
            Task(
                work_item_id=work_items[0].id,
                description="Run integration tests",
                assignee_id=john.id,
                status="Not Started",
                effort_hours=6
            ),
            # Security patches (1 done, 1 in progress)
            Task(
                work_item_id=work_items[2].id,
                description="Review CVE bulletins",
                assignee_id=john.id,
                status="Done",
                effort_hours=4,
                completed_at=datetime.utcnow() - timedelta(days=1)
            ),
            Task(
                work_item_id=work_items[2].id,
                description="Apply patches to staging",
                assignee_id=mike.id,
                status="In Progress",
                effort_hours=6
            ),
            Task(
                work_item_id=work_items[2].id,
                description="Test patches and deploy to production",
                assignee_id=sarah.id,
                status="Not Started",
                effort_hours=4
            ),
        ]
        
        for task in tasks:
            db.add(task)
        db.commit()
        print(f"✓ Created {len(tasks)} tasks")
        
        db.commit()
        print("\n✅ Demo data seeded successfully!")
        print(f"\nYou can login with:")
        print(f"  Email: sarah@bank.com")
        print(f"  Password: password123")
        print(f"\n  Role: lead")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding Compass database with demo data...\n")
    seed_demo_data()

