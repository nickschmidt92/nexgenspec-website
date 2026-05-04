import uuid
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.common.database import get_session
from app.common.exceptions import NotFoundError
from app.deps import get_current_user, get_current_tenant
from app.auth.models import User
from app.tenants.models import Tenant
from app.audits.models import Audit, AuditIssue, IssueSeverity, IssueCategory
from app.audits.schemas import AuditResponse, AuditIssueResponse, IssuesSummaryResponse
from app.audits.service import create_audit
from app.projects.service import get_project

router = APIRouter()


@router.post("/projects/{project_id}/audits", response_model=AuditResponse, status_code=202)
async def trigger_audit(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Trigger a new SEO audit for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    audit = await create_audit(
        project_id=project_id,
        tenant_id=tenant.id,
        db=db,
        background_tasks=background_tasks,
    )
    return AuditResponse.model_validate(audit)


@router.get("/projects/{project_id}/audits", response_model=list[AuditResponse])
async def list_audits(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List audit history for a project."""
    await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    result = await db.execute(
        select(Audit)
        .where(Audit.project_id == project_id, Audit.tenant_id == tenant.id)
        .order_by(Audit.created_at.desc())
    )
    audits = list(result.scalars().all())
    return [AuditResponse.model_validate(a) for a in audits]


@router.get("/audits/{audit_id}", response_model=AuditResponse)
async def get_audit(
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Get a single audit result."""
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.tenant_id == tenant.id)
    )
    audit = result.scalar_one_or_none()
    if not audit:
        raise NotFoundError("Audit not found")
    return AuditResponse.model_validate(audit)


@router.get("/audits/{audit_id}/issues", response_model=list[AuditIssueResponse])
async def list_issues(
    audit_id: uuid.UUID,
    severity: Optional[IssueSeverity] = Query(None),
    category: Optional[IssueCategory] = Query(None),
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """List issues for an audit with optional filters."""
    # Verify audit belongs to tenant
    audit_result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.tenant_id == tenant.id)
    )
    if not audit_result.scalar_one_or_none():
        raise NotFoundError("Audit not found")

    query = select(AuditIssue).where(AuditIssue.audit_id == audit_id)
    if severity:
        query = query.where(AuditIssue.severity == severity.value)
    if category:
        query = query.where(AuditIssue.category == category.value)
    query = query.order_by(AuditIssue.impact_score.desc())

    result = await db.execute(query)
    issues = list(result.scalars().all())
    return [AuditIssueResponse.model_validate(i) for i in issues]


@router.get("/audits/{audit_id}/issues/summary", response_model=IssuesSummaryResponse)
async def issues_summary(
    audit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    """Get issue counts grouped by severity and category."""
    audit_result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.tenant_id == tenant.id)
    )
    if not audit_result.scalar_one_or_none():
        raise NotFoundError("Audit not found")

    # Count by severity
    sev_result = await db.execute(
        select(AuditIssue.severity, func.count(AuditIssue.id))
        .where(AuditIssue.audit_id == audit_id)
        .group_by(AuditIssue.severity)
    )
    by_severity = {row[0]: row[1] for row in sev_result.all()}

    # Count by category
    cat_result = await db.execute(
        select(AuditIssue.category, func.count(AuditIssue.id))
        .where(AuditIssue.audit_id == audit_id)
        .group_by(AuditIssue.category)
    )
    by_category = {row[0]: row[1] for row in cat_result.all()}

    total = sum(by_severity.values())

    return IssuesSummaryResponse(
        by_severity=by_severity,
        by_category=by_category,
        total=total,
    )
