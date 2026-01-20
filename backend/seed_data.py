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
        
        # Create teams
        team1 = Team(name="Engineering Team")
        team2 = Team(name="Product Team")
        db.add(team1)
        db.add(team2)
        db.commit()
        db.refresh(team1)
        db.refresh(team2)
        print(f"✓ Created team: {team1.name} (ID: {team1.id})")
        print(f"✓ Created team: {team2.name} (ID: {team2.id})")
        
        # Create users for team 1
        team1_users = [
            User(
                team_id=team1.id,
                name="Sarah Chen",
                email="sarah@bank.com",
                role="lead",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team1.id,
                name="John Smith",
                email="john@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team1.id,
                name="Mike Johnson",
                email="mike@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
        ]
        
        # Create users for team 2
        team2_users = [
            User(
                team_id=team2.id,
                name="Emily Davis",
                email="emily@bank.com",
                role="lead",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team2.id,
                name="Alex Rodriguez",
                email="alex@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
            User(
                team_id=team2.id,
                name="Lisa Wong",
                email="lisa@bank.com",
                role="member",
                password_hash=hash_password("password123"),
                is_active=True
            ),
        ]
        
        all_users = team1_users + team2_users
        for user in all_users:
            db.add(user)
        db.commit()
        print(f"✓ Created {len(all_users)} users (3 in {team1.name}, 3 in {team2.name})")
        
        for user in all_users:
            db.refresh(user)
        
        # Assign users to variables for easier reference
        sarah = team1_users[0]
        john = team1_users[1]
        mike = team1_users[2]
        emily = team2_users[0]
        alex = team2_users[1]
        lisa = team2_users[2]
        
        team = team1  # Use team1 for the rest of the seeding
        
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
        
        # ===== Seed data for team 2 (Product Team) =====
        print("\n--- Seeding Product Team ---")
        
        # Create OKR for team 2
        okr2 = OKR(
            team_id=team2.id,
            quarter="Q1 2026",
            objective="Launch Mobile App and Improve User Experience",
            is_active=True
        )
        db.add(okr2)
        db.commit()
        db.refresh(okr2)
        print(f"✓ Created OKR: {okr2.objective}")
        
        # Create Key Results for team 2
        key_results2 = [
            KeyResult(
                okr_id=okr2.id,
                description="Launch iOS and Android apps",
                target_value=Decimal("2"),
                current_value=Decimal("1"),
                unit="apps"
            ),
            KeyResult(
                okr_id=okr2.id,
                description="Achieve 4.5+ star rating on app stores",
                target_value=Decimal("4.5"),
                current_value=Decimal("3.8"),
                unit="stars"
            ),
            KeyResult(
                okr_id=okr2.id,
                description="Reach 10K monthly active users",
                target_value=Decimal("10000"),
                current_value=Decimal("6500"),
                unit="users"
            ),
        ]
        
        for kr in key_results2:
            db.add(kr)
        db.commit()
        print(f"✓ Created {len(key_results2)} key results")
        
        for kr in key_results2:
            db.refresh(kr)
        
        # Create BAU Activities for team 2
        bau_activities2 = [
            BAUActivity(
                team_id=team2.id,
                name="Customer Support",
                description="Handle customer issues and feedback",
                is_active=True
            ),
            BAUActivity(
                team_id=team2.id,
                name="Analytics & Reporting",
                description="Track metrics and generate reports",
                is_active=True
            ),
        ]
        
        for bau in bau_activities2:
            db.add(bau)
        db.commit()
        print(f"✓ Created {len(bau_activities2)} BAU activities")
        
        for bau in bau_activities2:
            db.refresh(bau)
        
        # Create BAU Metrics for team 2
        support_bau = bau_activities2[0]
        analytics_bau = bau_activities2[1]
        
        metrics2 = [
            BAUMetric(
                bau_activity_id=support_bau.id,
                name="Response Time",
                target_value=Decimal("2"),
                current_value=Decimal("2.5"),
                unit="hours",
                weight=Decimal("0.5"),
                is_higher_better=False
            ),
            BAUMetric(
                bau_activity_id=support_bau.id,
                name="Customer Satisfaction",
                target_value=Decimal("90"),
                current_value=Decimal("85"),
                unit="%",
                weight=Decimal("0.5"),
                is_higher_better=True
            ),
            BAUMetric(
                bau_activity_id=analytics_bau.id,
                name="Report Accuracy",
                target_value=Decimal("99"),
                current_value=Decimal("98.5"),
                unit="%",
                weight=Decimal("0.6"),
                is_higher_better=True
            ),
            BAUMetric(
                bau_activity_id=analytics_bau.id,
                name="Report Generation Time",
                target_value=Decimal("5"),
                current_value=Decimal("6"),
                unit="minutes",
                weight=Decimal("0.4"),
                is_higher_better=False
            ),
        ]
        
        for metric in metrics2:
            db.add(metric)
        db.commit()
        print(f"✓ Created {len(metrics2)} BAU metrics")
        
        for metric in metrics2:
            db.refresh(metric)
        
        # Create Work Items for team 2
        work_items2 = [
            WorkItem(
                team_id=team2.id,
                name="iOS app development",
                description="Develop and launch iOS application",
                source_type="OKR",
                source_id=key_results2[0].id,
                owner_id=emily.id,
                month="2026-01"
            ),
            WorkItem(
                team_id=team2.id,
                name="Android app development",
                description="Develop and launch Android application",
                source_type="OKR",
                source_id=key_results2[0].id,
                owner_id=alex.id,
                month="2026-01"
            ),
            WorkItem(
                team_id=team2.id,
                name="Handle customer tickets",
                description="Process and resolve customer support tickets",
                source_type="BAU",
                source_id=support_bau.id,
                owner_id=lisa.id,
                month="2026-01"
            ),
        ]
        
        for wi in work_items2:
            db.add(wi)
        db.commit()
        print(f"✓ Created {len(work_items2)} work items")
        
        for wi in work_items2:
            db.refresh(wi)
        
        # Create Weekly Priorities for team 2
        priorities2 = [
            WeeklyPriority(
                work_item_id=work_items2[0].id,
                week=current_week,
                priority=1
            ),
            WeeklyPriority(
                work_item_id=work_items2[1].id,
                week=current_week,
                priority=2
            ),
        ]
        
        for p in priorities2:
            db.add(p)
        db.commit()
        print(f"✓ Created {len(priorities2)} weekly priorities")
        
        # Create Tasks for team 2
        tasks2 = [
            Task(
                work_item_id=work_items2[0].id,
                description="Design iOS UI/UX",
                assignee_id=emily.id,
                status="Done",
                effort_hours=20,
                completed_at=datetime.utcnow() - timedelta(days=5)
            ),
            Task(
                work_item_id=work_items2[0].id,
                description="Implement core iOS features",
                assignee_id=emily.id,
                status="In Progress",
                effort_hours=30
            ),
            Task(
                work_item_id=work_items2[0].id,
                description="iOS testing and QA",
                assignee_id=alex.id,
                status="Not Started",
                effort_hours=15
            ),
            Task(
                work_item_id=work_items2[1].id,
                description="Setup Android project",
                assignee_id=alex.id,
                status="Done",
                effort_hours=10,
                completed_at=datetime.utcnow() - timedelta(days=4)
            ),
            Task(
                work_item_id=work_items2[1].id,
                description="Implement Android features",
                assignee_id=alex.id,
                status="In Progress",
                effort_hours=25
            ),
            Task(
                work_item_id=work_items2[2].id,
                description="Review customer tickets",
                assignee_id=lisa.id,
                status="In Progress",
                effort_hours=8
            ),
        ]
        
        for task in tasks2:
            db.add(task)
        db.commit()
        print(f"✓ Created {len(tasks2)} tasks for Product Team")
        
        db.commit()
        print("\n✅ Demo data seeded successfully!")
        print(f"\nYou can login with:")
        print(f"\n  Engineering Team (lead):")
        print(f"    Email: sarah@bank.com")
        print(f"    Password: password123")
        print(f"\n  Product Team (lead):")
        print(f"    Email: emily@bank.com")
        print(f"    Password: password123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding Compass database with demo data...\n")
    seed_demo_data()

