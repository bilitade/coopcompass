"""Script to seed comprehensive demo data into the database."""

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
    """Seed the database with comprehensive demo data."""
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
        
        print("✓ Cleared existing data\n")
        
        # ========================================
        # CREATE BANKING DEPARTMENTS
        # ========================================
        print("=" * 60)
        print("CREATING DEPARTMENTS")
        print("=" * 60)
        
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
        
        print(f"✓ {dept_tech.name}")
        print(f"✓ {dept_risk.name}")
        print(f"✓ {dept_ops.name}")
        print(f"✓ {dept_digital.name}\n")
        
        # ========================================
        # CREATE TEAMS WITH DESCRIPTIONS
        # ========================================
        print("=" * 60)
        print("CREATING TEAMS")
        print("=" * 60)
        
        team_core = Team(
            name="Core Banking Systems",
            department_id=dept_tech.id,
            description="Maintains and enhances core banking infrastructure, transaction processing systems, and database management"
        )
        team_security = Team(
            name="Cybersecurity",
            department_id=dept_tech.id,
            description="Protects bank infrastructure from cyber threats, implements security controls, and monitors security incidents"
        )
        team_compliance = Team(
            name="Regulatory Compliance",
            department_id=dept_risk.id,
            description="Ensures adherence to banking regulations, conducts compliance audits, and manages regulatory reporting"
        )
        team_fraud = Team(
            name="Fraud Prevention",
            department_id=dept_risk.id,
            description="Detects and prevents fraudulent transactions, monitors suspicious activities, and implements fraud detection systems"
        )
        team_payments = Team(
            name="Payment Processing",
            department_id=dept_ops.id,
            description="Processes payment transactions, manages payment gateways, and ensures payment system reliability"
        )
        team_mobile = Team(
            name="Mobile Banking",
            department_id=dept_digital.id,
            description="Develops and maintains mobile banking applications, enhances user experience, and drives mobile adoption"
        )
        
        db.add_all([team_core, team_security, team_compliance, team_fraud, team_payments, team_mobile])
        db.commit()
        
        for team in [team_core, team_security, team_compliance, team_fraud, team_payments, team_mobile]:
            db.refresh(team)
            print(f"✓ {team.name} ({team.department.name})")
        
        print()
        
        # ========================================
        # CREATE DIRECTORS
        # ========================================
        print("=" * 60)
        print("CREATING DIRECTORS")
        print("=" * 60)
        
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
        
        print(f"✓ {director_tech.name} → {dept_tech.name}")
        print(f"✓ {director_risk.name} → {dept_risk.name}")
        print(f"✓ {director_ops.name} → {dept_ops.name}")
        print(f"✓ {director_digital.name} → {dept_digital.name}\n")
        
        # ========================================
        # CREATE EXECUTIVE & ADMIN
        # ========================================
        print("=" * 60)
        print("CREATING EXECUTIVE & ADMIN")
        print("=" * 60)
        
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
        
        print(f"✓ {executive.name} ({executive.position})")
        print(f"✓ {admin.name}\n")
        
        # ========================================
        # CREATE TEAM MEMBERS
        # ========================================
        print("=" * 60)
        print("CREATING TEAM MEMBERS")
        print("=" * 60)
        
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
        
        print(f"✓ Created {len(all_users)} team members across 6 teams\n")
        
        # Get team leads for easy reference
        james = users_core[0]      # Core Banking Lead
        alexander = users_security[0]  # Security Lead
        victoria = users_compliance[0]  # Compliance Lead
        lucas = users_fraud[0]     # Fraud Lead
        ava = users_payments[0]    # Payments Lead
        benjamin = users_mobile[0] # Mobile Lead
        
        # Get some members for task assignment
        emma = users_core[1]
        oliver = users_core[2]
        sophia = users_core[3]
        isabella = users_security[1]
        ethan = users_security[2]
        daniel = users_compliance[1]
        grace = users_compliance[2]
        mia = users_fraud[1]
        noah = users_fraud[2]
        william = users_payments[1]
        charlotte = users_payments[2]
        amelia = users_mobile[1]
        henry = users_mobile[2]
        lily = users_mobile[3]
        
        # ========================================
        # CREATE OKRs FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING OKRs")
        print("=" * 60)
        
        # Core Banking Systems OKR
        okr_core = OKR(
            team_id=team_core.id,
            quarter="Q1 2026",
            objective="Modernize Core Banking Infrastructure",
            is_active=True
        )
        db.add(okr_core)
        db.commit()
        db.refresh(okr_core)
        
        key_results_core = [
            KeyResult(okr_id=okr_core.id, description="Migrate 5 critical services to cloud", base_value=Decimal("0"), target_value=Decimal("5"), current_value=Decimal("2"), unit="services", weight=Decimal("0.40")),
            KeyResult(okr_id=okr_core.id, description="Reduce system downtime by 50%", base_value=Decimal("4"), target_value=Decimal("2"), current_value=Decimal("0.8"), unit="hours/month", weight=Decimal("0.30")),
            KeyResult(okr_id=okr_core.id, description="Deploy new API gateway", base_value=Decimal("0"), target_value=Decimal("100"), current_value=Decimal("65"), unit="%", weight=Decimal("0.30")),
        ]
        db.add_all(key_results_core)
        db.commit()
        print(f"✓ {team_core.name}: {okr_core.objective} ({len(key_results_core)} KRs)")
        
        # Cybersecurity OKR
        okr_security = OKR(
            team_id=team_security.id,
            quarter="Q1 2026",
            objective="Enhance Security Posture and Threat Detection",
            is_active=True
        )
        db.add(okr_security)
        db.commit()
        db.refresh(okr_security)
        
        key_results_security = [
            KeyResult(okr_id=okr_security.id, description="Implement zero-trust architecture", base_value=Decimal("0"), target_value=Decimal("100"), current_value=Decimal("45"), unit="%", weight=Decimal("0.60")),
            KeyResult(okr_id=okr_security.id, description="Reduce security incidents by 40%", base_value=Decimal("20"), target_value=Decimal("10"), current_value=Decimal("12"), unit="incidents/month", weight=Decimal("0.40")),
        ]
        db.add_all(key_results_security)
        db.commit()
        print(f"✓ {team_security.name}: {okr_security.objective} ({len(key_results_security)} KRs)")
        
        # Regulatory Compliance OKR
        okr_compliance = OKR(
            team_id=team_compliance.id,
            quarter="Q1 2026",
            objective="Strengthen Regulatory Compliance Framework",
            is_active=True
        )
        db.add(okr_compliance)
        db.commit()
        db.refresh(okr_compliance)
        
        key_results_compliance = [
            KeyResult(okr_id=okr_compliance.id, description="Complete 100% of regulatory audits on time", base_value=Decimal("85"), target_value=Decimal("100"), current_value=Decimal("95"), unit="%", weight=Decimal("0.50")),
            KeyResult(okr_id=okr_compliance.id, description="Reduce compliance violations by 60%", base_value=Decimal("10"), target_value=Decimal("4"), current_value=Decimal("6"), unit="violations/quarter", weight=Decimal("0.50")),
        ]
        db.add_all(key_results_compliance)
        db.commit()
        print(f"✓ {team_compliance.name}: {okr_compliance.objective} ({len(key_results_compliance)} KRs)")
        
        # Fraud Prevention OKR
        okr_fraud = OKR(
            team_id=team_fraud.id,
            quarter="Q1 2026",
            objective="Enhance Fraud Detection and Prevention",
            is_active=True
        )
        db.add(okr_fraud)
        db.commit()
        db.refresh(okr_fraud)
        
        key_results_fraud = [
            KeyResult(okr_id=okr_fraud.id, description="Improve fraud detection rate to 98%", base_value=Decimal("92"), target_value=Decimal("98"), current_value=Decimal("95"), unit="%", weight=Decimal("0.60")),
            KeyResult(okr_id=okr_fraud.id, description="Reduce false positives by 30%", base_value=Decimal("15"), target_value=Decimal("10.5"), current_value=Decimal("12"), unit="%", weight=Decimal("0.40")),
        ]
        db.add_all(key_results_fraud)
        db.commit()
        print(f"✓ {team_fraud.name}: {okr_fraud.objective} ({len(key_results_fraud)} KRs)")
        
        # Payment Processing OKR
        okr_payments = OKR(
            team_id=team_payments.id,
            quarter="Q1 2026",
            objective="Optimize Payment Processing Performance",
            is_active=True
        )
        db.add(okr_payments)
        db.commit()
        db.refresh(okr_payments)
        
        key_results_payments = [
            KeyResult(okr_id=okr_payments.id, description="Process 99.9% of payments within 2 seconds", base_value=Decimal("98"), target_value=Decimal("99.9"), current_value=Decimal("99.5"), unit="%", weight=Decimal("0.50")),
            KeyResult(okr_id=okr_payments.id, description="Reduce payment failures by 50%", base_value=Decimal("2"), target_value=Decimal("1"), current_value=Decimal("1.5"), unit="%", weight=Decimal("0.50")),
        ]
        db.add_all(key_results_payments)
        db.commit()
        print(f"✓ {team_payments.name}: {okr_payments.objective} ({len(key_results_payments)} KRs)")
        
        # Mobile Banking OKR
        okr_mobile = OKR(
            team_id=team_mobile.id,
            quarter="Q1 2026",
            objective="Launch Next-Gen Mobile Banking App",
            is_active=True
        )
        db.add(okr_mobile)
        db.commit()
        db.refresh(okr_mobile)
        
        key_results_mobile = [
            KeyResult(okr_id=okr_mobile.id, description="Achieve 4.5+ star app rating", base_value=Decimal("4.0"), target_value=Decimal("4.5"), current_value=Decimal("4.2"), unit="stars", weight=Decimal("0.50")),
            KeyResult(okr_id=okr_mobile.id, description="Reach 50K active monthly users", base_value=Decimal("25000"), target_value=Decimal("50000"), current_value=Decimal("35000"), unit="users", weight=Decimal("0.50")),
        ]
        db.add_all(key_results_mobile)
        db.commit()
        print(f"✓ {team_mobile.name}: {okr_mobile.objective} ({len(key_results_mobile)} KRs)\n")
        
        # Refresh all key results
        all_key_results = key_results_core + key_results_security + key_results_compliance + key_results_fraud + key_results_payments + key_results_mobile
        for kr in all_key_results:
            db.refresh(kr)
        
        # ========================================
        # CREATE BAU ACTIVITIES FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING BAU ACTIVITIES")
        print("=" * 60)
        
        bau_core = [
            BAUActivity(team_id=team_core.id, name="System Maintenance", description="Regular system updates and maintenance", is_active=True),
            BAUActivity(team_id=team_core.id, name="Database Management", description="Database optimization and monitoring", is_active=True),
        ]
        db.add_all(bau_core)
        db.commit()
        for bau in bau_core:
            db.refresh(bau)
        
        bau_security = [
            BAUActivity(team_id=team_security.id, name="Threat Monitoring", description="24/7 security threat monitoring and response", is_active=True),
            BAUActivity(team_id=team_security.id, name="Security Audits", description="Regular security audits and vulnerability assessments", is_active=True),
        ]
        db.add_all(bau_security)
        db.commit()
        for bau in bau_security:
            db.refresh(bau)
        
        bau_compliance = [
            BAUActivity(team_id=team_compliance.id, name="Regulatory Reporting", description="Monthly and quarterly regulatory reports", is_active=True),
            BAUActivity(team_id=team_compliance.id, name="Compliance Training", description="Conduct compliance training sessions", is_active=True),
        ]
        db.add_all(bau_compliance)
        db.commit()
        for bau in bau_compliance:
            db.refresh(bau)
        
        bau_fraud = [
            BAUActivity(team_id=team_fraud.id, name="Transaction Monitoring", description="Real-time transaction monitoring for fraud detection", is_active=True),
            BAUActivity(team_id=team_fraud.id, name="Fraud Investigation", description="Investigate and resolve fraud cases", is_active=True),
        ]
        db.add_all(bau_fraud)
        db.commit()
        for bau in bau_fraud:
            db.refresh(bau)
        
        bau_payments = [
            BAUActivity(team_id=team_payments.id, name="Payment Gateway Management", description="Manage and monitor payment gateways", is_active=True),
            BAUActivity(team_id=team_payments.id, name="Transaction Reconciliation", description="Daily transaction reconciliation", is_active=True),
        ]
        db.add_all(bau_payments)
        db.commit()
        for bau in bau_payments:
            db.refresh(bau)
        
        bau_mobile = [
            BAUActivity(team_id=team_mobile.id, name="App Performance Monitoring", description="Monitor and optimize mobile app performance", is_active=True),
            BAUActivity(team_id=team_mobile.id, name="User Support", description="Handle user support tickets and issues", is_active=True),
        ]
        db.add_all(bau_mobile)
        db.commit()
        for bau in bau_mobile:
            db.refresh(bau)
        
        print(f"✓ {team_core.name}: {len(bau_core)} activities")
        print(f"✓ {team_security.name}: {len(bau_security)} activities")
        print(f"✓ {team_compliance.name}: {len(bau_compliance)} activities")
        print(f"✓ {team_fraud.name}: {len(bau_fraud)} activities")
        print(f"✓ {team_payments.name}: {len(bau_payments)} activities")
        print(f"✓ {team_mobile.name}: {len(bau_mobile)} activities\n")
        
        # ========================================
        # CREATE BAU METRICS
        # ========================================
        print("=" * 60)
        print("CREATING BAU METRICS")
        print("=" * 60)
        
        metrics_core = [
            BAUMetric(bau_activity_id=bau_core[0].id, name="System Uptime", target_value=Decimal("99.9"), current_value=Decimal("99.7"), unit="%", weight=Decimal("0.6"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_core[0].id, name="Incident Response Time", target_value=Decimal("30"), current_value=Decimal("35"), unit="minutes", weight=Decimal("0.4"), metric_type="Lower is Better"),
            BAUMetric(bau_activity_id=bau_core[1].id, name="Database Performance", target_value=Decimal("95"), current_value=Decimal("92"), unit="%", weight=Decimal("0.5"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_core)
        db.commit()
        
        metrics_security = [
            BAUMetric(bau_activity_id=bau_security[0].id, name="Threat Detection Rate", target_value=Decimal("95"), current_value=Decimal("93"), unit="%", weight=Decimal("0.7"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_security[1].id, name="Vulnerability Resolution Time", target_value=Decimal("48"), current_value=Decimal("55"), unit="hours", weight=Decimal("0.3"), metric_type="Lower is Better"),
        ]
        db.add_all(metrics_security)
        db.commit()
        
        metrics_compliance = [
            BAUMetric(bau_activity_id=bau_compliance[0].id, name="Report Timeliness", target_value=Decimal("100"), current_value=Decimal("98"), unit="%", weight=Decimal("0.6"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_compliance[1].id, name="Training Completion Rate", target_value=Decimal("95"), current_value=Decimal("92"), unit="%", weight=Decimal("0.4"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_compliance)
        db.commit()
        
        metrics_fraud = [
            BAUMetric(bau_activity_id=bau_fraud[0].id, name="Detection Accuracy", target_value=Decimal("98"), current_value=Decimal("95"), unit="%", weight=Decimal("0.7"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_fraud[1].id, name="Case Resolution Time", target_value=Decimal("24"), current_value=Decimal("28"), unit="hours", weight=Decimal("0.3"), metric_type="Lower is Better"),
        ]
        db.add_all(metrics_fraud)
        db.commit()
        
        metrics_payments = [
            BAUMetric(bau_activity_id=bau_payments[0].id, name="Gateway Uptime", target_value=Decimal("99.95"), current_value=Decimal("99.9"), unit="%", weight=Decimal("0.5"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_payments[1].id, name="Reconciliation Accuracy", target_value=Decimal("100"), current_value=Decimal("99.8"), unit="%", weight=Decimal("0.5"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_payments)
        db.commit()
        
        metrics_mobile = [
            BAUMetric(bau_activity_id=bau_mobile[0].id, name="App Crash Rate", target_value=Decimal("0.5"), current_value=Decimal("0.8"), unit="%", weight=Decimal("0.6"), metric_type="Lower is Better"),
            BAUMetric(bau_activity_id=bau_mobile[0].id, name="App Load Time", target_value=Decimal("2"), current_value=Decimal("2.5"), unit="seconds", weight=Decimal("0.4"), metric_type="Lower is Better"),
        ]
        db.add_all(metrics_mobile)
        db.commit()
        
        print(f"✓ Created metrics for all teams\n")
        
        # ========================================
        # CREATE MONTHLY HEADS-UP FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING MONTHLY HEADS-UP")
        print("=" * 60)
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        
        headsup_core = MonthlyHeadsUp(team_id=team_core.id, month=current_month, description="Focus on cloud migration and system stability improvements")
        headsup_security = MonthlyHeadsUp(team_id=team_security.id, month=current_month, description="Enhance zero-trust infrastructure and security monitoring")
        headsup_compliance = MonthlyHeadsUp(team_id=team_compliance.id, month=current_month, description="Complete Q1 regulatory audits and compliance training")
        headsup_fraud = MonthlyHeadsUp(team_id=team_fraud.id, month=current_month, description="Improve fraud detection algorithms and reduce false positives")
        headsup_payments = MonthlyHeadsUp(team_id=team_payments.id, month=current_month, description="Optimize payment processing speed and reliability")
        headsup_mobile = MonthlyHeadsUp(team_id=team_mobile.id, month=current_month, description="Improve UX, performance, and prepare for app launch")
        
        all_headsups = [headsup_core, headsup_security, headsup_compliance, headsup_fraud, headsup_payments, headsup_mobile]
        db.add_all(all_headsups)
        db.commit()
        for h in all_headsups:
            db.refresh(h)
        
        print(f"✓ Created monthly heads-up for all 6 teams\n")
        
        # ========================================
        # CREATE WORK ITEMS FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING WORK ITEMS")
        print("=" * 60)
        
        work_items_core = [
            WorkItem(team_id=team_core.id, monthly_headsup_id=headsup_core.id, title="Migrate authentication service to cloud", description="Move auth service to AWS infrastructure", source_type="OKR", source_id=key_results_core[0].id, owner_id=james.id, status="In Progress"),
            WorkItem(team_id=team_core.id, monthly_headsup_id=headsup_core.id, title="Implement auto-failover system", description="Setup automatic failover for critical services", source_type="OKR", source_id=key_results_core[1].id, owner_id=emma.id, status="In Progress"),
            WorkItem(team_id=team_core.id, monthly_headsup_id=headsup_core.id, title="Deploy API gateway", description="Deploy and configure new API gateway", source_type="OKR", source_id=key_results_core[2].id, owner_id=oliver.id, status="Not Started"),
            WorkItem(team_id=team_core.id, monthly_headsup_id=headsup_core.id, title="Monthly database optimization", description="Optimize database queries and indexes", source_type="BAU", source_id=bau_core[1].id, owner_id=sophia.id, status="Not Started"),
        ]
        
        work_items_security = [
            WorkItem(team_id=team_security.id, monthly_headsup_id=headsup_security.id, title="Deploy zero-trust network controls", description="Implement network segmentation and access controls", source_type="OKR", source_id=key_results_security[0].id, owner_id=alexander.id, status="In Progress"),
            WorkItem(team_id=team_security.id, monthly_headsup_id=headsup_security.id, title="Enhance threat detection system", description="Improve security monitoring and incident response", source_type="OKR", source_id=key_results_security[1].id, owner_id=isabella.id, status="Not Started"),
            WorkItem(team_id=team_security.id, monthly_headsup_id=headsup_security.id, title="Conduct security audit", description="Perform quarterly security audit", source_type="BAU", source_id=bau_security[1].id, owner_id=ethan.id, status="Not Started"),
        ]
        
        work_items_compliance = [
            WorkItem(team_id=team_compliance.id, monthly_headsup_id=headsup_compliance.id, title="Complete Q1 regulatory audit", description="Finalize and submit Q1 regulatory audit report", source_type="OKR", source_id=key_results_compliance[0].id, owner_id=victoria.id, status="In Progress"),
            WorkItem(team_id=team_compliance.id, monthly_headsup_id=headsup_compliance.id, title="Review compliance violations", description="Analyze and address compliance violations", source_type="OKR", source_id=key_results_compliance[1].id, owner_id=daniel.id, status="Not Started"),
            WorkItem(team_id=team_compliance.id, monthly_headsup_id=headsup_compliance.id, title="Prepare regulatory reports", description="Prepare monthly regulatory reports", source_type="BAU", source_id=bau_compliance[0].id, owner_id=grace.id, status="Not Started"),
        ]
        
        work_items_fraud = [
            WorkItem(team_id=team_fraud.id, monthly_headsup_id=headsup_fraud.id, title="Upgrade fraud detection algorithms", description="Implement ML-based fraud detection improvements", source_type="OKR", source_id=key_results_fraud[0].id, owner_id=lucas.id, status="In Progress"),
            WorkItem(team_id=team_fraud.id, monthly_headsup_id=headsup_fraud.id, title="Reduce false positive rate", description="Optimize fraud detection to reduce false positives", source_type="OKR", source_id=key_results_fraud[1].id, owner_id=mia.id, status="Not Started"),
            WorkItem(team_id=team_fraud.id, monthly_headsup_id=headsup_fraud.id, title="Monitor transaction patterns", description="Daily monitoring of transaction patterns", source_type="BAU", source_id=bau_fraud[0].id, owner_id=noah.id, status="Not Started"),
        ]
        
        work_items_payments = [
            WorkItem(team_id=team_payments.id, monthly_headsup_id=headsup_payments.id, title="Optimize payment processing speed", description="Improve payment processing performance", source_type="OKR", source_id=key_results_payments[0].id, owner_id=ava.id, status="In Progress"),
            WorkItem(team_id=team_payments.id, monthly_headsup_id=headsup_payments.id, title="Reduce payment failures", description="Identify and fix payment failure causes", source_type="OKR", source_id=key_results_payments[1].id, owner_id=william.id, status="Not Started"),
            WorkItem(team_id=team_payments.id, monthly_headsup_id=headsup_payments.id, title="Daily transaction reconciliation", description="Perform daily payment reconciliation", source_type="BAU", source_id=bau_payments[1].id, owner_id=charlotte.id, status="Not Started"),
        ]
        
        work_items_mobile = [
            WorkItem(team_id=team_mobile.id, monthly_headsup_id=headsup_mobile.id, title="Improve app rating", description="Address user feedback and improve app features", source_type="OKR", source_id=key_results_mobile[0].id, owner_id=benjamin.id, status="In Progress"),
            WorkItem(team_id=team_mobile.id, monthly_headsup_id=headsup_mobile.id, title="Increase user acquisition", description="Marketing and feature improvements to grow user base", source_type="OKR", source_id=key_results_mobile[1].id, owner_id=amelia.id, status="Not Started"),
            WorkItem(team_id=team_mobile.id, monthly_headsup_id=headsup_mobile.id, title="Monitor app performance", description="Track and optimize app performance metrics", source_type="BAU", source_id=bau_mobile[0].id, owner_id=henry.id, status="Not Started"),
        ]
        
        all_work_items = work_items_core + work_items_security + work_items_compliance + work_items_fraud + work_items_payments + work_items_mobile
        db.add_all(all_work_items)
        db.commit()
        for wi in all_work_items:
            db.refresh(wi)
        
        print(f"✓ Created {len(all_work_items)} work items across all teams\n")
        
        # ========================================
        # CREATE WEEKLY PRIORITY PLANS
        # ========================================
        print("=" * 60)
        print("CREATING WEEKLY PRIORITY PLANS")
        print("=" * 60)
        
        current_week = datetime.now(timezone.utc).strftime("%Y-W%U")
        
        plans = [
            WeeklyPriorityPlan(monthly_headsup_id=headsup_core.id, week=current_week, week_focus="Authentication system migration and failover implementation"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_security.id, week=current_week, week_focus="Security infrastructure deployment and monitoring"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_compliance.id, week=current_week, week_focus="Regulatory audit completion and compliance review"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_fraud.id, week=current_week, week_focus="Fraud detection algorithm improvements"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_payments.id, week=current_week, week_focus="Payment processing optimization"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_mobile.id, week=current_week, week_focus="App performance improvements and UX enhancements"),
        ]
        db.add_all(plans)
        db.commit()
        for p in plans:
            db.refresh(p)
        
        print(f"✓ Created weekly priority plans for all teams\n")
        
        # ========================================
        # CREATE WEEKLY PRIORITIES
        # ========================================
        print("=" * 60)
        print("CREATING WEEKLY PRIORITIES")
        print("=" * 60)
        
        priorities = [
            WeeklyPriority(plan_id=plans[0].id, work_item_id=work_items_core[0].id, priority=1),
            WeeklyPriority(plan_id=plans[0].id, work_item_id=work_items_core[1].id, priority=2),
            WeeklyPriority(plan_id=plans[1].id, work_item_id=work_items_security[0].id, priority=1),
            WeeklyPriority(plan_id=plans[2].id, work_item_id=work_items_compliance[0].id, priority=1),
            WeeklyPriority(plan_id=plans[3].id, work_item_id=work_items_fraud[0].id, priority=1),
            WeeklyPriority(plan_id=plans[4].id, work_item_id=work_items_payments[0].id, priority=1),
            WeeklyPriority(plan_id=plans[5].id, work_item_id=work_items_mobile[0].id, priority=1),
        ]
        db.add_all(priorities)
        db.commit()
        
        print(f"✓ Created {len(priorities)} weekly priorities\n")
        
        # ========================================
        # CREATE TASKS FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING TASKS")
        print("=" * 60)
        
        tasks_core = [
            Task(work_item_id=work_items_core[0].id, title="Setup AWS Infrastructure", description="Setup AWS infrastructure for authentication service migration", assignee_id=oliver.id, status="Done", effort_hours=8, completed_at=datetime.now(timezone.utc) - timedelta(days=3)),
            Task(work_item_id=work_items_core[0].id, title="Configure Authentication Service", description="Configure authentication service on cloud infrastructure", assignee_id=emma.id, status="In Progress", effort_hours=12),
            Task(work_item_id=work_items_core[0].id, title="Run Integration Tests", description="Run integration tests for migrated authentication service", assignee_id=sophia.id, status="Not Started", effort_hours=6),
            Task(work_item_id=work_items_core[1].id, title="Design Failover Architecture", description="Design automatic failover architecture for critical services", assignee_id=james.id, status="Done", effort_hours=10, completed_at=datetime.now(timezone.utc) - timedelta(days=2)),
            Task(work_item_id=work_items_core[1].id, title="Implement Failover Logic", description="Implement failover logic and automatic switching mechanism", assignee_id=emma.id, status="In Progress", effort_hours=16),
            Task(work_item_id=work_items_core[2].id, title="Setup API Gateway", description="Setup and configure new API gateway infrastructure", assignee_id=oliver.id, status="Not Started", effort_hours=14),
        ]
        
        tasks_security = [
            Task(work_item_id=work_items_security[0].id, title="Audit Network Architecture", description="Audit current network architecture for zero-trust implementation", assignee_id=isabella.id, status="Done", effort_hours=12, completed_at=datetime.now(timezone.utc) - timedelta(days=4)),
            Task(work_item_id=work_items_security[0].id, title="Implement Network Segmentation", description="Implement network segmentation and access controls", assignee_id=ethan.id, status="In Progress", effort_hours=20),
            Task(work_item_id=work_items_security[1].id, title="Upgrade Threat Detection", description="Upgrade threat detection system with new algorithms", assignee_id=alexander.id, status="Not Started", effort_hours=18),
        ]
        
        tasks_compliance = [
            Task(work_item_id=work_items_compliance[0].id, title="Gather Audit Data", description="Collect and organize data for Q1 regulatory audit", assignee_id=daniel.id, status="Done", effort_hours=16, completed_at=datetime.now(timezone.utc) - timedelta(days=5)),
            Task(work_item_id=work_items_compliance[0].id, title="Prepare Audit Report", description="Prepare and review Q1 regulatory audit report", assignee_id=victoria.id, status="In Progress", effort_hours=12),
            Task(work_item_id=work_items_compliance[1].id, title="Analyze Violations", description="Analyze compliance violations and create action plan", assignee_id=grace.id, status="Not Started", effort_hours=10),
        ]
        
        tasks_fraud = [
            Task(work_item_id=work_items_fraud[0].id, title="Research ML Algorithms", description="Research and evaluate ML algorithms for fraud detection", assignee_id=mia.id, status="Done", effort_hours=14, completed_at=datetime.now(timezone.utc) - timedelta(days=6)),
            Task(work_item_id=work_items_fraud[0].id, title="Implement ML Model", description="Implement and test new ML-based fraud detection model", assignee_id=lucas.id, status="In Progress", effort_hours=22),
            Task(work_item_id=work_items_fraud[1].id, title="Optimize Detection Rules", description="Optimize fraud detection rules to reduce false positives", assignee_id=noah.id, status="Not Started", effort_hours=12),
        ]
        
        tasks_payments = [
            Task(work_item_id=work_items_payments[0].id, title="Performance Analysis", description="Analyze current payment processing performance", assignee_id=william.id, status="Done", effort_hours=8, completed_at=datetime.now(timezone.utc) - timedelta(days=3)),
            Task(work_item_id=work_items_payments[0].id, title="Optimize Payment Gateway", description="Optimize payment gateway configuration for better performance", assignee_id=ava.id, status="In Progress", effort_hours=16),
            Task(work_item_id=work_items_payments[1].id, title="Investigate Failures", description="Investigate root causes of payment failures", assignee_id=charlotte.id, status="Not Started", effort_hours=10),
        ]
        
        tasks_mobile = [
            Task(work_item_id=work_items_mobile[0].id, title="User Feedback Analysis", description="Analyze user feedback and identify improvement areas", assignee_id=henry.id, status="Done", effort_hours=10, completed_at=datetime.now(timezone.utc) - timedelta(days=4)),
            Task(work_item_id=work_items_mobile[0].id, title="Implement UX Improvements", description="Implement UX improvements based on user feedback", assignee_id=amelia.id, status="In Progress", effort_hours=20),
            Task(work_item_id=work_items_mobile[1].id, title="Marketing Campaign Planning", description="Plan marketing campaign to increase user acquisition", assignee_id=benjamin.id, status="Not Started", effort_hours=12),
            Task(work_item_id=work_items_mobile[2].id, title="Performance Monitoring Setup", description="Setup comprehensive app performance monitoring", assignee_id=lily.id, status="Not Started", effort_hours=8),
        ]
        
        all_tasks = tasks_core + tasks_security + tasks_compliance + tasks_fraud + tasks_payments + tasks_mobile
        db.add_all(all_tasks)
        db.commit()
        
        print(f"✓ Created {len(all_tasks)} tasks across all teams\n")
        
        db.commit()
        
        # ========================================
        # SUMMARY
        # ========================================
        print("=" * 60)
        print("✅ DATABASE SEEDED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\n📊 SUMMARY:")
        print(f"   • Departments: 4")
        print(f"   • Teams: 6 (all with descriptions)")
        print(f"   • Users: {len(all_users) + 6} (4 directors + 1 executive + 1 admin + {len(all_users)} team members)")
        print(f"   • OKRs: 6 (one per team)")
        print(f"   • Key Results: {len(all_key_results)}")
        print(f"   • BAU Activities: 12 (2 per team)")
        print(f"   • BAU Metrics: {len(metrics_core) + len(metrics_security) + len(metrics_compliance) + len(metrics_fraud) + len(metrics_payments) + len(metrics_mobile)}")
        print(f"   • Monthly Heads-Up: 6 (one per team)")
        print(f"   • Work Items: {len(all_work_items)}")
        print(f"   • Weekly Priority Plans: 6")
        print(f"   • Weekly Priorities: {len(priorities)}")
        print(f"   • Tasks: {len(all_tasks)}")
        
        print(f"\n{'='*60}")
        print(f"🔐 LOGIN CREDENTIALS (All passwords: password123)")
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
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding Compass database with comprehensive demo data...\n")
    seed_demo_data()
