import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel
from app.content.models import ContentType


class ContentPlanCreate(BaseModel):
    name: str = "30/60/90 Day Plan"
    config: dict[str, Any] | None = None


class ContentPlanResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    status: str
    config: dict[str, Any] | None
    summary: dict[str, Any] | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ContentItemResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    title: str
    content_type: ContentType
    target_keywords: list[str] | None
    target_intent: str | None
    suggested_url: str | None
    word_count_min: int | None
    word_count_max: int | None
    outline: dict[str, Any] | None
    internal_links: list[str] | None
    phase: str
    priority: str
    impact_score: int | None
    effort_score: int | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ContentItemUpdate(BaseModel):
    status: str | None = None
    title: str | None = None
    priority: str | None = None
