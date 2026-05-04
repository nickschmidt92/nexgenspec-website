import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.auth.models import User
from app.tenants.models import Tenant
from app.tenants.service import create_tenant


async def register_user(
    firebase_uid: str,
    email: str,
    full_name: str,
    tenant_name: str,
    db: AsyncSession,
) -> tuple[User, Tenant]:
    """Create a new Tenant and User. Raises ConflictError if firebase_uid already exists."""
    # Check if user already exists
    existing = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    if existing.scalar_one_or_none():
        from app.common.exceptions import ConflictError
        raise ConflictError("User already registered")

    tenant = await create_tenant(name=tenant_name, db=db)

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        firebase_uid=firebase_uid,
        email=email,
        full_name=full_name,
        role="owner",
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user, tenant


async def get_or_create_user(
    firebase_uid: str,
    email: str,
    db: AsyncSession,
) -> User | None:
    """Idempotent user lookup by firebase_uid."""
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    return result.scalar_one_or_none()


async def update_last_login(user_id: uuid.UUID, db: AsyncSession) -> None:
    """Update the last_login_at timestamp for a user."""
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(last_login_at=datetime.now(timezone.utc))
    )
    await db.flush()
