import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB, ARRAY
from app.common.database import Base


class ContentType(str, enum.Enum):
    blog_post = "blog_post"
    landing_page = "landing_page"
    faq_page = "faq_page"
    pillar_page = "pillar_page"
    comparison_page = "comparison_page"
    how_to_guide = "how_to_guide"
    case_study = "case_study"


class ContentPlan(Base):
    __tablename__ = "content_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String, nullable=False, default="30/60/90 Day Plan")
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    config: Mapped[dict | None] = mapped_column(JSONB)
    summary: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ContentItem(Base):
    __tablename__ = "content_items"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("content_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[ContentType] = mapped_column(String, nullable=False)
    target_keywords: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    target_intent: Mapped[str | None] = mapped_column(String)
    suggested_url: Mapped[str | None] = mapped_column(String)
    word_count_min: Mapped[int | None] = mapped_column(Integer)
    word_count_max: Mapped[int | None] = mapped_column(Integer)
    outline: Mapped[dict | None] = mapped_column(JSONB)
    internal_links: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    phase: Mapped[str] = mapped_column(String, nullable=False, default="30_day")
    priority: Mapped[str] = mapped_column(String, nullable=False, default="P2")
    impact_score: Mapped[int | None] = mapped_column(Integer)
    effort_score: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, nullable=False, default="planned")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
