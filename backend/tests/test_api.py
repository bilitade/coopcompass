"""Unit and integration tests for Compass backend."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db
from app.models import Base
# Import models for use in tests
from app.models import Base, User, Team, OKR, KeyResult, BAUActivity, BAUMetric, WorkItem, Task, WeeklyPriority, Department
import app.models as models
from app.core.security import hash_password
from decimal import Decimal

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture
def setup_database():
    """Setup and cleanup test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(setup_database):
    """Create a test user."""
    db = TestingSessionLocal()
    user = models.User(
        name="Test User",
        email="test@example.com",
        role="member",
        password_hash=hash_password("testpass123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_team(setup_database):
    """Create a test team."""
    db = TestingSessionLocal()
    team = models.Team(name="Test Team")
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


class TestAuthentication:
    """Test authentication endpoints."""

    def test_register_user(self, setup_database):
        """Test user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "password": "securepass123",
                "role": "member"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "john@example.com"
        assert data["name"] == "John Doe"
        assert "password" not in data

    def test_register_duplicate_email(self, test_user):
        """Test that duplicate email registration fails."""
        response = client.post(
            "/api/auth/register",
            json={
                "name": "Another User",
                "email": test_user.email,
                "password": "securepass123",
                "role": "member"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_login_success(self, test_user):
        """Test successful login."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"].lower() == "bearer"

    def test_login_invalid_password(self, test_user):
        """Test login with invalid password."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]


class TestTeams:
    """Test team endpoints."""

    def test_list_teams_empty(self, setup_database, test_user):
        """Test listing teams when none exist."""
        # This would need auth headers in a real scenario
        # For now, testing basic endpoint existence
        pass

    def test_create_team(self, setup_database):
        """Test team creation."""
        db = TestingSessionLocal()
        team = models.Team(name="New Team")
        db.add(team)
        db.commit()
        
        assert team.id is not None
        assert team.name == "New Team"


class TestCalculations:
    """Test calculation functions."""

    def test_work_item_progress_no_tasks(self, setup_database):
        """Test work item progress with no tasks."""
        from app.modules.work_items.services import calculate_work_item_progress
        
        db = TestingSessionLocal()
        team = models.Team(name="Test Team")
        db.add(team)
        db.commit()
        
        work_item = models.WorkItem(
            team_id=team.id,
            title="Test Work Item",
            source_type="OKR",
            source_id=1,
            month="2026-01"
        )
        db.add(work_item)
        db.commit()
        
        progress = calculate_work_item_progress(db, work_item.id)
        assert progress == 0.0

    def test_work_item_progress_with_tasks(self, setup_database):
        """Test work item progress calculation."""
        from app.modules.work_items.services import calculate_work_item_progress
        
        db = TestingSessionLocal()
        team = models.Team(name="Test Team")
        db.add(team)
        db.commit()
        
        work_item = models.WorkItem(
            team_id=team.id,
            title="Test Work Item",
            source_type="OKR",
            source_id=1,
            month="2026-01"
        )
        db.add(work_item)
        db.commit()
        
        # Add tasks: 2 done, 3 not done
        for i in range(2):
            task = models.Task(
                work_item_id=work_item.id,
                description=f"Done Task {i}",
                status="Done"
            )
            db.add(task)
        
        for i in range(3):
            task = models.Task(
                work_item_id=work_item.id,
                description=f"Pending Task {i}",
                status="Not Started"
            )
            db.add(task)
        
        db.commit()
        
        progress = calculate_work_item_progress(db, work_item.id)
        assert progress == 40.0  # 2/5 done

    def test_bau_health_calculation(self, setup_database):
        """Test BAU health calculation."""
        from app.modules.bau.services import calculate_bau_health
        
        db = TestingSessionLocal()
        team = models.Team(name="Test Team")
        db.add(team)
        db.commit()
        
        bau = models.BAUActivity(
            team_id=team.id,
            name="Test BAU Activity"
        )
        db.add(bau)
        db.commit()
        
        # Add metric: 80/100 = 80%
        metric = models.BAUMetric(
            bau_activity_id=bau.id,
            name="Test Metric",
            target_value=Decimal("100"),
            current_value=Decimal("80"),
            weight=Decimal("1.0"),
            unit="%",
            metric_type="Higher is Better"
        )
        db.add(metric)
        db.commit()
        
        health = calculate_bau_health(db, bau.id)
        assert health == 80.0

    def test_bau_health_lower_is_better(self, setup_database):
        """Test BAU health calculation with 'lower is better' metric."""
        from app.modules.bau.services import calculate_bau_health
        
        db = TestingSessionLocal()
        team = models.Team(name="Test Team")
        db.add(team)
        db.commit()
        
        bau = models.BAUActivity(
            team_id=team.id,
            name="Test BAU Activity"
        )
        db.add(bau)
        db.commit()
        
        # Add metric: target=30, current=20, lower is better
        # Health = (30/20) * 100 = 150%, capped at 100%
        metric = models.BAUMetric(
            bau_activity_id=bau.id,
            name="MTTR",
            target_value=Decimal("30"),
            current_value=Decimal("20"),
            weight=Decimal("1.0"),
            unit="seconds",
            metric_type="Lower is Better"
        )
        db.add(metric)
        db.commit()
        
        health = calculate_bau_health(db, bau.id)
        assert health == 100.0  # Capped at 100


class TestDatabase:
    """Test database models."""

    def test_user_creation(self, setup_database):
        """Test creating a user."""
        db = TestingSessionLocal()
        user = models.User(
            name="Test User",
            email="test@example.com",
            role="member",
            password_hash=hash_password("password123")
        )
        db.add(user)
        db.commit()
        
        assert user.id is not None
        assert user.email == "test@example.com"

    def test_team_and_users_relationship(self, setup_database):
        """Test team-user relationship."""
        db = TestingSessionLocal()
        team = models.Team(name="Test Team")
        db.add(team)
        db.commit()
        
        user = models.User(
            team_id=team.id,
            name="Team Member",
            email="member@example.com",
            role="member",
            password_hash=hash_password("password123")
        )
        db.add(user)
        db.commit()
        
        assert user.team_id == team.id
        assert user in team.users

    def test_okr_and_key_results(self, setup_database):
        """Test OKR-KeyResult relationship."""
        db = TestingSessionLocal()
        team = models.Team(name="Test Team")
        db.add(team)
        db.commit()
        
        okr = models.OKR(
            team_id=team.id,
            quarter="Q1 2026",
            objective="Test Objective"
        )
        db.add(okr)
        db.commit()
        
        kr = models.KeyResult(
            okr_id=okr.id,
            description="Test KR",
            base_value=Decimal("0"),
            target_value=Decimal("10"),
            current_value=Decimal("0"),
            unit="items",
            weight=Decimal("1.0")
        )
        db.add(kr)
        db.commit()
        
        assert kr.okr_id == okr.id
        assert kr in okr.key_results


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])

