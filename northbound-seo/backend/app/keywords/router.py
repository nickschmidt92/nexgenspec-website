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
from app.keywords.models import KeywordResearch, Keyword, KeywordCluster, KeywordIntent
from app.keywords.schemas import (
    KeywordResearchCreate,
    KeywordResearchResponse,
    KeywordResponse,
    KeywordClusterResponse,
)
from app.keywords.service import trigger_keyword_research
from app.projects.service import get_project

router = APIRouter()


@router.post(
    "/projects/{project_id}/keyword-research",
    response_model=KeywordResearchResponse,
    status_code=202,
)
async def start_keyword_research(
    project_id: uuid.UUID,
    body: KeywordResearchCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Trigger keyword research for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    research = await trigger_keyword_research(
        project_id=project_id,
        tenant_id=tenant.id,
        data=body,
        db=db,
        background_tasks=background_tasks,
    )
    return KeywordResearchResponse.model_validate(research)


@router.get(
    "/projects/{project_id}/keyword-research",
    response_model=list[KeywordResearchResponse],
)
async def list_keyword_research(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List all keyword research runs for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    result = await db.execute(
        select(KeywordResearch)
        .where(
            KeywordResearch.project_id == project_id,
            KeywordResearch.tenant_id == tenant.id,
        )
        .order_by(KeywordResearch.created_at.desc())
    )
    items = list(result.scalars().all())
    return [KeywordResearchResponse.model_validate(i) for i in items]


@router.get(
    "/keyword-research/{research_id}",
    response_model=KeywordResearchResponse,
)
async def get_keyword_research(
    research_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Get a single keyword research result."""
    result = await db.execute(
        select(KeywordResearch).where(
            KeywordResearch.id == research_id,
            KeywordResearch.tenant_id == tenant.id,
        )
    )
    research = result.scalar_one_or_none()
    if not research:
        raise NotFoundError("Keyword research not found")
    return KeywordResearchResponse.model_validate(research)


@router.get(
    "/keyword-research/{research_id}/keywords",
    response_model=list[KeywordResponse],
)
async def list_keywords(
    research_id: uuid.UUID,
    tier: Optional[str] = Query(None),
    intent: Optional[KeywordIntent] = Query(None),
    opportunity: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List keywords for a research run with optional filters."""
    research_result = await db.execute(
        select(KeywordResearch).where(
            KeywordResearch.id == research_id,
            KeywordResearch.tenant_id == tenant.id,
        )
    )
    if not research_result.scalar_one_or_none():
        raise NotFoundError("Keyword research not found")

    query = select(Keyword).where(Keyword.research_id == research_id)
    if tier:
        query = query.where(Keyword.tier == tier)
    if intent:
        query = query.where(Keyword.intent == intent.value)
    if opportunity is not None:
        query = query.where(Keyword.opportunity == opportunity)
    query = query.order_by(Keyword.search_volume.desc().nullslast())

    result = await db.execute(query)
    keywords = list(result.scalars().all())
    return [KeywordResponse.model_validate(k) for k in keywords]


@router.get(
    "/keyword-research/{research_id}/clusters",
    response_model=list[KeywordClusterResponse],
)
async def list_clusters(
    research_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List keyword clusters for a research run."""
    research_result = await db.execute(
        select(KeywordResearch).where(
            KeywordResearch.id == research_id,
            KeywordResearch.tenant_id == tenant.id,
        )
    )
    if not research_result.scalar_one_or_none():
        raise NotFoundError("Keyword research not found")

    result = await db.execute(
        select(KeywordCluster)
        .where(KeywordCluster.research_id == research_id)
        .order_by(KeywordCluster.priority_score.desc().nullslast())
    )
    clusters = list(result.scalars().all())
    return [KeywordClusterResponse.model_validate(c) for c in clusters]
