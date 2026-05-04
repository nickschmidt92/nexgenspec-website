import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel
from app.audits.models import AuditStatus, IssueSeverity, IssueCategory


class AuditResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tenant_id: uuid.UUID
    status: AuditStatus
    score: int | None
    score_breakdown: dict[str, Any] | None
    pages_crawled: int
    summary: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditIssueCreate(BaseModel):
    severity: IssueSeverity
    category: IssueCategory
    title: str
    description: str
    affected_url: str | None = None
    current_value: str | None = None
    recommended: str
    impact_score: int
    effort_score: int


class AuditIssueResponse(BaseModel):
    id: uuid.UUID
    audit_id: uuid.UUID
    severity: IssueSeverity
    category: IssueCategory
    title: str
    description: str
    affected_url: str | None
    current_value: str | None
    recommended: str
    impact_score: int
    effort_score: int
    created_at: datetime

    model_config = {"from_attributes": True}


class IssuesSummaryResponse(BaseModel):
    by_severity: dict[str, int]
    by_category: dict[str, int]
    total: int
