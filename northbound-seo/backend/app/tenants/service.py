import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slugify import slugify
from app.tenants.models import Tenant
from app.tenants.schemas import TenantUpdate


async def create_tenant(name: str, db: AsyncSession) -> Tenant:
    """Create a new tenant with an auto-generated slug."""
    base_slug = slugify(name)
    slug = base_slug
    counter = 1

    # Ensure slug uniqueness
    while True:
        existing = await db.execute(select(Tenant).where(Tenant.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    tenant = Tenant(
        id=uuid.uuid4(),
        name=name,
        slug=slug,
        plan="free",
        max_projects=3,
    )
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    return tenant


async def get_tenant(tenant_id: uuid.UUID, db: AsyncSession) -> Tenant | None:
    """Fetch a tenant by ID."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    return result.scalar_one_or_none()


async def update_tenant(
    tenant_id: uuid.UUID,
    data: TenantUpdate,
    db: AsyncSession,
) -> Tenant | None:
    """Update tenant fields."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return None

    if data.name is not None:
        tenant.name = data.name
        tenant.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(tenant)
    return tenant
