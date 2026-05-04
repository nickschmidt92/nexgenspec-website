import uuid
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.common.database import get_session
from app.common.exceptions import NotFoundError
from app.deps import get_current_user, get_current_tenant
from app.auth.models import User
from app.tenants.models import Tenant
from app.content.models import ContentPlan, ContentItem, ContentType
from app.content.schemas import (
    ContentPlanCreate,
    ContentPlanResponse,
    ContentItemResponse,
    ContentItemUpdate,
)
from app.content.service import create_content_plan
from app.projects.service import get_project

router = APIRouter()


@router.post(
    "/projects/{project_id}/content-plans",
    response_model=ContentPlanResponse,
    status_code=202,
)
async def create_content_plan_route(
    project_id: uuid.UUID,
    body: ContentPlanCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Generate a 30/60/90 day content plan for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    plan = await create_content_plan(
        project_id=project_id,
        tenant_id=tenant.id,
        data=body,
        db=db,
        background_tasks=background_tasks,
    )
    return ContentPlanResponse.model_validate(plan)


@router.get(
    "/projects/{project_id}/content-plans",
    response_model=list[ContentPlanResponse],
)
async def list_content_plans(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List all content plans for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    result = await db.execute(
        select(ContentPlan)
        .where(
            ContentPlan.project_id == project_id,
            ContentPlan.tenant_id == tenant.id,
        )
        .order_by(ContentPlan.created_at.desc())
    )
    plans = list(result.scalars().all())
    return [ContentPlanResponse.model_validate(p) for p in plans]


@router.get(
    "/content-plans/{plan_id}",
    response_model=ContentPlanResponse,
)
async def get_content_plan(
    plan_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Get a specific content plan."""
    result = await db.execute(
        select(ContentPlan).where(
            ContentPlan.id == plan_id,
            ContentPlan.tenant_id == tenant.id,
        )
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Content plan not found")
    return ContentPlanResponse.model_validate(plan)


@router.get(
    "/content-plans/{plan_id}/items",
    response_model=list[ContentItemResponse],
)
async def list_content_items(
    plan_id: uuid.UUID,
    phase: Optional[str] = Query(None, pattern="^(30_day|60_day|90_day)$"),
    content_type: Optional[ContentType] = Query(None),
    priority: Optional[str] = Query(None, pattern="^(P0|P1|P2|P3)$"),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List content items for a plan with optional filters."""
    plan_result = await db.execute(
        select(ContentPlan).where(
            ContentPlan.id == plan_id,
            ContentPlan.tenant_id == tenant.id,
        )
    )
    if not plan_result.scalar_one_or_none():
        raise NotFoundError("Content plan not found")

    query = select(ContentItem).where(ContentItem.plan_id == plan_id)
    if phase:
        query = query.where(ContentItem.phase == phase)
    if content_type:
        query = query.where(ContentItem.content_type == content_type.value)
    if priority:
        query = query.where(ContentItem.priority == priority)
    query = query.order_by(ContentItem.priority.asc(), ContentItem.impact_score.desc().nullslast())

    result = await db.execute(query)
    items = list(result.scalars().all())
    return [ContentItemResponse.model_validate(i) for i in items]


@router.patch(
    "/content-items/{item_id}",
    response_model=ContentItemResponse,
)
async def update_content_item(
    item_id: uuid.UUID,
    body: ContentItemUpdate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Update a content item's status, title, or priority."""
    # Load item and verify tenant ownership via plan
    item_result = await db.execute(
        select(ContentItem).where(ContentItem.id == item_id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Content item not found")

    # Verify tenant ownership
    plan_result = await db.execute(
        select(ContentPlan).where(
            ContentPlan.id == item.plan_id,
            ContentPlan.tenant_id == tenant.id,
        )
    )
    if not plan_result.scalar_one_or_none():
        raise NotFoundError("Content item not found")

    if body.status is not None:
        item.status = body.status
    if body.title is not None:
        item.title = body.title
    if body.priority is not None:
        item.priority = body.priority

    await db.flush()
    await db.refresh(item)
    return ContentItemResponse.model_validate(item)
