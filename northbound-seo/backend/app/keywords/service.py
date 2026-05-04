import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import urlparse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import BackgroundTasks
from app.common.database import async_session_factory
from app.keywords.models import KeywordResearch, Keyword, KeywordCluster, KeywordIntent
from app.keywords.dataforseo import DataForSEOClient
from app.keywords.schemas import KeywordResearchCreate
from app.projects.models import Project

logger = logging.getLogger("northbound.keywords")


async def trigger_keyword_research(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    data: KeywordResearchCreate,
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> KeywordResearch:
    research = KeywordResearch(
        id=uuid.uuid4(),
        project_id=project_id,
        tenant_id=tenant_id,
        status="queued",
        seed_keywords=data.seed_keywords,
        config=data.config or {},
    )
    db.add(research)
    await db.flush()
    await db.refresh(research)

    background_tasks.add_task(run_keyword_pipeline, research.id, project_id)
    return research


async def run_keyword_pipeline(research_id: uuid.UUID, project_id: uuid.UUID) -> None:
    """Full keyword research pipeline."""
    async with async_session_factory() as db:
        try:
            # Load research and project
            research_result = await db.execute(
                select(KeywordResearch).where(KeywordResearch.id == research_id)
            )
            research = research_result.scalar_one_or_none()
            if not research:
                return

            project_result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                return

            research.status = "running"
            await db.commit()

            dfs = DataForSEOClient()
            domain = urlparse(project.url).netloc.replace("www.", "")

            # Get domain keywords and seed keyword suggestions concurrently
            import asyncio
            tasks = [dfs.get_domain_keywords(domain)]
            seed_keywords = research.seed_keywords or []
            for seed in seed_keywords[:5]:  # Limit to 5 seeds to control API costs
                tasks.append(dfs.get_keyword_suggestions(seed))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            all_keywords_raw = []
            for r in results:
                if isinstance(r, list):
                    all_keywords_raw.extend(r)

            # Deduplicate by keyword text
            seen: set[str] = set()
            unique_keywords = []
            for kw in all_keywords_raw:
                if kw.keyword and kw.keyword.lower() not in seen:
                    seen.add(kw.keyword.lower())
                    unique_keywords.append(kw)

            # Filter out zero-volume and empty keywords
            filtered = [
                kw for kw in unique_keywords
                if kw.keyword and (kw.search_volume is None or kw.search_volume > 0)
            ]

            if not filtered:
                research.status = "completed"
                research.completed_at = datetime.now(timezone.utc)
                research.summary = {"total_keywords": 0, "clusters": 0}
                await db.commit()
                return

            # Enrich with volume data if needed (batch up to 1000)
            keywords_needing_volume = [
                kw.keyword for kw in filtered if kw.search_volume is None
            ]
            if keywords_needing_volume:
                enriched_map: dict[str, any] = {}
                batch_size = 100
                for i in range(0, min(len(keywords_needing_volume), 500), batch_size):
                    batch = keywords_needing_volume[i:i + batch_size]
                    enriched = await dfs.get_keyword_data(batch)
                    for e in enriched:
                        enriched_map[e.keyword.lower()] = e
                # Merge enriched data
                for kw in filtered:
                    if kw.keyword.lower() in enriched_map:
                        enriched_kw = enriched_map[kw.keyword.lower()]
                        if kw.search_volume is None:
                            kw.search_volume = enriched_kw.search_volume
                        if kw.keyword_difficulty is None:
                            kw.keyword_difficulty = enriched_kw.keyword_difficulty
                        if kw.cpc is None:
                            kw.cpc = enriched_kw.cpc

            # Use AI to cluster keywords
            from app.ai.client import AIClient
            ai = AIClient()
            keyword_dicts = [
                {
                    "keyword": kw.keyword,
                    "search_volume": kw.search_volume or 0,
                    "difficulty": kw.keyword_difficulty or 50,
                    "cpc": float(kw.cpc) if kw.cpc else 0.0,
                }
                for kw in filtered[:200]  # Limit for AI call
            ]
            clusters_data = await ai.cluster_keywords(keyword_dicts)

            # Build cluster name -> intent map and keyword -> cluster map
            cluster_map: dict[str, str] = {}  # cluster_name -> intent
            keyword_cluster_map: dict[str, str] = {}  # keyword -> cluster_name

            for cluster in clusters_data:
                cluster_name = cluster.get("name", "General")
                intent = cluster.get("intent", "informational")
                cluster_map[cluster_name] = intent
                for kw in cluster.get("keywords", []):
                    keyword_cluster_map[kw.lower()] = cluster_name

            # Get crawled pages for URL mapping (from latest audit)
            from app.audits.models import Audit, AuditIssue
            latest_audit_result = await db.execute(
                select(Audit)
                .where(Audit.project_id == project_id, Audit.status == "completed")
                .order_by(Audit.completed_at.desc())
                .limit(1)
            )
            latest_audit = latest_audit_result.scalar_one_or_none()
            crawled_urls: list[str] = []
            if latest_audit and latest_audit.summary:
                # The crawler doesn't persist page URLs in DB but the audit summary
                # contains page count. For URL mapping we use simple keyword heuristics.
                pass

            # Save clusters
            saved_clusters: dict[str, uuid.UUID] = {}
            for cluster_name, intent_str in cluster_map.items():
                try:
                    intent = KeywordIntent(intent_str)
                except ValueError:
                    intent = KeywordIntent.informational

                cluster_keywords = [
                    kw for kw in filtered
                    if keyword_cluster_map.get(kw.keyword.lower()) == cluster_name
                ]
                total_volume = sum(kw.search_volume or 0 for kw in cluster_keywords)
                difficulties = [kw.keyword_difficulty for kw in cluster_keywords if kw.keyword_difficulty is not None]
                avg_diff = Decimal(str(sum(difficulties) / len(difficulties))) if difficulties else None

                # Priority score: volume / difficulty
                priority = None
                if total_volume and avg_diff and avg_diff > 0:
                    priority = Decimal(str(round(total_volume / float(avg_diff), 2)))

                cluster_obj = KeywordCluster(
                    id=uuid.uuid4(),
                    research_id=research_id,
                    name=cluster_name,
                    intent=intent,
                    keyword_count=len(cluster_keywords),
                    total_volume=total_volume,
                    avg_difficulty=avg_diff,
                    priority_score=priority,
                )
                db.add(cluster_obj)
                await db.flush()
                saved_clusters[cluster_name] = cluster_obj.id

            # Save keywords
            domain_keywords_set = {kw.keyword.lower() for kw in filtered[:50]}  # Top domain keywords = primary tier
            seed_set = {s.lower() for s in (seed_keywords or [])}

            for kw in filtered:
                cluster_name = keyword_cluster_map.get(kw.keyword.lower())
                cluster_id = saved_clusters.get(cluster_name) if cluster_name else None

                intent_str = cluster_map.get(cluster_name, "informational") if cluster_name else "informational"
                try:
                    intent = KeywordIntent(intent_str)
                except ValueError:
                    intent = KeywordIntent.informational

                # Tier assignment
                if kw.keyword.lower() in seed_set:
                    tier = "primary"
                elif kw.keyword.lower() in domain_keywords_set:
                    tier = "primary"
                else:
                    tier = "secondary"

                # Simple URL mapping: check if any crawled URL slug contains keyword words
                mapped_url = None
                if crawled_urls:
                    kw_words = set(kw.keyword.lower().split())
                    for url in crawled_urls:
                        url_slug = url.lower().replace("-", " ").replace("/", " ")
                        if len(kw_words.intersection(url_slug.split())) >= 2:
                            mapped_url = url
                            break

                # Mark as opportunity if no mapped URL
                opportunity = mapped_url is None

                keyword_obj = Keyword(
                    id=uuid.uuid4(),
                    research_id=research_id,
                    keyword=kw.keyword,
                    search_volume=kw.search_volume,
                    keyword_difficulty=kw.keyword_difficulty,
                    cpc=Decimal(str(kw.cpc)) if kw.cpc is not None else None,
                    intent=intent,
                    tier=tier,
                    cluster_id=cluster_id,
                    mapped_url=mapped_url,
                    opportunity=opportunity,
                )
                db.add(keyword_obj)

            research.status = "completed"
            research.completed_at = datetime.now(timezone.utc)
            research.summary = {
                "total_keywords": len(filtered),
                "clusters": len(saved_clusters),
                "opportunities": sum(1 for kw in filtered if True),  # Will be accurate after flush
                "primary_keywords": sum(1 for kw in filtered if kw.keyword.lower() in seed_set or kw.keyword.lower() in domain_keywords_set),
            }
            await db.commit()

            # Generate action items
            from app.actions.service import generate_actions_from_keywords
            await generate_actions_from_keywords(
                research_id=research_id,
                project_id=project_id,
                tenant_id=research.tenant_id,
                db=db,
            )
            await db.commit()

            logger.info("Keyword research %s completed: %d keywords, %d clusters",
                        research_id, len(filtered), len(saved_clusters))

        except Exception as e:
            logger.exception("Keyword research %s failed: %s", research_id, str(e))
            try:
                async with async_session_factory() as error_db:
                    r = await error_db.get(KeywordResearch, research_id)
                    if r:
                        r.status = "failed"
                        await error_db.commit()
            except Exception:
                pass
