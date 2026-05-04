import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.common.database import get_session
from app.common.exceptions import NotFoundError, ForbiddenError
from app.deps import get_current_user, get_current_tenant
from app.auth.models import User
from app.tenants.models import Tenant
from app.projects.models import Project
from app.projects.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectOverview,
)
from app.projects.service import (
    create_project,
    get_project,
    list_projects,
    update_project,
    delete_project,
    get_project_overview,
)

router = APIRouter()


async def _get_latest_audit_score(project_id: uuid.UUID, db: AsyncSession) -> int | None:
    from app.audits.models import Audit
    result = await db.execute(
        select(Audit.score)
        .where(Audit.project_id == project_id, Audit.status == "completed")
        .order_by(Audit.completed_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    return row


def _project_response(project: Project, latest_audit_score: int | None = None) -> ProjectResponse:
    resp = ProjectResponse.model_validate(project)
    resp.latest_audit_score = latest_audit_score
    return resp


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project_route(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    # Check max projects for tenant plan
    count_result = await db.scalar(
        select(func.count(Project.id)).where(Project.tenant_id == tenant.id)
    )
    if (count_result or 0) >= tenant.max_projects:
        raise HTTPException(
            status_code=403,
            detail=f"Plan limit reached: max {tenant.max_projects} projects",
        )

    project = await create_project(tenant_id=tenant.id, data=body, db=db)
    return _project_response(project)


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects_route(
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    projects = await list_projects(tenant_id=tenant.id, db=db)
    result = []
    for p in projects:
        score = await _get_latest_audit_score(p.id, db)
        result.append(_project_response(p, score))
    return result


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_route(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    project = await get_project(project_id=project_id, tenant_id=tenant.id, db=db)
    score = await _get_latest_audit_score(project_id, db)
    return _project_response(project, score)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project_route(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    project = await update_project(
        project_id=project_id,
        tenant_id=tenant.id,
        data=body,
        db=db,
    )
    score = await _get_latest_audit_score(project_id, db)
    return _project_response(project, score)


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project_route(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    await delete_project(project_id=project_id, tenant_id=tenant.id, db=db)


@router.get("/projects/{project_id}/overview", response_model=ProjectOverview)
async def get_project_overview_route(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_session),
):
    return await get_project_overview(
        project_id=project_id,
        tenant_id=tenant.id,
        db=db,
    )
