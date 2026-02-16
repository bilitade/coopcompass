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
        
        dept_payment = Department(
            name="Payment Platform",
            description="ATM operations, card production, and payment processing services"
        )
        dept_core = Department(
            name="Core Banking System",
            description="T24 core banking application, system integration, and banking operations"
        )
        dept_district = Department(
            name="Central Finfine District",
            description="Branch operations, customer service, and district management"
        )
        
        db.add_all([dept_payment, dept_core, dept_district])
        db.commit()
        db.refresh(dept_payment)
        db.refresh(dept_core)
        db.refresh(dept_district)
        
        print(f"✓ {dept_payment.name}")
        print(f"✓ {dept_core.name}")
        print(f"✓ {dept_district.name}\n")
        
        # ========================================
        # CREATE TEAMS WITH DESCRIPTIONS
        # ========================================
        print("=" * 60)
        print("CREATING TEAMS")
        print("=" * 60)
        
        team_atm = Team(
            name="ATM Monitoring Team",
            department_id=dept_payment.id,
            description="Monitors ATM network performance, handles ATM maintenance, and ensures ATM availability and transaction processing"
        )
        team_card = Team(
            name="Card Production Team",
            department_id=dept_payment.id,
            description="Manages card production processes, handles card issuance, and ensures card quality and delivery"
        )
        team_t24 = Team(
            name="T24 Application Team",
            department_id=dept_core.id,
            description="Manages T24 core banking system, handles application administration, and ensures system stability"
        )
        team_integration = Team(
            name="Application Integration Team",
            department_id=dept_core.id,
            description="Develops and maintains system integrations, manages API connections, and ensures seamless data flow"
        )
        team_ijo = Team(
            name="Ijo Branch",
            department_id=dept_district.id,
            description="Branch operations, customer service, cash management, and local banking services"
        )
        
        db.add_all([team_atm, team_card, team_t24, team_integration, team_ijo])
        db.commit()
        
        for team in [team_atm, team_card, team_t24, team_integration, team_ijo]:
            db.refresh(team)
            print(f"✓ {team.name} ({team.department.name})")
        
        print()
        
        # ========================================
        # CREATE DIRECTORS
        # ========================================
        print("=" * 60)
        print("CREATING DIRECTORS")
        print("=" * 60)
        
        director_payment = User(
            name="Hailagegn Zerihun",
            email="hailagegn@bank.com",
            position="Director of Payment Platform",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        director_core = User(
            name="Samuel Kuma",
            email="samuel@bank.com",
            position="Director of Core Banking System",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        director_district = User(
            name="Iyob Shiferaw",
            email="iyob@bank.com",
            position="Director of Central Finfine District",
            role="director",
            password_hash=hash_password("password123"),
            is_active=True
        )
        
        db.add_all([director_payment, director_core, director_district])
        db.commit()
        
        # Assign directors to departments
        dept_payment.director_id = director_payment.id
        dept_core.director_id = director_core.id
        dept_district.director_id = director_district.id
        db.commit()
        
        print(f"✓ {director_payment.name} → {dept_payment.name}")
        print(f"✓ {director_core.name} → {dept_core.name}")
        print(f"✓ {director_district.name} → {dept_district.name}\n")
        
        # ========================================
        # CREATE EXECUTIVE & ADMIN
        # ========================================
        print("=" * 60)
        print("CREATING EXECUTIVE & ADMIN")
        print("=" * 60)
        
        ceo = User(
            name="Deribe Asfaw",
            email="deribe@bank.com",
            position="Chief Executive Officer",
            role="executive",
            password_hash=hash_password("password123"),
            is_active=True
        )
        cto = User(
            name="Aman Semir",
            email="aman@bank.com",
            position="Chief Transformation and Strategy Officer",
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
        db.add_all([ceo, cto, admin])
        db.commit()
        
        print(f"✓ {ceo.name} ({ceo.position})")
        print(f"✓ {cto.name} ({cto.position})")
        print(f"✓ {admin.name}\n")
        
        # ========================================
        # CREATE TEAM MEMBERS
        # ========================================
        print("=" * 60)
        print("CREATING TEAM MEMBERS")
        print("=" * 60)
        
        # ATM Monitoring Team
        users_atm = [
            User(team_id=team_atm.id, name="Zidan Mohammed", email="zidan@bank.com", 
                 position="Associate Card Banking Officer", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_atm.id, name="Motuma File", email="motuma@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_atm.id, name="Derartu Sisay", email="derartu@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_atm.id, name="Simon Kasahun", email="simon@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_atm.id, name="Roba Temesgen", email="roba@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_atm.id, name="Kebron Kebede", email="kebron@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Card Production Team
        users_card = [
            User(team_id=team_card.id, name="Birhanemeskel Mesfin", email="birhanemeskel@bank.com", 
                 position="Associate Card Banking Officer", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_card.id, name="Duresa Hedeto", email="duresa@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_card.id, name="Elasabeth Dawit", email="elasabeth@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_card.id, name="Isubalo Yirga", email="isubalo@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_card.id, name="Tomas Biyana", email="tomas@bank.com", 
                 position="Associate Card Banking Officer", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # T24 Application Team
        users_t24 = [
            User(team_id=team_t24.id, name="Regasa Alemu", email="regasa@bank.com", 
                 position="T24 Application Manager", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_t24.id, name="Kelil Harar", email="kelil@bank.com", 
                 position="Core Banking Application Administrator", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_t24.id, name="Ephrem Daniel", email="ephrem@bank.com", 
                 position="Core Banking Application Administrator", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_t24.id, name="Iyasu Refisa", email="iyasu@bank.com", 
                 position="Core Banking Application Administrator", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Application Integration Team
        users_integration = [
            User(team_id=team_integration.id, name="Tesfahun Semaw", email="tesfahun@bank.com", 
                 position="Manager – Application and Integration", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_integration.id, name="Tselotemariam Tadesse", email="tselotemariam@bank.com", 
                 position="Software Development and Integration Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_integration.id, name="Zelalem Zerfu", email="zelalem@bank.com", 
                 position="Software Development and Integration Officer", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        # Ijo Branch Team
        users_ijo = [
            User(team_id=team_ijo.id, name="Samson Tadele", email="samson@bank.com", 
                 position="Branch Manager", role="lead", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_ijo.id, name="Samrawit Abreham", email="samrawit@bank.com", 
                 position="Customer Service Officer", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_ijo.id, name="Korsa Galmesa", email="korsa@bank.com", 
                 position="Internal Controller", role="member", password_hash=hash_password("password123"), is_active=True),
            User(team_id=team_ijo.id, name="Tesfaye Tafa", email="tesfaye@bank.com", 
                 position="Chief Cashier", role="member", password_hash=hash_password("password123"), is_active=True),
        ]
        
        all_users = users_atm + users_card + users_t24 + users_integration + users_ijo
        db.add_all(all_users)
        db.commit()
        
        for user in all_users:
            db.refresh(user)
        
        print(f"✓ Created {len(all_users)} team members across 5 teams\n")
        
        # Get team leads for easy reference
        zidan = users_atm[0]           # ATM Monitoring Lead
        birhanemeskel = users_card[0]  # Card Production Lead
        regasa = users_t24[0]          # T24 Application Lead
        tesfahun = users_integration[0] # Application Integration Lead
        samson = users_ijo[0]          # Ijo Branch Lead
        
        # Get some members for task assignment
        motuma = users_atm[1]
        derartu = users_atm[2]
        simon = users_atm[3]
        roba = users_atm[4]
        kebron = users_atm[5]
        duresa = users_card[1]
        elasabeth = users_card[2]
        isubalo = users_card[3]
        tomas = users_card[4]
        kelil = users_t24[1]
        ephrem = users_t24[2]
        iyasu = users_t24[3]
        tselotemariam = users_integration[1]
        zelalem = users_integration[2]
        samrawit = users_ijo[1]
        korsa = users_ijo[2]
        tesfaye = users_ijo[3]
        
        # ========================================
        # CREATE OKRs FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING OKRs")
        print("=" * 60)
        
        # ATM Monitoring Team OKR
        okr_atm = OKR(
            team_id=team_atm.id,
            quarter="Q1 2026",
            objective="Enhance ATM Network Reliability and Performance",
            is_active=True
        )
        db.add(okr_atm)
        db.commit()
        db.refresh(okr_atm)
        
        key_results_atm = [
            KeyResult(okr_id=okr_atm.id, description="Achieve 99.5% ATM uptime across network", base_value=Decimal("98.5"), target_value=Decimal("99.5"), current_value=Decimal("99.2"), unit="%", weight=Decimal("0.50")),
            KeyResult(okr_id=okr_atm.id, description="Reduce ATM transaction failures by 40%", base_value=Decimal("2.5"), target_value=Decimal("1.5"), current_value=Decimal("2.0"), unit="%", weight=Decimal("0.30")),
            KeyResult(okr_id=okr_atm.id, description="Complete preventive maintenance for 100% of ATMs", base_value=Decimal("85"), target_value=Decimal("100"), current_value=Decimal("92"), unit="%", weight=Decimal("0.20")),
        ]
        db.add_all(key_results_atm)
        db.commit()
        print(f"✓ {team_atm.name}: {okr_atm.objective} ({len(key_results_atm)} KRs)")
        
        # Card Production Team OKR
        okr_card = OKR(
            team_id=team_card.id,
            quarter="Q1 2026",
            objective="Optimize Card Production and Delivery Process",
            is_active=True
        )
        db.add(okr_card)
        db.commit()
        db.refresh(okr_card)
        
        key_results_card = [
            KeyResult(okr_id=okr_card.id, description="Reduce card production time by 30%", base_value=Decimal("5"), target_value=Decimal("3.5"), current_value=Decimal("4.2"), unit="days", weight=Decimal("0.40")),
            KeyResult(okr_id=okr_card.id, description="Achieve 99% card quality accuracy", base_value=Decimal("97"), target_value=Decimal("99"), current_value=Decimal("98.5"), unit="%", weight=Decimal("0.35")),
            KeyResult(okr_id=okr_card.id, description="Process 100% of card orders within SLA", base_value=Decimal("92"), target_value=Decimal("100"), current_value=Decimal("96"), unit="%", weight=Decimal("0.25")),
        ]
        db.add_all(key_results_card)
        db.commit()
        print(f"✓ {team_card.name}: {okr_card.objective} ({len(key_results_card)} KRs)")
        
        # T24 Application Team OKR
        okr_t24 = OKR(
            team_id=team_t24.id,
            quarter="Q1 2026",
            objective="Ensure T24 System Stability and Performance",
            is_active=True
        )
        db.add(okr_t24)
        db.commit()
        db.refresh(okr_t24)
        
        key_results_t24 = [
            KeyResult(okr_id=okr_t24.id, description="Maintain 99.9% T24 system uptime", base_value=Decimal("99.7"), target_value=Decimal("99.9"), current_value=Decimal("99.85"), unit="%", weight=Decimal("0.50")),
            KeyResult(okr_id=okr_t24.id, description="Reduce T24 transaction processing time by 20%", base_value=Decimal("3.5"), target_value=Decimal("2.8"), current_value=Decimal("3.1"), unit="seconds", weight=Decimal("0.30")),
            KeyResult(okr_id=okr_t24.id, description="Complete all scheduled T24 maintenance windows on time", base_value=Decimal("90"), target_value=Decimal("100"), current_value=Decimal("95"), unit="%", weight=Decimal("0.20")),
        ]
        db.add_all(key_results_t24)
        db.commit()
        print(f"✓ {team_t24.name}: {okr_t24.objective} ({len(key_results_t24)} KRs)")
        
        # Application Integration Team OKR
        okr_integration = OKR(
            team_id=team_integration.id,
            quarter="Q1 2026",
            objective="Enhance System Integration and API Performance",
            is_active=True
        )
        db.add(okr_integration)
        db.commit()
        db.refresh(okr_integration)
        
        key_results_integration = [
            KeyResult(okr_id=okr_integration.id, description="Integrate 3 new payment gateways", base_value=Decimal("0"), target_value=Decimal("3"), current_value=Decimal("1"), unit="gateways", weight=Decimal("0.40")),
            KeyResult(okr_id=okr_integration.id, description="Reduce API response time by 25%", base_value=Decimal("500"), target_value=Decimal("375"), current_value=Decimal("425"), unit="ms", weight=Decimal("0.35")),
            KeyResult(okr_id=okr_integration.id, description="Achieve 99.5% integration success rate", base_value=Decimal("98"), target_value=Decimal("99.5"), current_value=Decimal("99.2"), unit="%", weight=Decimal("0.25")),
        ]
        db.add_all(key_results_integration)
        db.commit()
        print(f"✓ {team_integration.name}: {okr_integration.objective} ({len(key_results_integration)} KRs)")
        
        # Ijo Branch OKR
        okr_ijo = OKR(
            team_id=team_ijo.id,
            quarter="Q1 2026",
            objective="Improve Branch Customer Service and Operations",
            is_active=True
        )
        db.add(okr_ijo)
        db.commit()
        db.refresh(okr_ijo)
        
        key_results_ijo = [
            KeyResult(okr_id=okr_ijo.id, description="Achieve 95% customer satisfaction rating", base_value=Decimal("88"), target_value=Decimal("95"), current_value=Decimal("92"), unit="%", weight=Decimal("0.40")),
            KeyResult(okr_id=okr_ijo.id, description="Reduce average customer wait time to 10 minutes", base_value=Decimal("18"), target_value=Decimal("10"), current_value=Decimal("13"), unit="minutes", weight=Decimal("0.35")),
            KeyResult(okr_id=okr_ijo.id, description="Process 100% of transactions accurately", base_value=Decimal("98.5"), target_value=Decimal("100"), current_value=Decimal("99.5"), unit="%", weight=Decimal("0.25")),
        ]
        db.add_all(key_results_ijo)
        db.commit()
        print(f"✓ {team_ijo.name}: {okr_ijo.objective} ({len(key_results_ijo)} KRs)\n")
        
        # Refresh all key results
        all_key_results = key_results_atm + key_results_card + key_results_t24 + key_results_integration + key_results_ijo
        for kr in all_key_results:
            db.refresh(kr)
        
        # ========================================
        # CREATE BAU ACTIVITIES FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING BAU ACTIVITIES")
        print("=" * 60)
        
        bau_atm = [
            BAUActivity(team_id=team_atm.id, name="ATM Daily Monitoring", description="24/7 monitoring of ATM network status and transaction processing", is_active=True),
            BAUActivity(team_id=team_atm.id, name="ATM Cash Replenishment", description="Coordinate and manage ATM cash replenishment schedules", is_active=True),
            BAUActivity(team_id=team_atm.id, name="ATM Maintenance", description="Scheduled and emergency ATM maintenance and repairs", is_active=True),
        ]
        db.add_all(bau_atm)
        db.commit()
        for bau in bau_atm:
            db.refresh(bau)
        
        bau_card = [
            BAUActivity(team_id=team_card.id, name="Card Order Processing", description="Process daily card orders and manage production queue", is_active=True),
            BAUActivity(team_id=team_card.id, name="Card Quality Control", description="Quality checks and validation of produced cards", is_active=True),
            BAUActivity(team_id=team_card.id, name="Card Delivery Management", description="Coordinate card delivery to branches and customers", is_active=True),
        ]
        db.add_all(bau_card)
        db.commit()
        for bau in bau_card:
            db.refresh(bau)
        
        bau_t24 = [
            BAUActivity(team_id=team_t24.id, name="T24 System Monitoring", description="24/7 monitoring of T24 core banking system performance", is_active=True),
            BAUActivity(team_id=team_t24.id, name="T24 Backup and Recovery", description="Daily backups and recovery procedures for T24 system", is_active=True),
            BAUActivity(team_id=team_t24.id, name="T24 User Support", description="Support T24 users and resolve application issues", is_active=True),
        ]
        db.add_all(bau_t24)
        db.commit()
        for bau in bau_t24:
            db.refresh(bau)
        
        bau_integration = [
            BAUActivity(team_id=team_integration.id, name="API Monitoring", description="Monitor API performance and integration health", is_active=True),
            BAUActivity(team_id=team_integration.id, name="Integration Support", description="Support and troubleshoot system integrations", is_active=True),
            BAUActivity(team_id=team_integration.id, name="Integration Testing", description="Test and validate new integrations and API changes", is_active=True),
        ]
        db.add_all(bau_integration)
        db.commit()
        for bau in bau_integration:
            db.refresh(bau)
        
        bau_ijo = [
            BAUActivity(team_id=team_ijo.id, name="Customer Service", description="Daily customer service operations and support", is_active=True),
            BAUActivity(team_id=team_ijo.id, name="Cash Management", description="Branch cash management and vault operations", is_active=True),
            BAUActivity(team_id=team_ijo.id, name="Transaction Processing", description="Process daily banking transactions and account operations", is_active=True),
        ]
        db.add_all(bau_ijo)
        db.commit()
        for bau in bau_ijo:
            db.refresh(bau)
        
        print(f"✓ {team_atm.name}: {len(bau_atm)} activities")
        print(f"✓ {team_card.name}: {len(bau_card)} activities")
        print(f"✓ {team_t24.name}: {len(bau_t24)} activities")
        print(f"✓ {team_integration.name}: {len(bau_integration)} activities")
        print(f"✓ {team_ijo.name}: {len(bau_ijo)} activities\n")
        
        # ========================================
        # CREATE BAU METRICS
        # ========================================
        print("=" * 60)
        print("CREATING BAU METRICS")
        print("=" * 60)
        
        metrics_atm = [
            BAUMetric(bau_activity_id=bau_atm[0].id, name="ATM Network Uptime", target_value=Decimal("99.5"), current_value=Decimal("99.2"), unit="%", weight=Decimal("0.5"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_atm[0].id, name="Average Response Time", target_value=Decimal("3"), current_value=Decimal("3.5"), unit="seconds", weight=Decimal("0.3"), metric_type="Lower is Better"),
            BAUMetric(bau_activity_id=bau_atm[1].id, name="Cash Replenishment Timeliness", target_value=Decimal("100"), current_value=Decimal("96"), unit="%", weight=Decimal("0.4"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_atm[2].id, name="Maintenance Completion Rate", target_value=Decimal("100"), current_value=Decimal("95"), unit="%", weight=Decimal("0.6"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_atm)
        db.commit()
        
        metrics_card = [
            BAUMetric(bau_activity_id=bau_card[0].id, name="Order Processing Time", target_value=Decimal("3"), current_value=Decimal("4.2"), unit="days", weight=Decimal("0.4"), metric_type="Lower is Better"),
            BAUMetric(bau_activity_id=bau_card[1].id, name="Card Quality Accuracy", target_value=Decimal("99"), current_value=Decimal("98.5"), unit="%", weight=Decimal("0.35"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_card[2].id, name="Delivery Success Rate", target_value=Decimal("100"), current_value=Decimal("98"), unit="%", weight=Decimal("0.25"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_card)
        db.commit()
        
        metrics_t24 = [
            BAUMetric(bau_activity_id=bau_t24[0].id, name="T24 System Uptime", target_value=Decimal("99.9"), current_value=Decimal("99.85"), unit="%", weight=Decimal("0.5"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_t24[1].id, name="Backup Success Rate", target_value=Decimal("100"), current_value=Decimal("99.5"), unit="%", weight=Decimal("0.3"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_t24[2].id, name="Support Ticket Resolution Time", target_value=Decimal("4"), current_value=Decimal("5.2"), unit="hours", weight=Decimal("0.2"), metric_type="Lower is Better"),
        ]
        db.add_all(metrics_t24)
        db.commit()
        
        metrics_integration = [
            BAUMetric(bau_activity_id=bau_integration[0].id, name="API Uptime", target_value=Decimal("99.5"), current_value=Decimal("99.2"), unit="%", weight=Decimal("0.4"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_integration[1].id, name="Integration Issue Resolution Time", target_value=Decimal("6"), current_value=Decimal("7.5"), unit="hours", weight=Decimal("0.3"), metric_type="Lower is Better"),
            BAUMetric(bau_activity_id=bau_integration[2].id, name="Integration Test Success Rate", target_value=Decimal("100"), current_value=Decimal("97"), unit="%", weight=Decimal("0.3"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_integration)
        db.commit()
        
        metrics_ijo = [
            BAUMetric(bau_activity_id=bau_ijo[0].id, name="Customer Satisfaction Score", target_value=Decimal("95"), current_value=Decimal("92"), unit="%", weight=Decimal("0.4"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_ijo[1].id, name="Cash Variance Accuracy", target_value=Decimal("100"), current_value=Decimal("99.8"), unit="%", weight=Decimal("0.3"), metric_type="Higher is Better"),
            BAUMetric(bau_activity_id=bau_ijo[2].id, name="Transaction Processing Accuracy", target_value=Decimal("100"), current_value=Decimal("99.5"), unit="%", weight=Decimal("0.3"), metric_type="Higher is Better"),
        ]
        db.add_all(metrics_ijo)
        db.commit()
        
        print(f"✓ Created metrics for all teams\n")
        
        # ========================================
        # CREATE MONTHLY HEADS-UP FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING MONTHLY HEADS-UP")
        print("=" * 60)
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        
        headsup_atm = MonthlyHeadsUp(team_id=team_atm.id, month=current_month, description="Focus on improving ATM network uptime, reducing transaction failures, and completing preventive maintenance for all ATMs")
        headsup_card = MonthlyHeadsUp(team_id=team_card.id, month=current_month, description="Optimize card production processes, improve quality control, and ensure timely delivery of all card orders")
        headsup_t24 = MonthlyHeadsUp(team_id=team_t24.id, month=current_month, description="Maintain T24 system stability, optimize transaction processing, and complete all scheduled maintenance windows")
        headsup_integration = MonthlyHeadsUp(team_id=team_integration.id, month=current_month, description="Integrate new payment gateways, improve API performance, and ensure high integration success rates")
        headsup_ijo = MonthlyHeadsUp(team_id=team_ijo.id, month=current_month, description="Enhance customer service quality, reduce wait times, and ensure accurate transaction processing")
        
        all_headsups = [headsup_atm, headsup_card, headsup_t24, headsup_integration, headsup_ijo]
        db.add_all(all_headsups)
        db.commit()
        for h in all_headsups:
            db.refresh(h)
        
        print(f"✓ Created monthly heads-up for all 5 teams\n")
        
        # ========================================
        # CREATE WORK ITEMS FOR ALL TEAMS
        # ========================================
        print("=" * 60)
        print("CREATING WORK ITEMS")
        print("=" * 60)
        
        work_items_atm = [
            WorkItem(team_id=team_atm.id, monthly_headsup_id=headsup_atm.id, title="Improve ATM network uptime to 99.5%", description="Implement proactive monitoring and maintenance to achieve target uptime", source_type="OKR", source_id=key_results_atm[0].id, owner_id=zidan.id, status="In Progress"),
            WorkItem(team_id=team_atm.id, monthly_headsup_id=headsup_atm.id, title="Reduce ATM transaction failures", description="Identify and resolve common causes of ATM transaction failures", source_type="OKR", source_id=key_results_atm[1].id, owner_id=motuma.id, status="In Progress"),
            WorkItem(team_id=team_atm.id, monthly_headsup_id=headsup_atm.id, title="Complete preventive maintenance schedule", description="Ensure all ATMs receive scheduled preventive maintenance", source_type="OKR", source_id=key_results_atm[2].id, owner_id=derartu.id, status="Not Started"),
            WorkItem(team_id=team_atm.id, monthly_headsup_id=headsup_atm.id, title="Daily ATM monitoring and reporting", description="Monitor ATM network status and generate daily reports", source_type="BAU", source_id=bau_atm[0].id, owner_id=simon.id, status="Not Started"),
        ]
        
        work_items_card = [
            WorkItem(team_id=team_card.id, monthly_headsup_id=headsup_card.id, title="Optimize card production workflow", description="Streamline card production process to reduce processing time", source_type="OKR", source_id=key_results_card[0].id, owner_id=birhanemeskel.id, status="In Progress"),
            WorkItem(team_id=team_card.id, monthly_headsup_id=headsup_card.id, title="Enhance card quality control process", description="Improve quality checks to achieve 99% accuracy target", source_type="OKR", source_id=key_results_card[1].id, owner_id=duresa.id, status="In Progress"),
            WorkItem(team_id=team_card.id, monthly_headsup_id=headsup_card.id, title="Ensure timely card delivery", description="Coordinate delivery to meet 100% SLA compliance", source_type="OKR", source_id=key_results_card[2].id, owner_id=elasabeth.id, status="Not Started"),
            WorkItem(team_id=team_card.id, monthly_headsup_id=headsup_card.id, title="Process daily card orders", description="Handle daily card order processing and queue management", source_type="BAU", source_id=bau_card[0].id, owner_id=isubalo.id, status="Not Started"),
        ]
        
        work_items_t24 = [
            WorkItem(team_id=team_t24.id, monthly_headsup_id=headsup_t24.id, title="Maintain T24 system uptime at 99.9%", description="Ensure T24 core banking system maintains high availability", source_type="OKR", source_id=key_results_t24[0].id, owner_id=regasa.id, status="In Progress"),
            WorkItem(team_id=team_t24.id, monthly_headsup_id=headsup_t24.id, title="Optimize T24 transaction processing", description="Reduce transaction processing time by 20%", source_type="OKR", source_id=key_results_t24[1].id, owner_id=kelil.id, status="In Progress"),
            WorkItem(team_id=team_t24.id, monthly_headsup_id=headsup_t24.id, title="Complete scheduled maintenance windows", description="Execute all planned T24 maintenance activities on schedule", source_type="OKR", source_id=key_results_t24[2].id, owner_id=ephrem.id, status="Not Started"),
            WorkItem(team_id=team_t24.id, monthly_headsup_id=headsup_t24.id, title="Daily T24 system monitoring", description="Monitor T24 system performance and health metrics", source_type="BAU", source_id=bau_t24[0].id, owner_id=iyasu.id, status="Not Started"),
        ]
        
        work_items_integration = [
            WorkItem(team_id=team_integration.id, monthly_headsup_id=headsup_integration.id, title="Integrate new payment gateways", description="Complete integration of 3 new payment gateway providers", source_type="OKR", source_id=key_results_integration[0].id, owner_id=tesfahun.id, status="In Progress"),
            WorkItem(team_id=team_integration.id, monthly_headsup_id=headsup_integration.id, title="Optimize API response times", description="Reduce API response time by 25% through optimization", source_type="OKR", source_id=key_results_integration[1].id, owner_id=tselotemariam.id, status="In Progress"),
            WorkItem(team_id=team_integration.id, monthly_headsup_id=headsup_integration.id, title="Improve integration success rate", description="Achieve 99.5% integration success rate across all systems", source_type="OKR", source_id=key_results_integration[2].id, owner_id=zelalem.id, status="Not Started"),
            WorkItem(team_id=team_integration.id, monthly_headsup_id=headsup_integration.id, title="Monitor API performance", description="Daily monitoring of API performance and integration health", source_type="BAU", source_id=bau_integration[0].id, owner_id=tselotemariam.id, status="Not Started"),
        ]
        
        work_items_ijo = [
            WorkItem(team_id=team_ijo.id, monthly_headsup_id=headsup_ijo.id, title="Improve customer satisfaction to 95%", description="Enhance customer service quality and experience", source_type="OKR", source_id=key_results_ijo[0].id, owner_id=samson.id, status="In Progress"),
            WorkItem(team_id=team_ijo.id, monthly_headsup_id=headsup_ijo.id, title="Reduce customer wait times", description="Optimize branch operations to reduce average wait time to 10 minutes", source_type="OKR", source_id=key_results_ijo[1].id, owner_id=samrawit.id, status="In Progress"),
            WorkItem(team_id=team_ijo.id, monthly_headsup_id=headsup_ijo.id, title="Ensure transaction accuracy", description="Maintain 100% transaction processing accuracy", source_type="OKR", source_id=key_results_ijo[2].id, owner_id=korsa.id, status="Not Started"),
            WorkItem(team_id=team_ijo.id, monthly_headsup_id=headsup_ijo.id, title="Daily customer service operations", description="Handle daily customer inquiries and banking services", source_type="BAU", source_id=bau_ijo[0].id, owner_id=samrawit.id, status="Not Started"),
        ]
        
        all_work_items = work_items_atm + work_items_card + work_items_t24 + work_items_integration + work_items_ijo
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
            WeeklyPriorityPlan(monthly_headsup_id=headsup_atm.id, week=current_week, week_focus="Improve ATM network uptime and reduce transaction failures"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_card.id, week=current_week, week_focus="Optimize card production workflow and quality control"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_t24.id, week=current_week, week_focus="Maintain T24 system stability and optimize performance"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_integration.id, week=current_week, week_focus="Integrate new payment gateways and improve API performance"),
            WeeklyPriorityPlan(monthly_headsup_id=headsup_ijo.id, week=current_week, week_focus="Enhance customer service quality and reduce wait times"),
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
            WeeklyPriority(plan_id=plans[0].id, work_item_id=work_items_atm[0].id, priority=1),
            WeeklyPriority(plan_id=plans[0].id, work_item_id=work_items_atm[1].id, priority=2),
            WeeklyPriority(plan_id=plans[1].id, work_item_id=work_items_card[0].id, priority=1),
            WeeklyPriority(plan_id=plans[1].id, work_item_id=work_items_card[1].id, priority=2),
            WeeklyPriority(plan_id=plans[2].id, work_item_id=work_items_t24[0].id, priority=1),
            WeeklyPriority(plan_id=plans[2].id, work_item_id=work_items_t24[1].id, priority=2),
            WeeklyPriority(plan_id=plans[3].id, work_item_id=work_items_integration[0].id, priority=1),
            WeeklyPriority(plan_id=plans[3].id, work_item_id=work_items_integration[1].id, priority=2),
            WeeklyPriority(plan_id=plans[4].id, work_item_id=work_items_ijo[0].id, priority=1),
            WeeklyPriority(plan_id=plans[4].id, work_item_id=work_items_ijo[1].id, priority=2),
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
        
        tasks_atm = [
            Task(work_item_id=work_items_atm[0].id, title="Install new monitoring tools", description="Deploy enhanced ATM monitoring system for better visibility", assignee_id=motuma.id, status="Done", effort_hours=8, completed_at=datetime.now(timezone.utc) - timedelta(days=3)),
            Task(work_item_id=work_items_atm[0].id, title="Analyze downtime patterns", description="Analyze historical data to identify common downtime causes", assignee_id=derartu.id, status="In Progress", effort_hours=6),
            Task(work_item_id=work_items_atm[1].id, title="Review transaction failure logs", description="Analyze transaction failure logs to identify root causes", assignee_id=simon.id, status="In Progress", effort_hours=8),
            Task(work_item_id=work_items_atm[1].id, title="Implement failure prevention measures", description="Deploy fixes for common transaction failure scenarios", assignee_id=roba.id, status="Not Started", effort_hours=10),
            Task(work_item_id=work_items_atm[2].id, title="Schedule preventive maintenance", description="Create and execute preventive maintenance schedule for all ATMs", assignee_id=kebron.id, status="Not Started", effort_hours=12),
        ]
        
        tasks_card = [
            Task(work_item_id=work_items_card[0].id, title="Review current production workflow", description="Analyze existing card production process for optimization opportunities", assignee_id=duresa.id, status="Done", effort_hours=6, completed_at=datetime.now(timezone.utc) - timedelta(days=2)),
            Task(work_item_id=work_items_card[0].id, title="Implement workflow improvements", description="Deploy optimized card production workflow", assignee_id=elasabeth.id, status="In Progress", effort_hours=10),
            Task(work_item_id=work_items_card[1].id, title="Enhance quality control procedures", description="Improve quality check processes and validation criteria", assignee_id=isubalo.id, status="In Progress", effort_hours=8),
            Task(work_item_id=work_items_card[2].id, title="Coordinate with delivery partners", description="Work with delivery partners to ensure timely card delivery", assignee_id=tomas.id, status="Not Started", effort_hours=6),
        ]
        
        tasks_t24 = [
            Task(work_item_id=work_items_t24[0].id, title="Review system health metrics", description="Analyze T24 system health and identify improvement areas", assignee_id=kelil.id, status="Done", effort_hours=8, completed_at=datetime.now(timezone.utc) - timedelta(days=4)),
            Task(work_item_id=work_items_t24[0].id, title="Implement system optimizations", description="Apply system optimizations to improve uptime", assignee_id=ephrem.id, status="In Progress", effort_hours=12),
            Task(work_item_id=work_items_t24[1].id, title="Optimize database queries", description="Review and optimize slow database queries affecting transaction speed", assignee_id=iyasu.id, status="In Progress", effort_hours=10),
            Task(work_item_id=work_items_t24[2].id, title="Plan maintenance windows", description="Schedule and plan upcoming T24 maintenance activities", assignee_id=regasa.id, status="Not Started", effort_hours=6),
        ]
        
        tasks_integration = [
            Task(work_item_id=work_items_integration[0].id, title="Research payment gateway options", description="Evaluate and select 3 new payment gateway providers", assignee_id=tselotemariam.id, status="Done", effort_hours=10, completed_at=datetime.now(timezone.utc) - timedelta(days=5)),
            Task(work_item_id=work_items_integration[0].id, title="Integrate first payment gateway", description="Complete integration of first new payment gateway", assignee_id=zelalem.id, status="In Progress", effort_hours=16),
            Task(work_item_id=work_items_integration[1].id, title="Profile API performance", description="Identify bottlenecks in API response times", assignee_id=tesfahun.id, status="In Progress", effort_hours=8),
            Task(work_item_id=work_items_integration[1].id, title="Optimize API endpoints", description="Implement optimizations to reduce API response times", assignee_id=tselotemariam.id, status="Not Started", effort_hours=12),
        ]
        
        tasks_ijo = [
            Task(work_item_id=work_items_ijo[0].id, title="Conduct customer satisfaction survey", description="Gather customer feedback to identify improvement areas", assignee_id=samrawit.id, status="Done", effort_hours=6, completed_at=datetime.now(timezone.utc) - timedelta(days=3)),
            Task(work_item_id=work_items_ijo[0].id, title="Implement service improvements", description="Deploy customer service enhancements based on feedback", assignee_id=korsa.id, status="In Progress", effort_hours=10),
            Task(work_item_id=work_items_ijo[1].id, title="Analyze wait time patterns", description="Review branch operations to identify wait time bottlenecks", assignee_id=tesfaye.id, status="In Progress", effort_hours=8),
            Task(work_item_id=work_items_ijo[1].id, title="Optimize branch workflow", description="Streamline branch processes to reduce customer wait times", assignee_id=samson.id, status="Not Started", effort_hours=12),
        ]
        
        all_tasks = tasks_atm + tasks_card + tasks_t24 + tasks_integration + tasks_ijo
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
        print(f"   • Departments: 3")
        print(f"   • Teams: 5 (all with descriptions)")
        print(f"   • Users: {len(all_users) + 5} (3 directors + 2 executives + 1 admin + {len(all_users)} team members)")
        print(f"   • OKRs: 5 (one per team)")
        print(f"   • Key Results: {len(all_key_results)}")
        print(f"   • BAU Activities: 15 (3 per team)")
        print(f"   • BAU Metrics: {len(metrics_atm) + len(metrics_card) + len(metrics_t24) + len(metrics_integration) + len(metrics_ijo)}")
        print(f"   • Monthly Heads-Up: 5 (one per team)")
        print(f"   • Work Items: {len(all_work_items)}")
        print(f"   • Weekly Priority Plans: 5")
        print(f"   • Weekly Priorities: {len(priorities)}")
        print(f"   • Tasks: {len(all_tasks)}")
        
        print(f"\n{'='*60}")
        print(f"🔐 LOGIN CREDENTIALS (All passwords: password123)")
        print(f"{'='*60}")
        print(f"\n👤 EXECUTIVES:")
        print(f"   Email: deribe@bank.com    (Chief Executive Officer)")
        print(f"   Email: aman@bank.com      (Chief Transformation and Strategy Officer)")
        
        print(f"\n👤 DIRECTORS:")
        print(f"   Email: hailagegn@bank.com (Director of Payment Platform)")
        print(f"   Email: samuel@bank.com    (Director of Core Banking System)")
        print(f"   Email: iyob@bank.com      (Director of Central Finfine District)")
        
        print(f"\n👤 TEAM LEADS:")
        print(f"   Email: zidan@bank.com           (ATM Monitoring Team)")
        print(f"   Email: birhanemeskel@bank.com  (Card Production Team)")
        print(f"   Email: regasa@bank.com          (T24 Application Team)")
        print(f"   Email: tesfahun@bank.com        (Application Integration Team)")
        print(f"   Email: samson@bank.com          (Ijo Branch)")
        
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
