import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.projects.models import Project
from app.projects.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectOverview,
    IssueSummary,
    AuditScoreSummary,
    ActionCountSummary,
)
from app.common.exceptions import NotFoundError, ForbiddenError


async def create_project(
    tenant_id: uuid.UUID,
    data: ProjectCreate,
    db: AsyncSession,
) -> Project:
    project = Project(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=data.name,
        url=data.url,
        industry=data.industry,
        geography=data.geography,
        revenue_model=data.revenue_model,
        business_info=data.business_info or {},
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def get_project(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> Project:
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.tenant_id == tenant_id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    return project


async def list_projects(
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.tenant_id == tenant_id)
        .order_by(Project.created_at.desc())
    )
    return list(result.scalars().all())


async def update_project(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession,
) -> Project:
    project = await get_project(project_id, tenant_id, db)

    if data.name is not None:
        project.name = data.name
    if data.url is not None:
        project.url = data.url
    if data.industry is not None:
        project.industry = data.industry
    if data.geography is not None:
        project.geography = data.geography
    if data.revenue_model is not None:
        project.revenue_model = data.revenue_model
    if data.business_info is not None:
        project.business_info = data.business_info
    project.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(project)
    return project


async def delete_project(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    project = await get_project(project_id, tenant_id, db)
    await db.delete(project)
    await db.flush()


async def get_project_overview(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> ProjectOverview:
    # Verify project belongs to tenant
    await get_project(project_id, tenant_id, db)

    # Import here to avoid circular imports
    from app.audits.models import Audit, AuditIssue, IssueSeverity
    from app.actions.models import ActionItem

    # Get latest audit score
    latest_audit_result = await db.execute(
        select(Audit)
        .where(Audit.project_id == project_id, Audit.status == "completed")
        .order_by(Audit.completed_at.desc())
        .limit(1)
    )
    latest_audit = latest_audit_result.scalar_one_or_none()
    score = latest_audit.score if latest_audit else None

    # Get recent audits (last 5)
    recent_audits_result = await db.execute(
        select(Audit)
        .where(Audit.project_id == project_id, Audit.status == "completed")
        .order_by(Audit.completed_at.desc())
        .limit(5)
    )
    recent_audits_list = list(recent_audits_result.scalars().all())
    recent_audits = [
        AuditScoreSummary(
            id=a.id,
            score=a.score,
            created_at=a.created_at,
        )
        for a in recent_audits_list
    ]

    # Get top 5 critical issues from latest audit
    top_issues = []
    if latest_audit:
        issues_result = await db.execute(
            select(AuditIssue)
            .where(AuditIssue.audit_id == latest_audit.id)
            .order_by(AuditIssue.impact_score.desc())
            .limit(5)
        )
        issues_list = list(issues_result.scalars().all())
        top_issues = [
            IssueSummary(
                id=i.id,
                severity=i.severity.value if hasattr(i.severity, "value") else i.severity,
                category=i.category.value if hasattr(i.category, "value") else i.category,
                title=i.title,
                impact_score=i.impact_score,
            )
            for i in issues_list
        ]

    # Get action counts by status
    open_count = await db.scalar(
        select(func.count(ActionItem.id)).where(
            ActionItem.project_id == project_id,
            ActionItem.status == "open",
        )
    ) or 0
    in_progress_count = await db.scalar(
        select(func.count(ActionItem.id)).where(
            ActionItem.project_id == project_id,
            ActionItem.status == "in_progress",
        )
    ) or 0
    done_count = await db.scalar(
        select(func.count(ActionItem.id)).where(
            ActionItem.project_id == project_id,
            ActionItem.status == "done",
        )
    ) or 0
    dismissed_count = await db.scalar(
        select(func.count(ActionItem.id)).where(
            ActionItem.project_id == project_id,
            ActionItem.status == "dismissed",
        )
    ) or 0

    return ProjectOverview(
        score=score,
        top_issues=top_issues,
        recent_audits=recent_audits,
        action_counts=ActionCountSummary(
            open=open_count,
            in_progress=in_progress_count,
            done=done_count,
            dismissed=dismissed_count,
        ),
    )
