import uuid
from datetime import datetime
from pydantic import BaseModel, computed_field
from app.actions.models import ActionCategory


class ActionItemResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    tenant_id: uuid.UUID
    source_type: str
    source_id: uuid.UUID | None
    category: ActionCategory
    title: str
    description: str
    affected_urls: list[str] | None
    impact_score: int
    effort_score: int
    priority: str
    status: str
    created_at: datetime
    completed_at: datetime | None
    roi_score: float

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        instance.roi_score = round(obj.impact_score / max(obj.effort_score, 1), 2)
        return instance


class ActionItemUpdate(BaseModel):
    status: str | None = None


class ActionSummaryResponse(BaseModel):
    by_priority: dict[str, int]
    by_category: dict[str, int]
    by_status: dict[str, int]
    total: int
