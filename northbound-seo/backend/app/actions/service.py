import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.actions.models import ActionItem, ActionCategory
from app.common.exceptions import NotFoundError


def _assign_priority(impact_score: int, effort_score: int) -> str:
    """Assign priority based on impact and effort scores."""
    if impact_score >= 8 and effort_score <= 4:
        return "P0"
    elif impact_score >= 6:
        return "P1"
    elif impact_score >= 4:
        return "P2"
    else:
        return "P3"


def _map_audit_category_to_action_category(issue_category: str) -> ActionCategory:
    mapping = {
        "meta_tags": ActionCategory.on_page_seo,
        "headings": ActionCategory.on_page_seo,
        "content": ActionCategory.content,
        "images": ActionCategory.performance,
        "links": ActionCategory.technical_seo,
        "schema": ActionCategory.schema_markup,
        "performance": ActionCategory.performance,
        "mobile": ActionCategory.technical_seo,
        "security": ActionCategory.technical_seo,
        "crawlability": ActionCategory.technical_seo,
        "indexability": ActionCategory.technical_seo,
    }
    return mapping.get(issue_category, ActionCategory.technical_seo)


async def generate_actions_from_audit(
    audit_id: uuid.UUID,
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> list[ActionItem]:
    """Convert top audit issues into ActionItems."""
    from app.audits.models import AuditIssue

    # Get top 20 issues by impact score
    result = await db.execute(
        select(AuditIssue)
        .where(AuditIssue.audit_id == audit_id)
        .order_by(AuditIssue.impact_score.desc())
        .limit(20)
    )
    issues = list(result.scalars().all())

    action_items = []
    for issue in issues:
        category_val = issue.category if isinstance(issue.category, str) else issue.category.value
        category = _map_audit_category_to_action_category(category_val)
        priority = _assign_priority(issue.impact_score, issue.effort_score)

        affected_urls = [issue.affected_url] if issue.affected_url else []

        action = ActionItem(
            id=uuid.uuid4(),
            project_id=project_id,
            tenant_id=tenant_id,
            source_type="audit",
            source_id=audit_id,
            category=category,
            title=issue.title,
            description=f"{issue.description}\n\nRecommendation: {issue.recommended}",
            affected_urls=affected_urls,
            impact_score=issue.impact_score,
            effort_score=issue.effort_score,
            priority=priority,
            status="open",
        )
        db.add(action)
        action_items.append(action)

    await db.flush()
    return action_items


async def generate_actions_from_keywords(
    research_id: uuid.UUID,
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> list[ActionItem]:
    """Convert keyword opportunities into ActionItems."""
    from app.keywords.models import Keyword

    # Get top opportunity keywords
    result = await db.execute(
        select(Keyword)
        .where(
            Keyword.research_id == research_id,
            Keyword.opportunity == True,
        )
        .order_by(Keyword.search_volume.desc().nullslast())
        .limit(10)
    )
    keywords = list(result.scalars().all())

    action_items = []
    for kw in keywords:
        volume = kw.search_volume or 0
        difficulty = kw.keyword_difficulty or 50

        # Compute scores: high volume = high impact; high difficulty = high effort
        impact = min(10, max(1, round(volume / 500))) if volume > 0 else 5
        effort = min(10, max(1, round(difficulty / 10)))
        priority = _assign_priority(impact, effort)

        action = ActionItem(
            id=uuid.uuid4(),
            project_id=project_id,
            tenant_id=tenant_id,
            source_type="keyword",
            source_id=research_id,
            category=ActionCategory.content,
            title=f"Create content targeting \"{kw.keyword}\"",
            description=(
                f"The keyword \"{kw.keyword}\" has {volume:,} monthly searches "
                f"and difficulty {difficulty}/100 but no matching page on your site. "
                f"Creating targeted content for this keyword represents a traffic opportunity."
            ),
            affected_urls=[],
            impact_score=impact,
            effort_score=effort,
            priority=priority,
            status="open",
        )
        db.add(action)
        action_items.append(action)

    await db.flush()
    return action_items


async def generate_actions_from_competitors(
    analysis_id: uuid.UUID,
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> list[ActionItem]:
    """Convert high-score competitor gaps into ActionItems."""
    from app.competitors.models import CompetitorGap, GapType

    result = await db.execute(
        select(CompetitorGap)
        .where(
            CompetitorGap.analysis_id == analysis_id,
            CompetitorGap.opportunity_score >= 6,
        )
        .order_by(CompetitorGap.opportunity_score.desc())
        .limit(15)
    )
    gaps = list(result.scalars().all())

    action_items = []
    for gap in gaps:
        gap_type_val = gap.gap_type.value if hasattr(gap.gap_type, "value") else gap.gap_type

        if gap_type_val == "keyword":
            category = ActionCategory.content
        elif gap_type_val == "content":
            category = ActionCategory.content
        elif gap_type_val == "technical":
            category = ActionCategory.technical_seo
        else:
            category = ActionCategory.content

        impact = min(10, max(1, gap.opportunity_score))
        effort = 5  # Default effort for competitor-driven actions
        priority = _assign_priority(impact, effort)

        keyword_info = ""
        if gap.keyword:
            vol_info = f" ({gap.search_volume:,} searches/mo)" if gap.search_volume else ""
            keyword_info = f" Target keyword: \"{gap.keyword}\"{vol_info}."

        action = ActionItem(
            id=uuid.uuid4(),
            project_id=project_id,
            tenant_id=tenant_id,
            source_type="competitor",
            source_id=analysis_id,
            category=category,
            title=gap.title,
            description=f"{gap.description}{keyword_info}",
            affected_urls=[],
            impact_score=impact,
            effort_score=effort,
            priority=priority,
            status="open",
        )
        db.add(action)
        action_items.append(action)

    await db.flush()
    return action_items


async def get_actions(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
    priority: str | None = None,
    category: str | None = None,
    status: str | None = None,
    source_type: str | None = None,
) -> list[ActionItem]:
    query = select(ActionItem).where(
        ActionItem.project_id == project_id,
        ActionItem.tenant_id == tenant_id,
    )
    if priority:
        query = query.where(ActionItem.priority == priority)
    if category:
        query = query.where(ActionItem.category == category)
    if status:
        query = query.where(ActionItem.status == status)
    if source_type:
        query = query.where(ActionItem.source_type == source_type)
    query = query.order_by(ActionItem.priority.asc(), ActionItem.impact_score.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def regenerate_actions(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> list[ActionItem]:
    """Wipe and re-generate all action items for a project from existing sources."""
    # Delete existing open actions
    existing_result = await db.execute(
        select(ActionItem).where(
            ActionItem.project_id == project_id,
            ActionItem.status == "open",
        )
    )
    for action in existing_result.scalars():
        await db.delete(action)
    await db.flush()

    all_actions = []

    # Re-generate from latest audit
    from app.audits.models import Audit
    latest_audit_result = await db.execute(
        select(Audit)
        .where(Audit.project_id == project_id, Audit.status == "completed")
        .order_by(Audit.completed_at.desc())
        .limit(1)
    )
    latest_audit = latest_audit_result.scalar_one_or_none()
    if latest_audit:
        audit_actions = await generate_actions_from_audit(
            audit_id=latest_audit.id,
            project_id=project_id,
            tenant_id=tenant_id,
            db=db,
        )
        all_actions.extend(audit_actions)

    # Re-generate from latest keyword research
    from app.keywords.models import KeywordResearch
    latest_research_result = await db.execute(
        select(KeywordResearch)
        .where(
            KeywordResearch.project_id == project_id,
            KeywordResearch.status == "completed",
        )
        .order_by(KeywordResearch.completed_at.desc())
        .limit(1)
    )
    latest_research = latest_research_result.scalar_one_or_none()
    if latest_research:
        kw_actions = await generate_actions_from_keywords(
            research_id=latest_research.id,
            project_id=project_id,
            tenant_id=tenant_id,
            db=db,
        )
        all_actions.extend(kw_actions)

    # Re-generate from latest competitor analysis
    from app.competitors.models import CompetitorAnalysis
    latest_analysis_result = await db.execute(
        select(CompetitorAnalysis)
        .where(
            CompetitorAnalysis.project_id == project_id,
            CompetitorAnalysis.status == "completed",
        )
        .order_by(CompetitorAnalysis.completed_at.desc())
        .limit(1)
    )
    latest_analysis = latest_analysis_result.scalar_one_or_none()
    if latest_analysis:
        comp_actions = await generate_actions_from_competitors(
            analysis_id=latest_analysis.id,
            project_id=project_id,
            tenant_id=tenant_id,
            db=db,
        )
        all_actions.extend(comp_actions)

    await db.flush()
    return all_actions
