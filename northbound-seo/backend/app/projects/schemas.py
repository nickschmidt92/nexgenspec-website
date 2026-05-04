import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    url: str
    industry: str | None = None
    geography: str = "national"
    revenue_model: str | None = None
    business_info: dict[str, Any] = {}


class ProjectUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    industry: str | None = None
    geography: str | None = None
    revenue_model: str | None = None
    business_info: dict[str, Any] | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    url: str
    industry: str | None
    geography: str
    revenue_model: str | None
    business_info: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    latest_audit_score: int | None = None

    model_config = {"from_attributes": True}


class AuditScoreSummary(BaseModel):
    id: uuid.UUID
    score: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class IssueSummary(BaseModel):
    id: uuid.UUID
    severity: str
    category: str
    title: str
    impact_score: int

    model_config = {"from_attributes": True}


class ActionCountSummary(BaseModel):
    open: int
    in_progress: int
    done: int
    dismissed: int


class ProjectOverview(BaseModel):
    score: int | None
    top_issues: list[IssueSummary]
    recent_audits: list[AuditScoreSummary]
    action_counts: ActionCountSummary
