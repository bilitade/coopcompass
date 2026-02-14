"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
from app.core.database import engine
from app.models import Base
from app.core.config import CORS_ORIGINS
from app.modules.registry import get_enabled_modules

# Create tables if database is available (lazy initialization)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"⚠️  Note: Database connection error (this is OK for development). Error: {str(e)[:100]}")
    print("⚠️  Make sure to configure DATABASE_URL in .env file")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    print("Starting Compass Backend API")
    enabled_modules = get_enabled_modules()
    print(f"Enabled modules: {', '.join(enabled_modules)}")
    yield
    # Shutdown
    print("Shutting down Compass Backend API")


# Initialize FastAPI app
app = FastAPI(
    title="Team Performance & Execution System (Compass)",
    description="Backend API for tracking strategic goals and operational health",
    version="1.0.0",
    lifespan=lifespan
)

# Simple Bearer authentication for Swagger UI
security = HTTPBearer(
    description="Enter: Bearer [your_jwt_token]. Get token from /api/auth/token or /auth page. Demo: email=sarah@bank.com, password=password123",
    scheme_name="BearerAuth"
)

# Add CORS middleware - Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Dynamically load and register modules
def register_modules():
    """Register all enabled modules."""
    enabled_modules = get_enabled_modules()
    module_map = {
        "auth": ("app.modules.auth.routers", "router"),
        "users": ("app.modules.users.routers", "router"),
        "teams": ("app.modules.teams.routers", "router"),
        "departments": ("app.modules.departments.routers", "router"),
        "okrs": ("app.modules.okrs.routers", "router"),
        "bau": ("app.modules.bau.routers", "router"),
        "work_items": ("app.modules.work_items.routers", "router"),
        "tasks": ("app.modules.tasks.routers", "router"),
        "monthly_headsup": ("app.modules.monthly_headsup.routers", "router"),
        "weekly_priority": ("app.modules.weekly_priority.routers", "router"),
    }
    
    for module_name in enabled_modules:
        if module_name in module_map:
            try:
                module_path, router_name = module_map[module_name]
                module = __import__(module_path, fromlist=[router_name])
                router = getattr(module, router_name)
                app.include_router(router)
                print(f"✓ Registered module: {module_name}")
            except ImportError as e:
                print(f"⚠️  Warning: Could not load module '{module_name}': {e}")
            except AttributeError as e:
                print(f"⚠️  Warning: Module '{module_name}' missing router: {e}")

# Register all enabled modules
register_modules()


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Team Performance & Execution System (Compass) Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "authentication": "/auth",
        "enabled_modules": get_enabled_modules(),
        "demo_credentials": {
            "email": "sarah@bank.com",
            "password": "password123",
            "role": "lead"
        },
        "instructions": [
            "1. Get authenticated: Visit /auth",
            "2. Copy your JWT token",
            "3. Go to /docs and click 'Authorize'",
            "4. Paste: Bearer [your_token]",
            "5. Start using the API!"
        ]
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "enabled_modules": get_enabled_modules()}


@app.get("/auth")
def auth_page():
    """
    Simple authentication page for easy token generation.

    Visit this endpoint in your browser to get authenticated for Swagger UI.
    """
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Compass Authentication</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .demo { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .token { background: #f0f8ff; padding: 15px; border-radius: 5px; margin-top: 20px; word-break: break-all; }
            .copy-btn { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
            .copy-btn:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 Compass Authentication</h1>
            <p>Use this page to get your JWT token for Swagger UI authentication.</p>

            <div class="demo">
                <h3>Demo Credentials:</h3>
                <p><strong>Email:</strong> sarah@bank.com</p>
                <p><strong>Password:</strong> password123</p>
                <p><strong>Role:</strong> Team Lead (can manage OKRs)</p>
            </div>

            <form id="loginForm">
                <div style="margin-bottom: 15px;">
                    <label for="email">Email:</label><br>
                    <input type="email" id="email" value="sarah@bank.com" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label for="password">Password:</label><br>
                    <input type="password" id="password" value="password123" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <button type="submit" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; width: 100%;">Get Authentication Token</button>
            </form>

            <div id="result" style="display: none;" class="token">
                <h3>✅ Authentication Successful!</h3>
                <p><strong>Token:</strong></p>
                <div id="tokenText" style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin: 10px 0;"></div>
                <button class="copy-btn" onclick="copyToken()">Copy Token</button>

                <h4>How to use in Swagger UI:</h4>
                <ol>
                    <li>Go to <a href="/docs" target="_blank">API Documentation (/docs)</a></li>
                    <li>Click the <strong>"Authorize"</strong> button (top right)</li>
                    <li>In the "Value" field, paste: <code>Bearer [your_token_here]</code></li>
                    <li>Click <strong>"Authorize"</strong></li>
                    <li>Now all API calls will use your authentication!</li>
                </ol>
            </div>

            <div id="error" style="display: none; color: red; margin-top: 20px;">
                <strong>❌ Authentication Failed:</strong> <span id="errorText"></span>
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch('/api/auth/swagger-login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            email: email,
                            password: password
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        document.getElementById('result').style.display = 'block';
                        document.getElementById('error').style.display = 'none';
                        document.getElementById('tokenText').textContent = data.token;
                        window.authToken = data.token;
                    } else {
                        document.getElementById('error').style.display = 'block';
                        document.getElementById('result').style.display = 'none';
                        document.getElementById('errorText').textContent = data.error;
                    }
                } catch (error) {
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('result').style.display = 'none';
                    document.getElementById('errorText').textContent = 'Network error: ' + error.message;
                }
            });

            function copyToken() {
                const tokenText = document.getElementById('tokenText').textContent;
                navigator.clipboard.writeText('Bearer ' + tokenText).then(() => {
                    alert('Token copied to clipboard! Now paste it in Swagger UI Authorize dialog.');
                });
            }
        </script>
    </body>
    </html>
    """


@app.post("/api/auth/swagger-login")
def swagger_login(email: str, password: str):
    """
    Special endpoint for Swagger UI authentication.

    This endpoint allows you to login directly from Swagger UI
    and returns the token in a format that's easy to copy.

    Parameters:
    - email: User email
    - password: User password

    Returns:
    - token: JWT access token
    - instructions: How to use the token in Swagger UI
    """
    from app.core.security import verify_password, create_access_token
    from app.core.database import SessionLocal
    from app.models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user or not verify_password(password, user.password_hash):
            return {
                "success": False,
                "error": "Invalid email or password",
                "demo_credentials": {
                    "email": "sarah@bank.com",
                    "password": "password123"
                }
            }

        if not user.is_active:
            return {"success": False, "error": "User account is inactive"}

        access_token = create_access_token(data={"sub": str(user.id)})

        return {
            "success": True,
            "token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            },
            "swagger_auth_value": f"Bearer {access_token}",
            "instructions": [
                "1. Click the 'Authorize' button at the top of the Swagger UI page",
                "2. In the 'Value' field, enter: Bearer " + access_token,
                "3. Click 'Authorize'",
                "4. Now all API endpoints will use your authentication token!"
            ]
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
