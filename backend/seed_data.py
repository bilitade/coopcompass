"""Script to seed demo data into the database."""

import os
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models import Base, Team, User, OKR, KeyResult, BAUActivity, BAUMetric, WorkItem, Task, WeeklyPriority, WeeklyPriorityPlan, MonthlyHeadsUp, Department
from app.core.security import hash_password

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

# Drop and recreate schema to ensure fresh schema (PostgreSQL specific)
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.commit()

# Create tables
Base.metadata.create_all(bind=engine)


def seed_demo_data():
    """Seed the database with demo data."""
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Task).delete()
        db.query(WeeklyPriority).delete()
        db.query(WeeklyPriorityPlan).delete()
        db.query(WorkItem).delete()
        db.query(MonthlyHeadsUp).delete()
        db.query(KeyResult).delete()
        db.query(OKR).delete()
        db.query(BAUMetric).delete()
        db.query(BAUActivity).delete()
        db.query(User).delete()
        db.query(Team).delete()
        db.query(Department).delete()
        db.commit()
        
        print("✓ Cleared existing data")
        
        # ========================================
        # CREATE BANKING DEPARTMENTS
        # ========================================
        dept_tech = Department(
            name="Technology & Infrastructure",
            description="Core banking systems, infrastructure, and digital platforms"
        )
        dept_risk = Department(
            name="Risk & Compliance",
            description="Risk management, regulatory compliance, and security"
        )
        dept_ops = Department(
            name="Operations",
            description="Transaction processing, customer operations, and service delivery"
        )
        dept_digital = Department(
            name="Digital Banking",
            description="Mobile banking, digital channels, and customer experience"
        )
        
        db.add_all([dept_tech, dept_risk, dept_ops, dept_digital])
        db.commit()
        db.refresh(dept_tech)
        db.refresh(dept_risk)
        db.refresh(dept_ops)
        db.refresh(dept_digital)
        
        print(f"✓ Created department: {dept_tech.name} (ID: {dept_tech.id})")
        print(f"✓ Created department: {dept_risk.name} (ID: {dept_risk.id})")
        print(f"✓ Created department: {dept_ops.name} (ID: {dept_ops.id})")
        print(f"✓ Created department: {dept_digital.name} (ID: {dept_digital.id})")
        
        # ========================================
        # CREATE TEAMS
        # ========================================
        team_core = Team(name="Core Banking Systems", department_id=dept_tech.id)
        team_security = Team(name="Cybersecurity", department_id=dept_tech.id)
        team_compliance = Team(name="Regulatory Compliance", department_id=dept_risk.id)
        team_fraud = Team(name="Fraud Prevention", department_id=dept_risk.id)
        team_payments = Team(name="Payment Processing", department_id=dept_ops.id)
        team_mobile = Team(name="Mobile Banking", department_id=dept_digital.id)
        
        db.add_all([team_core, team_security, team_compliance, team_fraud, team_payments, team_mobile])
        db.commit()
        
        for team in [team_core, team_security, team_compliance, team_fraud, team_payments, team_mobile]:
            db.refresh(team)
            print(f"✓ Created team: {team.name} (ID: {team.id})")
        
        # ========================================
        # CREATE DIRECTORS
        # ========================================
        director_tech = User(
            name="Michael Chen",
            email="michael@bank.com",
            position="Director of Technology & Infrastructure",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        director_risk = User(
            name="Sarah Martinez",
            email="sarah@bank.com",
            position="Director of Risk & Compliance",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        director_ops = User(
            name="David Kumar",
            email="david@bank.com",
            position="Director of Operations",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        director_digital = User(
            name="Jennifer Lee",
            email="jennifer@bank.com",
            position="Director of Digital Banking",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        
        db.add_all([director_tech, director_risk, director_ops, director_digital])
        db.commit()
        
        # Assign directors to departments
        dept_tech.director_id = director_tech.id
        dept_risk.director_id = director_risk.id
        dept_ops.director_id = director_ops.id
        dept_digital.director_id = director_digital.id
        db.commit()
        
        print(f"✓ Assigned {director_tech.name} to {dept_tech.name}")
        print(f"✓ Assigned {director_risk.name} to {dept_risk.name}")
        print(f"✓ Assigned {director_ops.name} to {dept_ops.name}")
        print(f"✓ Assigned {director_digital.name} to {dept_digital.name}")
        
        # ========================================
        # CREATE EXECUTIVE & ADMIN
        # ========================================
        executive = User(
            name="Robert Thompson",
            email="robert@bank.com",
            position="Chief Executive Officer",
            role="executive",
            password_hash=hash_password("password123"),
            is_active=True
        )
        admin = User(
            name="Admin User",
            email="admin@bank.com",
            position="System Administrator",
            role="admin",
            password_hash=hash_password("password123"),
            is_active=True
        )
        db.add_all([executive, admin])
        db.commit()
        print(f"✓ Created executive: {executive.name} - {executive.position}")
        print(f"✓ Created admin: {admin.name}")
        
        # ========================================
        # CREATE TEAM MEMBERS
        # ========================================
        
        # Core Banking Systems Team
        users_core = [
            User(team_id=team_core.id, name="James Wilson", email="james@bank.com", 
                 position="Team Lead - Core Systems", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_core.id, name="Emma Brown", email="emma@bank.com", 
                 position="Senior Software Engineer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_core.id, name="Oliver Davis", email="oliver@bank.com", 
                 position="Software Engineer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_core.id, name="Sophia Taylor", email="sophia@bank.com", 
                 position="Database Administrator", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Cybersecurity Team
        users_security = [
            User(team_id=team_security.id, name="Alexander Morgan", email="alexander@bank.com", 
                 position="Security Team Lead", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_security.id, name="Isabella Clark", email="isabella@bank.com", 
                 position="Security Analyst", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_security.id, name="Ethan White", email="ethan@bank.com", 
                 position="Security Engineer", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Regulatory Compliance Team
        users_compliance = [
            User(team_id=team_compliance.id, name="Victoria Garcia", email="victoria@bank.com", 
                 position="Compliance Team Lead", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_compliance.id, name="Daniel Martinez", email="daniel@bank.com", 
                 position="Compliance Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_compliance.id, name="Grace Anderson", email="grace@bank.com", 
                 position="Regulatory Analyst", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Fraud Prevention Team
        users_fraud = [
            User(team_id=team_fraud.id, name="Lucas Thompson", email="lucas@bank.com", 
                 position="Fraud Prevention Lead", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_fraud.id, name="Mia Johnson", email="mia@bank.com", 
                 position="Fraud Analyst", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_fraud.id, name="Noah Williams", email="noah@bank.com", 
                 position="Risk Analyst", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Payment Processing Team
        users_payments = [
            User(team_id=team_payments.id, name="Ava Rodriguez", email="ava@bank.com", 
                 position="Payment Operations Lead", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_payments.id, name="William Chen", email="william@bank.com", 
                 position="Payment Processor", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_payments.id, name="Charlotte Kim", email="charlotte@bank.com", 
                 position="Operations Specialist", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Mobile Banking Team
        users_mobile = [
            User(team_id=team_mobile.id, name="Benjamin Lee", email="benjamin@bank.com", 
                 position="Mobile Team Lead", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_mobile.id, name="Amelia Patel", email="amelia@bank.com", 
                 position="Mobile Developer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_mobile.id, name="Henry Zhang", email="henry@bank.com", 
                 position="UX Designer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_mobile.id, name="Lily Santos", email="lily@bank.com", 
                 position="QA Engineer", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        all_users = users_core + users_security + users_compliance + users_fraud + users_payments + users_mobile
        db.add_all(all_users)
        db.commit()
        
        for user in all_users:
            db.refresh(user)
        
        print(f"✓ Created {len(all_users)} team members across 6 teams")
        
        # ========================================
        # CREATE OKRs, BAU, WORK ITEMS, AND TASKS
        # ========================================
        
        # Get team leads for easy reference
        james = users_core[0]      # Core Banking Lead
        alexander = users_security[0]  # Security Lead
        victoria = users_compliance[0]  # Compliance Lead
        lucas = users_fraud[0]     # Fraud Lead
        ava = users_payments[0]    # Payments Lead
        benjamin = users_mobile[0] # Mobile Lead
        
        # Get some members
        emma = users_core[1]
        oliver = users_core[2]
        sophia = users_core[3]
        isabella = users_security[1]
        ethan = users_security[2]
        daniel = users_compliance[1]
        
        # === CORE BANKING SYSTEMS TEAM ===
        print("\n--- Seeding Core Banking Systems Team ---")
        
        okr_core = OKR(
            team_id=team_core.id,
            quarter="Q1 2026",
            objective="Modernize Core Banking Infrastructure",
            is_active=True
        )
        db.add(okr_core)
        db.commit()
        db.refresh(okr_core)
        print(f"✓ Created OKR: {okr_core.objective}")
        
        key_results_core = [
            KeyResult(
                okr_id=okr_core.id,
                description="Migrate 5 critical services to cloud",
                base_value=Decimal("0"),
                target_value=Decimal("5"),
                current_value=Decimal("2"),
                unit="services",
                weight=Decimal("0.40")
            ),
            KeyResult(
                okr_id=okr_core.id,
                description="Reduce system downtime by 50%",
                base_value=Decimal("4"),
                target_value=Decimal("2"),
                current_value=Decimal("0.8"),
                unit="hours/month",
                weight=Decimal("0.30")
            ),
            KeyResult(
                okr_id=okr_core.id,
                description="Deploy new API gateway",
                base_value=Decimal("0"),
                target_value=Decimal("100"),
                current_value=Decimal("65"),
                unit="%",
                weight=Decimal("0.30")
            ),
        ]
        db.add_all(key_results_core)
        db.commit()
        print(f"✓ Created {len(key_results_core)} key results")
        
        for kr in key_results_core:
            db.refresh(kr)
        
        bau_core = [
            BAUActivity(
                team_id=team_core.id,
                name="System Maintenance",
                description="Regular system updates and maintenance",
                is_active=True
            ),
            BAUActivity(
                team_id=team_core.id,
                name="Database Management",
                description="Database optimization and monitoring",
                is_active=True
            ),
        ]
        db.add_all(bau_core)
        db.commit()
        print(f"✓ Created {len(bau_core)} BAU activities")
        
        for bau in bau_core:
            db.refresh(bau)
        
        metrics_core = [
            BAUMetric(
                bau_activity_id=bau_core[0].id,
                name="System Uptime",
                target_value=Decimal("99.9"),
                current_value=Decimal("99.7"),
                unit="%",
                weight=Decimal("0.6"),
                metric_type="Higher is Better"
            ),
            BAUMetric(
                bau_activity_id=bau_core[0].id,
                name="Incident Response Time",
                target_value=Decimal("30"),
                current_value=Decimal("35"),
                unit="minutes",
                weight=Decimal("0.4"),
                metric_type="Lower is Better"
            ),
            BAUMetric(
                bau_activity_id=bau_core[1].id,
                name="Database Performance",
                target_value=Decimal("95"),
                current_value=Decimal("92"),
                unit="%",
                weight=Decimal("0.5"),
                metric_type="Higher is Better"
            ),
        ]
        db.add_all(metrics_core)
        db.commit()
        print(f"✓ Created {len(metrics_core)} BAU metrics")
        
        # === CYBERSECURITY TEAM ===
        print("\n--- Seeding Cybersecurity Team ---")
        
        okr_security = OKR(
            team_id=team_security.id,
            quarter="Q1 2026",
            objective="Enhance Security Posture and Threat Detection",
            is_active=True
        )
        db.add(okr_security)
        db.commit()
        db.refresh(okr_security)
        print(f"✓ Created OKR: {okr_security.objective}")
        
        key_results_security = [
            KeyResult(
                okr_id=okr_security.id,
                description="Implement zero-trust architecture",
                base_value=Decimal("0"),
                target_value=Decimal("100"),
                current_value=Decimal("45"),
                unit="%",
                weight=Decimal("0.60")
            ),
            KeyResult(
                okr_id=okr_security.id,
                description="Reduce security incidents by 40%",
                base_value=Decimal("20"),
                target_value=Decimal("10"),
                current_value=Decimal("12"),
                unit="incidents/month",
                weight=Decimal("0.40")
            ),
        ]
        db.add_all(key_results_security)
        db.commit()
        print(f"✓ Created {len(key_results_security)} key results")
        
        for kr in key_results_security:
            db.refresh(kr)
        
        bau_security = [
            BAUActivity(
                team_id=team_security.id,
                name="Threat Monitoring",
                description="24/7 security threat monitoring and response",
                is_active=True
            ),
        ]
        db.add_all(bau_security)
        db.commit()
        print(f"✓ Created {len(bau_security)} BAU activities")
        
        for bau in bau_security:
            db.refresh(bau)
        
        metrics_security = [
            BAUMetric(
                bau_activity_id=bau_security[0].id,
                name="Threat Detection Rate",
                target_value=Decimal("95"),
                current_value=Decimal("93"),
                unit="%",
                weight=Decimal("0.7"),
                metric_type="Higher is Better"
            ),
        ]
        db.add_all(metrics_security)
        db.commit()
        print(f"✓ Created {len(metrics_security)} BAU metrics")
        
        # === MOBILE BANKING TEAM ===
        print("\n--- Seeding Mobile Banking Team ---")
        
        okr_mobile = OKR(
            team_id=team_mobile.id,
            quarter="Q1 2026",
            objective="Launch Next-Gen Mobile Banking App",
            is_active=True
        )
        db.add(okr_mobile)
        db.commit()
        db.refresh(okr_mobile)
        print(f"✓ Created OKR: {okr_mobile.objective}")
        
        key_results_mobile = [
            KeyResult(
                okr_id=okr_mobile.id,
                description="Achieve 4.5+ star app rating",
                base_value=Decimal("4.0"),
                target_value=Decimal("4.5"),
                current_value=Decimal("4.2"),
                unit="stars",
                weight=Decimal("0.50")
            ),
            KeyResult(
                okr_id=okr_mobile.id,
                description="Reach 50K active monthly users",
                base_value=Decimal("25000"),
                target_value=Decimal("50000"),
                current_value=Decimal("35000"),
                unit="users",
                weight=Decimal("0.50")
            ),
        ]
        db.add_all(key_results_mobile)
        db.commit()
        print(f"✓ Created {len(key_results_mobile)} key results")
        
        for kr in key_results_mobile:
            db.refresh(kr)
        
        bau_mobile = [
            BAUActivity(
                team_id=team_mobile.id,
                name="App Performance Monitoring",
                description="Monitor and optimize mobile app performance",
                is_active=True
            ),
        ]
        db.add_all(bau_mobile)
        db.commit()
        print(f"✓ Created {len(bau_mobile)} BAU activities")
        
        for bau in bau_mobile:
            db.refresh(bau)
        
        metrics_mobile = [
            BAUMetric(
                bau_activity_id=bau_mobile[0].id,
                name="App Crash Rate",
                target_value=Decimal("0.5"),
                current_value=Decimal("0.8"),
                unit="%",
                weight=Decimal("0.6"),
                metric_type="Lower is Better"
            ),
            BAUMetric(
                bau_activity_id=bau_mobile[0].id,
                name="App Load Time",
                target_value=Decimal("2"),
                current_value=Decimal("2.5"),
                unit="seconds",
                weight=Decimal("0.4"),
                metric_type="Lower is Better"
            ),
        ]
        db.add_all(metrics_mobile)
        db.commit()
        print(f"✓ Created {len(metrics_mobile)} BAU metrics")
        
        # === MONTHLY HEADS-UP ===
        print("\n--- Creating Monthly Heads-Up ---")
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        
        headsups = [
            MonthlyHeadsUp(team_id=team_core.id, month=current_month, description="Focus on cloud migration and stability"),
            MonthlyHeadsUp(team_id=team_security.id, month=current_month, description="Enhance zero-trust infrastructure"),
            MonthlyHeadsUp(team_id=team_mobile.id, month=current_month, description="Improve UX and performance"),
        ]
        db.add_all(headsups)
        db.commit()
        for h in headsups:
            db.refresh(h)
        
        # === WORK ITEMS ===
        print("\n--- Creating Work Items ---")
        
        work_items_core = [
            WorkItem(
                team_id=team_core.id,
                monthly_headsup_id=headsups[0].id,
                title="Migrate authentication service to cloud",
                description="Move auth service to AWS infrastructure",
                source_type="OKR",
                source_id=key_results_core[0].id,
                owner_id=james.id
            ),
            WorkItem(
                team_id=team_core.id,
                monthly_headsup_id=headsups[0].id,
                title="Implement auto-failover system",
                description="Setup automatic failover for critical services",
                source_type="OKR",
                source_id=key_results_core[1].id,
                owner_id=emma.id
            ),
            WorkItem(
                team_id=team_core.id,
                monthly_headsup_id=headsups[0].id,
                title="Monthly database optimization",
                description="Optimize database queries and indexes",
                source_type="BAU",
                source_id=bau_core[1].id,
                owner_id=sophia.id
            ),
        ]
        
        work_items_security = [
            WorkItem(
                team_id=team_security.id,
                monthly_headsup_id=headsups[1].id,
                title="Deploy zero-trust network controls",
                description="Implement network segmentation and access controls",
                source_type="OKR",
                source_id=key_results_security[0].id,
                owner_id=alexander.id
            ),
        ]
        
        work_items_mobile = [
            WorkItem(
                team_id=team_mobile.id,
                monthly_headsup_id=headsups[2].id,
                title="Optimize app performance",
                description="Reduce app load time and crash rate",
                source_type="OKR",
                source_id=key_results_mobile[0].id,
                owner_id=benjamin.id
            ),
        ]
        
        all_work_items = work_items_core + work_items_security + work_items_mobile
        db.add_all(all_work_items)
        db.commit()
        print(f"✓ Created {len(all_work_items)} work items")
        
        for wi in all_work_items:
            db.refresh(wi)
        
        # === WEEKLY PRIORITY PLANS ===
        print("\n--- Creating Weekly Priority Plans ---")
        
        current_week = datetime.now(timezone.utc).strftime("%Y-W%U")
        
        plans = [
             WeeklyPriorityPlan(monthly_headsup_id=headsups[0].id, week=current_week, week_focus="Authentication system migration"),
             WeeklyPriorityPlan(monthly_headsup_id=headsups[1].id, week=current_week, week_focus="Security infra deployment"),
             WeeklyPriorityPlan(monthly_headsup_id=headsups[2].id, week=current_week, week_focus="App performance improvements"),
        ]
        db.add_all(plans)
        db.commit()
        for p in plans:
            db.refresh(p)
            
        # === WEEKLY PRIORITIES ===
        priorities = [
            WeeklyPriority(
                plan_id=plans[0].id,
                work_item_id=work_items_core[0].id,
                priority=1
            ),
            WeeklyPriority(
                plan_id=plans[1].id,
                work_item_id=work_items_security[0].id,
                priority=1
            ),
        ]
        db.add_all(priorities)
        db.commit()
        print(f"✓ Created {len(priorities)} weekly priorities")
        
        # === TASKS ===
        print("\n--- Creating Tasks ---")
        
        tasks_core = [
            Task(
                work_item_id=work_items_core[0].id,
                description="Setup AWS infrastructure",
                assignee_id=oliver.id,
                status="Done",
                effort_hours=8,
                completed_at=datetime.now(timezone.utc) - timedelta(days=3)
            ),
            Task(
                work_item_id=work_items_core[0].id,
                description="Configure authentication service",
                assignee_id=emma.id,
                status="In Progress",
                effort_hours=12
            ),
            Task(
                work_item_id=work_items_core[0].id,
                description="Run integration tests",
                assignee_id=sophia.id,
                status="Not Started",
                effort_hours=6
            ),
            Task(
                work_item_id=work_items_core[1].id,
                description="Design failover architecture",
                assignee_id=james.id,
                status="Done",
                effort_hours=10,
                completed_at=datetime.now(timezone.utc) - timedelta(days=2)
            ),
            Task(
                work_item_id=work_items_core[1].id,
                description="Implement failover logic",
                assignee_id=emma.id,
                status="In Progress",
                effort_hours=16
            ),
        ]
        
        tasks_security = [
            Task(
                work_item_id=work_items_security[0].id,
                description="Audit current network architecture",
                assignee_id=isabella.id,
                status="Done",
                effort_hours=12,
                completed_at=datetime.now(timezone.utc) - timedelta(days=4)
            ),
            Task(
                work_item_id=work_items_security[0].id,
                description="Implement network segmentation",
                assignee_id=ethan.id,
                status="In Progress",
                effort_hours=20
            ),
        ]
        
        all_tasks = tasks_core + tasks_security
        db.add_all(all_tasks)
        db.commit()
        print(f"✓ Created {len(all_tasks)} tasks")
        
        db.commit()
        print(f"\n✅ Database seeded successfully!")
        print(f"\n{'='*60}")
        print(f"LOGIN CREDENTIALS (All passwords: password123)")
        print(f"{'='*60}")
        print(f"\n👤 EXECUTIVE:")
        print(f"   Email: robert@bank.com")
        print(f"   Role: Chief Executive Officer")
        
        print(f"\n👤 DIRECTORS:")
        print(f"   Email: michael@bank.com  (Director of Technology & Infrastructure)")
        print(f"   Email: sarah@bank.com    (Director of Risk & Compliance)")
        print(f"   Email: david@bank.com    (Director of Operations)")
        print(f"   Email: jennifer@bank.com (Director of Digital Banking)")
        
        print(f"\n👤 TEAM LEADS:")
        print(f"   Email: james@bank.com     (Core Banking Systems)")
        print(f"   Email: alexander@bank.com (Cybersecurity)")
        print(f"   Email: victoria@bank.com  (Regulatory Compliance)")
        print(f"   Email: lucas@bank.com     (Fraud Prevention)")
        print(f"   Email: ava@bank.com       (Payment Processing)")
        print(f"   Email: benjamin@bank.com  (Mobile Banking)")
        
        print(f"\n👤 ADMIN:")
        print(f"   Email: admin@bank.com")
        print(f"{'='*60}\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding Compass database with demo data...\n")
    seed_demo_data()

