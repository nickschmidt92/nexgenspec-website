from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import firebase_admin
from firebase_admin import auth as firebase_auth
from app.common.database import get_session
from app.deps import get_current_user
from app.auth.models import User
from app.auth.schemas import RegisterRequest, UserResponse, AuthResponse, TenantBasic
from app.auth.service import register_user, update_last_login
from app.tenants.models import Tenant

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    body: RegisterRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_session),
):
    """Register a new tenant + user account using a Firebase ID token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ")

    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    firebase_uid = decoded["uid"]
    email = decoded.get("email", "")

    user, tenant = await register_user(
        firebase_uid=firebase_uid,
        email=email,
        full_name=body.full_name,
        tenant_name=body.tenant_name,
        db=db,
    )

    background_tasks.add_task(update_last_login, user.id, db)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tenant=TenantBasic.model_validate(tenant),
    )


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Return current user profile."""
    background_db = db
    await update_last_login(current_user.id, background_db)
    return UserResponse.model_validate(current_user)
