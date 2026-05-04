import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import BackgroundTasks
from app.common.database import async_session_factory
from app.content.models import ContentPlan, ContentItem, ContentType
from app.content.schemas import ContentPlanCreate
from app.projects.models import Project

logger = logging.getLogger("northbound.content")


async def create_content_plan(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    data: ContentPlanCreate,
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> ContentPlan:
    plan = ContentPlan(
        id=uuid.uuid4(),
        project_id=project_id,
        tenant_id=tenant_id,
        name=data.name,
        status="queued",
        config=data.config or {},
    )
    db.add(plan)
    await db.flush()
    await db.refresh(plan)

    background_tasks.add_task(run_content_plan_pipeline, plan.id, project_id)
    return plan


async def run_content_plan_pipeline(plan_id: uuid.UUID, project_id: uuid.UUID) -> None:
    """Generate 30/60/90 day content plan using AI."""
    async with async_session_factory() as db:
        try:
            plan_result = await db.execute(
                select(ContentPlan).where(ContentPlan.id == plan_id)
            )
            plan = plan_result.scalar_one_or_none()
            if not plan:
                return

            project_result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                return

            plan.status = "running"
            await db.commit()

            # Load latest audit issues
            from app.audits.models import Audit, AuditIssue
            latest_audit_result = await db.execute(
                select(Audit)
                .where(Audit.project_id == project_id, Audit.status == "completed")
                .order_by(Audit.completed_at.desc())
                .limit(1)
            )
            latest_audit = latest_audit_result.scalar_one_or_none()

            audit_issues = []
            if latest_audit:
                issues_result = await db.execute(
                    select(AuditIssue)
                    .where(AuditIssue.audit_id == latest_audit.id)
                    .order_by(AuditIssue.impact_score.desc())
                    .limit(20)
                )
                for issue in issues_result.scalars():
                    audit_issues.append({
                        "category": issue.category if isinstance(issue.category, str) else issue.category.value,
                        "severity": issue.severity if isinstance(issue.severity, str) else issue.severity.value,
                        "title": issue.title,
                        "description": issue.description,
                    })

            # Load keyword opportunities
            from app.keywords.models import KeywordResearch, Keyword
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

            keywords_data = []
            if latest_research:
                kw_result = await db.execute(
                    select(Keyword)
                    .where(
                        Keyword.research_id == latest_research.id,
                        Keyword.opportunity == True,
                    )
                    .order_by(Keyword.search_volume.desc().nullslast())
                    .limit(50)
                )
                for kw in kw_result.scalars():
                    keywords_data.append({
                        "keyword": kw.keyword,
                        "search_volume": kw.search_volume or 0,
                        "intent": kw.intent.value if kw.intent and hasattr(kw.intent, "value") else str(kw.intent or "informational"),
                    })

            # Load competitor gaps
            from app.competitors.models import CompetitorAnalysis, CompetitorGap
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

            gaps_data = []
            if latest_analysis:
                gaps_result = await db.execute(
                    select(CompetitorGap)
                    .where(CompetitorGap.analysis_id == latest_analysis.id)
                    .order_by(CompetitorGap.opportunity_score.desc())
                    .limit(20)
                )
                for gap in gaps_result.scalars():
                    gaps_data.append({
                        "title": gap.title,
                        "gap_type": gap.gap_type.value if hasattr(gap.gap_type, "value") else gap.gap_type,
                        "keyword": gap.keyword,
                        "search_volume": gap.search_volume,
                        "opportunity_score": gap.opportunity_score,
                    })

            project_info = {
                "name": project.name,
                "url": project.url,
                "industry": project.industry,
                "geography": project.geography,
                "revenue_model": project.revenue_model,
                "business_info": project.business_info or {},
            }

            # Call AI to generate the plan
            from app.ai.client import AIClient
            ai = AIClient()
            plan_output = await ai.generate_content_plan(
                project_info=project_info,
                keywords=keywords_data,
                gaps=gaps_data,
                issues=audit_issues,
            )

            # Save content items
            items_saved = 0
            phases_data = {
                "30_day": plan_output.get("phase_30_day", []),
                "60_day": plan_output.get("phase_60_day", []),
                "90_day": plan_output.get("phase_90_day", []),
            }

            for phase_key, items in phases_data.items():
                for item_data in items:
                    try:
                        content_type = ContentType(item_data.get("content_type", "blog_post"))
                    except ValueError:
                        content_type = ContentType.blog_post

                    priority = item_data.get("priority", "P2")
                    if priority not in ("P0", "P1", "P2", "P3"):
                        priority = "P2"

                    content_item = ContentItem(
                        id=uuid.uuid4(),
                        plan_id=plan_id,
                        title=item_data.get("title", "Untitled"),
                        content_type=content_type,
                        target_keywords=item_data.get("target_keywords", []),
                        target_intent=item_data.get("target_intent"),
                        suggested_url=item_data.get("suggested_url"),
                        word_count_min=item_data.get("word_count_min"),
                        word_count_max=item_data.get("word_count_max"),
                        outline=item_data.get("outline"),
                        internal_links=item_data.get("internal_links", []),
                        phase=phase_key,
                        priority=priority,
                        impact_score=item_data.get("impact_score"),
                        effort_score=item_data.get("effort_score"),
                        status="planned",
                    )
                    db.add(content_item)
                    items_saved += 1

            plan.status = "completed"
            plan.completed_at = datetime.now(timezone.utc)
            plan.summary = {
                "total_items": items_saved,
                "phase_30_day": len(phases_data["30_day"]),
                "phase_60_day": len(phases_data["60_day"]),
                "phase_90_day": len(phases_data["90_day"]),
            }
            await db.commit()
            logger.info("Content plan %s completed: %d items", plan_id, items_saved)

        except Exception as e:
            logger.exception("Content plan %s failed: %s", plan_id, str(e))
            try:
                async with async_session_factory() as error_db:
                    p = await error_db.get(ContentPlan, plan_id)
                    if p:
                        p.status = "failed"
                        await error_db.commit()
            except Exception:
                pass
