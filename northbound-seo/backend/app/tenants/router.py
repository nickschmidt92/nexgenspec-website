from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.common.database import get_session
from app.common.exceptions import NotFoundError
from app.deps import get_current_user, get_current_tenant
from app.auth.models import User
from app.tenants.models import Tenant
from app.tenants.schemas import TenantResponse, TenantUpdate
from app.tenants.service import update_tenant

router = APIRouter()


@router.get("/current", response_model=TenantResponse)
async def get_current_tenant_route(
    tenant: Tenant = Depends(get_current_tenant),
):
    """Return the current tenant info."""
    return TenantResponse.model_validate(tenant)


@router.patch("/current", response_model=TenantResponse)
async def update_current_tenant(
    body: TenantUpdate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Update the current tenant's name."""
    updated = await update_tenant(tenant_id=tenant.id, data=body, db=db)
    if not updated:
        raise NotFoundError("Tenant not found")
    return TenantResponse.model_validate(updated)
