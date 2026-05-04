import uuid
import asyncio
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import BackgroundTasks
from app.common.database import async_session_factory
from app.competitors.models import Competitor, CompetitorAnalysis, CompetitorGap, GapType
from app.competitors.schemas import CompetitorCreate, CompetitorAnalysisCreate
from app.keywords.dataforseo import DataForSEOClient
from app.projects.models import Project

logger = logging.getLogger("northbound.competitors")


async def create_competitor(
    project_id: uuid.UUID,
    data: CompetitorCreate,
    db: AsyncSession,
) -> Competitor:
    competitor = Competitor(
        id=uuid.uuid4(),
        project_id=project_id,
        url=data.url,
        name=data.name,
        is_auto_detected=False,
    )
    db.add(competitor)
    await db.flush()
    await db.refresh(competitor)
    return competitor


async def start_competitor_analysis(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    data: CompetitorAnalysisCreate,
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> CompetitorAnalysis:
    # If no competitor_ids provided, use all project competitors
    competitor_ids = data.competitor_ids
    if not competitor_ids:
        result = await db.execute(
            select(Competitor.id).where(Competitor.project_id == project_id)
        )
        competitor_ids = list(result.scalars().all())

    analysis = CompetitorAnalysis(
        id=uuid.uuid4(),
        project_id=project_id,
        tenant_id=tenant_id,
        status="queued",
        competitor_ids=competitor_ids,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)

    background_tasks.add_task(run_competitor_pipeline, analysis.id, project_id)
    return analysis


async def run_competitor_pipeline(analysis_id: uuid.UUID, project_id: uuid.UUID) -> None:
    """Full competitor analysis pipeline."""
    async with async_session_factory() as db:
        try:
            analysis_result = await db.execute(
                select(CompetitorAnalysis).where(CompetitorAnalysis.id == analysis_id)
            )
            analysis = analysis_result.scalar_one_or_none()
            if not analysis:
                return

            project_result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                return

            analysis.status = "running"
            await db.commit()

            dfs = DataForSEOClient()
            project_domain = urlparse(project.url).netloc.replace("www.", "")

            # Get project keywords
            project_kw_data = await dfs.get_domain_keywords(project_domain)
            project_keywords_set = {kw.keyword.lower() for kw in project_kw_data}

            # Load competitors
            competitor_ids = analysis.competitor_ids or []
            if competitor_ids:
                comp_result = await db.execute(
                    select(Competitor).where(Competitor.id.in_(competitor_ids))
                )
                competitors = list(comp_result.scalars().all())
            else:
                comp_result = await db.execute(
                    select(Competitor).where(Competitor.project_id == project_id)
                )
                competitors = list(comp_result.scalars().all())

            if not competitors:
                analysis.status = "completed"
                analysis.completed_at = datetime.now(timezone.utc)
                analysis.summary = {"message": "No competitors to analyze"}
                await db.commit()
                return

            # Fetch keyword data for all competitors concurrently
            competitor_tasks = []
            for comp in competitors:
                comp_domain = urlparse(comp.url).netloc.replace("www.", "")
                competitor_tasks.append(dfs.get_domain_keywords(comp_domain))

            competitor_results = await asyncio.gather(*competitor_tasks, return_exceptions=True)

            # Use AI to analyze gaps
            from app.ai.client import AIClient
            ai = AIClient()

            competitor_data_for_ai = []
            for comp, kw_result in zip(competitors, competitor_results):
                if isinstance(kw_result, Exception):
                    continue
                comp_keywords = [
                    {
                        "keyword": kw.keyword,
                        "search_volume": kw.search_volume or 0,
                        "difficulty": kw.keyword_difficulty or 50,
                    }
                    for kw in kw_result
                ]
                competitor_data_for_ai.append({
                    "competitor_id": str(comp.id),
                    "competitor_url": comp.url,
                    "competitor_name": comp.name or comp.url,
                    "keywords": comp_keywords[:100],  # Limit for AI call
                })

            your_keywords_list = [kw.keyword for kw in project_kw_data[:100]]
            gaps_data = await ai.analyze_competitor_gaps(your_keywords_list, competitor_data_for_ai)

            # Save gaps
            gap_records = []
            for gap in gaps_data:
                competitor_id_str = gap.get("competitor_id")
                try:
                    competitor_id = uuid.UUID(competitor_id_str) if competitor_id_str else competitors[0].id
                except (ValueError, IndexError):
                    competitor_id = competitors[0].id if competitors else None

                if not competitor_id:
                    continue

                try:
                    gap_type = GapType(gap.get("gap_type", "keyword"))
                except ValueError:
                    gap_type = GapType.keyword

                opportunity_score = min(10, max(1, int(gap.get("opportunity_score", 5))))

                gap_obj = CompetitorGap(
                    id=uuid.uuid4(),
                    analysis_id=analysis_id,
                    competitor_id=competitor_id,
                    gap_type=gap_type,
                    title=gap.get("title", "Keyword gap"),
                    description=gap.get("description", ""),
                    competitor_value=gap.get("competitor_value"),
                    your_value=gap.get("your_value"),
                    opportunity_score=opportunity_score,
                    keyword=gap.get("keyword"),
                    search_volume=gap.get("search_volume"),
                )
                db.add(gap_obj)
                gap_records.append(gap_obj)

            analysis.status = "completed"
            analysis.completed_at = datetime.now(timezone.utc)
            analysis.summary = {
                "total_gaps": len(gap_records),
                "competitors_analyzed": len(competitors),
                "your_keywords": len(project_keywords_set),
                "high_opportunity_gaps": sum(1 for g in gap_records if g.opportunity_score >= 7),
            }
            await db.commit()

            # Generate action items
            from app.actions.service import generate_actions_from_competitors
            await generate_actions_from_competitors(
                analysis_id=analysis_id,
                project_id=project_id,
                tenant_id=analysis.tenant_id,
                db=db,
            )
            await db.commit()

            logger.info(
                "Competitor analysis %s completed: %d gaps",
                analysis_id,
                len(gap_records),
            )

        except Exception as e:
            logger.exception("Competitor analysis %s failed: %s", analysis_id, str(e))
            try:
                async with async_session_factory() as error_db:
                    a = await error_db.get(CompetitorAnalysis, analysis_id)
                    if a:
                        a.status = "failed"
                        await error_db.commit()
            except Exception:
                pass
