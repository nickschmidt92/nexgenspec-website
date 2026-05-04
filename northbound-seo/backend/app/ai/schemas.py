from pydantic import BaseModel
from typing import Any


class KeywordClusterOutput(BaseModel):
    name: str
    intent: str
    keywords: list[str]


class ContentItemOutput(BaseModel):
    title: str
    content_type: str
    target_keywords: list[str]
    target_intent: str
    suggested_url: str | None = None
    word_count_min: int | None = None
    word_count_max: int | None = None
    outline: dict[str, Any] | None = None
    internal_links: list[str] = []
    priority: str = "P2"
    impact_score: int | None = None
    effort_score: int | None = None


class ContentPlanOutput(BaseModel):
    phase_30_day: list[ContentItemOutput]
    phase_60_day: list[ContentItemOutput]
    phase_90_day: list[ContentItemOutput]


class CompetitorGapOutput(BaseModel):
    competitor_id: str
    gap_type: str
    title: str
    description: str
    competitor_value: str | None = None
    your_value: str | None = None
    opportunity_score: int
    keyword: str | None = None
    search_volume: int | None = None
