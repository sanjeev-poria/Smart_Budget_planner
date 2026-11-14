import logging
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Any, Dict

from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.database.mongodb import get_database
from app.models.user import user_helper, create_user_document
from app.schemas.user import UserRegister, UserLogin, UserResponse
from app.schemas.token import Token

logger = logging.getLogger("smartfin.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Registers a new user with secure bcrypt password hashing and returns an initial JWT authentication token."
)
def register(user_in: UserRegister) -> Token:
    """Register a new user."""
    db = get_database()
    email_clean = user_in.email.strip().lower()

    # Check for existing account
    existing_user = db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead.",
        )

    # Hash password securely
    hashed_pwd = hash_password(user_in.password)

    # Construct user document
    new_user_data = create_user_document(
        name=user_in.name,
        email=email_clean,
        password_hash=hashed_pwd,
        age=user_in.age,
        city=user_in.city,
    )

    insert_result = db.users.insert_one(new_user_data)
    new_user_data["_id"] = insert_result.inserted_id

    # Create JWT access token
    access_token = create_access_token(subject=email_clean)
    user_response_data = user_helper(new_user_data)

    logger.info("New user registered successfully: %s", email_clean)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_response_data),
    )


@router.post(
    "/login",
    response_model=Token,
    summary="User Login",
    description="Authenticates user credentials using bcrypt and returns a signed JWT bearer token."
)
def login(credentials: UserLogin) -> Token:
    """Authenticate an existing user and return a JWT access token."""
    db = get_database()
    email_clean = credentials.email.strip().lower()

    user = db.users.find_one({"email": email_clean})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support.",
        )

    access_token = create_access_token(subject=email_clean)
    user_response_data = user_helper(user)

    logger.info("User logged in successfully: %s", email_clean)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_response_data),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
    description="Validates Bearer token and returns authenticated user's account details and financial profile."
)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    """Return the profile of the currently logged-in user."""
    return UserResponse(**user_helper(current_user))
