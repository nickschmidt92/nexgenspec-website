import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, func, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB, ARRAY
from app.common.database import Base


class KeywordIntent(str, enum.Enum):
    informational = "informational"
    transactional = "transactional"
    navigational = "navigational"
    commercial = "commercial"


class KeywordResearch(Base):
    __tablename__ = "keyword_research"

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
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    seed_keywords: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    config: Mapped[dict | None] = mapped_column(JSONB)
    summary: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class KeywordCluster(Base):
    __tablename__ = "keyword_clusters"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    research_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("keyword_research.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    intent: Mapped[KeywordIntent] = mapped_column(String, nullable=False)
    keyword_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_volume: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_difficulty: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    priority_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    research_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("keyword_research.id", ondelete="CASCADE"),
        nullable=False,
    )
    keyword: Mapped[str] = mapped_column(String, nullable=False)
    search_volume: Mapped[int | None] = mapped_column(Integer)
    keyword_difficulty: Mapped[int | None] = mapped_column(Integer)
    cpc: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    intent: Mapped[KeywordIntent | None] = mapped_column(String)
    tier: Mapped[str] = mapped_column(String, nullable=False, default="secondary")
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("keyword_clusters.id", ondelete="SET NULL"),
        nullable=True,
    )
    mapped_url: Mapped[str | None] = mapped_column(String)
    opportunity: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
