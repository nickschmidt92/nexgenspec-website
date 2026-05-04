import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel
from app.keywords.models import KeywordIntent


class KeywordResearchCreate(BaseModel):
    seed_keywords: list[str]
    config: dict[str, Any] | None = None


class KeywordResearchResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tenant_id: uuid.UUID
    status: str
    seed_keywords: list[str] | None
    config: dict[str, Any] | None
    summary: dict[str, Any] | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class KeywordResponse(BaseModel):
    id: uuid.UUID
    research_id: uuid.UUID
    keyword: str
    search_volume: int | None
    keyword_difficulty: int | None
    cpc: Decimal | None
    intent: KeywordIntent | None
    tier: str
    cluster_id: uuid.UUID | None
    mapped_url: str | None
    opportunity: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class KeywordClusterResponse(BaseModel):
    id: uuid.UUID
    research_id: uuid.UUID
    name: str
    intent: KeywordIntent
    keyword_count: int
    total_volume: int
    avg_difficulty: Decimal | None
    priority_score: Decimal | None
    created_at: datetime

    model_config = {"from_attributes": True}
