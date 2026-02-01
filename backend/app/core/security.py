"""JWT authentication utilities following RFC 7519 standards."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Password hashing with proper configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Standard rounds for bcrypt
)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with proper security practices."""
    if not password:
        raise ValueError("Password cannot be empty")

    # bcrypt has a 72-byte limit on passwords
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        raise ValueError("Password too long (maximum 72 bytes)")

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    if not plain_password or not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token following RFC 7519 standards.

    Args:
        data: Dictionary containing claims to encode in the token
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token string

    The token will include:
    - sub: Subject (user identifier as string)
    - exp: Expiration time (Unix timestamp)
    - iat: Issued at time (Unix timestamp)
    - Additional claims from data dict
    """
    to_encode = data.copy()

    # Ensure sub claim is present and is a string (JWT RFC 7519 requirement)
    if "sub" not in to_encode:
        raise ValueError("Subject (sub) claim is required")
    if not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])

    # Add issued at time
    now = datetime.now(timezone.utc)
    to_encode["iat"] = int(now.timestamp())

    # Add expiration time
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode["exp"] = int(expire.timestamp())

    # Encode the JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dictionary if valid, None if invalid

    Raises:
        JWTError: If token is malformed or invalid
    """
    try:
        # Decode and verify the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Validate required claims
        if "sub" not in payload:
            return None

        # Validate expiration (jose library handles this automatically)
        # but we can add additional validation if needed

        return payload

    except JWTError:
        # Token is invalid or expired
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    """Extract user ID from a valid JWT token.

    Args:
        token: JWT token string

    Returns:
        User ID as integer if token is valid, None otherwise
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id_str = payload.get("sub")
    if user_id_str is None:
        return None

    try:
        return int(user_id_str)
    except (ValueError, TypeError):
        return None

