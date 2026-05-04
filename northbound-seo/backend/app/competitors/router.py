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
from app.competitors.models import Competitor, CompetitorAnalysis, CompetitorGap, GapType
from app.competitors.schemas import (
    CompetitorCreate,
    CompetitorResponse,
    CompetitorAnalysisCreate,
    CompetitorAnalysisResponse,
    CompetitorGapResponse,
)
from app.competitors.service import (
    create_competitor,
    start_competitor_analysis,
)
from app.projects.service import get_project

router = APIRouter()


@router.post(
    "/projects/{project_id}/competitors",
    response_model=CompetitorResponse,
    status_code=201,
)
async def add_competitor(
    project_id: uuid.UUID,
    body: CompetitorCreate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Add a competitor to a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    competitor = await create_competitor(project_id=project_id, data=body, db=db)
    return CompetitorResponse.model_validate(competitor)


@router.get(
    "/projects/{project_id}/competitors",
    response_model=list[CompetitorResponse],
)
async def list_competitors(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List all competitors for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    result = await db.execute(
        select(Competitor)
        .where(Competitor.project_id == project_id)
        .order_by(Competitor.created_at.asc())
    )
    competitors = list(result.scalars().all())
    return [CompetitorResponse.model_validate(c) for c in competitors]


@router.delete("/competitors/{competitor_id}", status_code=204)
async def delete_competitor(
    competitor_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Delete a competitor."""
    # Verify the competitor belongs to a project owned by tenant
    result = await db.execute(
        select(Competitor).where(Competitor.id == competitor_id)
    )
    competitor = result.scalar_one_or_none()
    if not competitor:
        raise NotFoundError("Competitor not found")

    # Verify project ownership
    await get_project(project_id=competitor.project_id, tenant_id=tenant.id, db=db)
    await db.delete(competitor)
    await db.flush()


@router.post(
    "/projects/{project_id}/competitor-analysis",
    response_model=CompetitorAnalysisResponse,
    status_code=202,
)
async def run_competitor_analysis(
    project_id: uuid.UUID,
    body: CompetitorAnalysisCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Trigger a competitor analysis."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    analysis = await start_competitor_analysis(
        project_id=project_id,
        tenant_id=tenant.id,
        data=body,
        db=db,
        background_tasks=background_tasks,
    )
    return CompetitorAnalysisResponse.model_validate(analysis)


@router.get(
    "/competitor-analyses/{analysis_id}",
    response_model=CompetitorAnalysisResponse,
)
async def get_competitor_analysis(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Get a competitor analysis result."""
    result = await db.execute(
        select(CompetitorAnalysis).where(
            CompetitorAnalysis.id == analysis_id,
            CompetitorAnalysis.tenant_id == tenant.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise NotFoundError("Competitor analysis not found")
    return CompetitorAnalysisResponse.model_validate(analysis)


@router.get(
    "/competitor-analyses/{analysis_id}/gaps",
    response_model=list[CompetitorGapResponse],
)
async def list_gaps(
    analysis_id: uuid.UUID,
    gap_type: Optional[GapType] = Query(None),
    min_opportunity_score: Optional[int] = Query(None, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List competitor gaps with optional filters."""
    analysis_result = await db.execute(
        select(CompetitorAnalysis).where(
            CompetitorAnalysis.id == analysis_id,
            CompetitorAnalysis.tenant_id == tenant.id,
        )
    )
    if not analysis_result.scalar_one_or_none():
        raise NotFoundError("Competitor analysis not found")

    query = select(CompetitorGap).where(CompetitorGap.analysis_id == analysis_id)
    if gap_type:
        query = query.where(CompetitorGap.gap_type == gap_type.value)
    if min_opportunity_score is not None:
        query = query.where(CompetitorGap.opportunity_score >= min_opportunity_score)
    query = query.order_by(CompetitorGap.opportunity_score.desc())

    result = await db.execute(query)
    gaps = list(result.scalars().all())
    return [CompetitorGapResponse.model_validate(g) for g in gaps]
