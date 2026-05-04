import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel
from app.competitors.models import GapType


class CompetitorCreate(BaseModel):
    url: str
    name: str | None = None


class CompetitorResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    name: str | None
    is_auto_detected: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CompetitorAnalysisCreate(BaseModel):
    competitor_ids: list[uuid.UUID] | None = None


class CompetitorAnalysisResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tenant_id: uuid.UUID
    status: str
    competitor_ids: list[uuid.UUID] | None
    summary: dict[str, Any] | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class CompetitorGapResponse(BaseModel):
    id: uuid.UUID
    analysis_id: uuid.UUID
    competitor_id: uuid.UUID
    gap_type: GapType
    title: str
    description: str
    competitor_value: str | None
    your_value: str | None
    opportunity_score: int
    keyword: str | None
    search_volume: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
