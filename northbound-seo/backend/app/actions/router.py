import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.common.database import get_session
from app.common.exceptions import NotFoundError
from app.deps import get_current_user, get_current_tenant
from app.auth.models import User
from app.tenants.models import Tenant
from app.actions.models import ActionItem, ActionCategory
from app.actions.schemas import ActionItemResponse, ActionItemUpdate, ActionSummaryResponse
from app.actions.service import get_actions, regenerate_actions
from app.projects.service import get_project

router = APIRouter()


def _to_response(action: ActionItem) -> ActionItemResponse:
    return ActionItemResponse(
        id=action.id,
        project_id=action.project_id,
        tenant_id=action.tenant_id,
        source_type=action.source_type,
        source_id=action.source_id,
        category=action.category if isinstance(action.category, ActionCategory) else ActionCategory(action.category),
        title=action.title,
        description=action.description,
        affected_urls=action.affected_urls,
        impact_score=action.impact_score,
        effort_score=action.effort_score,
        priority=action.priority,
        status=action.status,
        created_at=action.created_at,
        completed_at=action.completed_at,
        roi_score=action.roi_score,
    )


@router.get("/projects/{project_id}/actions", response_model=list[ActionItemResponse])
async def list_actions(
    project_id: uuid.UUID,
    priority: Optional[str] = Query(None, pattern="^(P0|P1|P2|P3)$"),
    category: Optional[ActionCategory] = Query(None),
    status: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List action items for a project with optional filters."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    actions = await get_actions(
        project_id=project_id,
        tenant_id=tenant.id,
        db=db,
        priority=priority,
        category=category.value if category else None,
        status=status,
        source_type=source_type,
    )
    return [_to_response(a) for a in actions]


@router.get("/projects/{project_id}/actions/summary", response_model=ActionSummaryResponse)
async def actions_summary(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Get action item counts grouped by priority, category, and status."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)

    # By priority
    priority_result = await db.execute(
        select(ActionItem.priority, func.count(ActionItem.id))
        .where(
            ActionItem.project_id == project_id,
            ActionItem.tenant_id == tenant.id,
        )
        .group_by(ActionItem.priority)
    )
    by_priority = {row[0]: row[1] for row in priority_result.all()}

    # By category
    category_result = await db.execute(
        select(ActionItem.category, func.count(ActionItem.id))
        .where(
            ActionItem.project_id == project_id,
            ActionItem.tenant_id == tenant.id,
        )
        .group_by(ActionItem.category)
    )
    by_category = {row[0]: row[1] for row in category_result.all()}

    # By status
    status_result = await db.execute(
        select(ActionItem.status, func.count(ActionItem.id))
        .where(
            ActionItem.project_id == project_id,
            ActionItem.tenant_id == tenant.id,
        )
        .group_by(ActionItem.status)
    )
    by_status = {row[0]: row[1] for row in status_result.all()}

    total = sum(by_status.values())

    return ActionSummaryResponse(
        by_priority=by_priority,
        by_category=by_category,
        by_status=by_status,
        total=total,
    )


@router.patch("/actions/{action_id}", response_model=ActionItemResponse)
async def update_action_status(
    action_id: uuid.UUID,
    body: ActionItemUpdate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Update an action item's status."""
    result = await db.execute(
        select(ActionItem).where(
            ActionItem.id == action_id,
            ActionItem.tenant_id == tenant.id,
        )
    )
    action = result.scalar_one_or_none()
    if not action:
        raise NotFoundError("Action item not found")

    if body.status is not None:
        action.status = body.status
        if body.status == "done":
            action.completed_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(action)
    return _to_response(action)


@router.post("/projects/{project_id}/actions/regenerate", response_model=list[ActionItemResponse])
async def regenerate_project_actions(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Re-run action generation from all existing sources."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    actions = await regenerate_actions(
        project_id=project_id,
        tenant_id=tenant.id,
        db=db,
    )
    return [_to_response(a) for a in actions]
