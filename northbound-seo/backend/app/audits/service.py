import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import BackgroundTasks
from app.common.database import async_session_factory
from app.audits.models import Audit, AuditIssue, AuditStatus
from app.audits.schemas import AuditIssueCreate
from app.audits.crawler import crawl_site
from app.audits.analyzer import analyze_crawl
from app.audits.scorer import compute_score
from app.projects.models import Project

logger = logging.getLogger("northbound.audits")


async def create_audit(
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> Audit:
    """Create an Audit record in queued state and kick off background pipeline."""
    audit = Audit(
        id=uuid.uuid4(),
        project_id=project_id,
        tenant_id=tenant_id,
        status=AuditStatus.queued,
        pages_crawled=0,
    )
    db.add(audit)
    await db.flush()
    await db.refresh(audit)

    background_tasks.add_task(run_audit_pipeline, audit.id, project_id)
    return audit


async def run_audit_pipeline(audit_id: uuid.UUID, project_id: uuid.UUID) -> None:
    """Full audit pipeline: crawl -> analyze -> score -> save."""
    async with async_session_factory() as db:
        try:
            # Load project
            project_result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                logger.error("Audit %s: project %s not found", audit_id, project_id)
                return

            # Update to crawling
            audit_result = await db.execute(
                select(Audit).where(Audit.id == audit_id)
            )
            audit = audit_result.scalar_one_or_none()
            if not audit:
                return

            audit.status = AuditStatus.crawling
            audit.started_at = datetime.now(timezone.utc)
            await db.commit()

            # Crawl
            logger.info("Audit %s: starting crawl of %s", audit_id, project.url)
            crawl_result = await crawl_site(project.url, max_pages=50)

            # Update to analyzing
            audit.status = AuditStatus.analyzing
            audit.pages_crawled = len(crawl_result.pages)
            await db.commit()

            # Analyze
            logger.info("Audit %s: analyzing %d pages", audit_id, len(crawl_result.pages))
            issues = analyze_crawl(crawl_result)

            # Score
            score, breakdown = compute_score(issues)

            # Save issues
            issue_records = []
            for issue_data in issues:
                issue = AuditIssue(
                    id=uuid.uuid4(),
                    audit_id=audit_id,
                    severity=issue_data.severity,
                    category=issue_data.category,
                    title=issue_data.title,
                    description=issue_data.description,
                    affected_url=issue_data.affected_url,
                    current_value=issue_data.current_value,
                    recommended=issue_data.recommended,
                    impact_score=issue_data.impact_score,
                    effort_score=issue_data.effort_score,
                )
                db.add(issue)
                issue_records.append(issue)

            # Build summary
            severity_counts: dict[str, int] = {}
            category_counts: dict[str, int] = {}
            for issue in issues:
                sev = issue.severity.value if hasattr(issue.severity, "value") else issue.severity
                cat = issue.category.value if hasattr(issue.category, "value") else issue.category
                severity_counts[sev] = severity_counts.get(sev, 0) + 1
                category_counts[cat] = category_counts.get(cat, 0) + 1

            summary = {
                "total_issues": len(issues),
                "severity_counts": severity_counts,
                "category_counts": category_counts,
                "pages_crawled": len(crawl_result.pages),
                "sitemap_found": crawl_result.sitemap_found,
                "robots_txt_found": crawl_result.robots_txt_found,
            }

            # Complete audit
            audit.status = AuditStatus.completed
            audit.score = score
            audit.score_breakdown = breakdown
            audit.summary = summary
            audit.completed_at = datetime.now(timezone.utc)
            await db.commit()

            # Generate action items from issues
            await _generate_actions_from_audit_issues(
                audit_id=audit_id,
                project_id=project_id,
                tenant_id=audit.tenant_id,
                issues=issue_records,
                db=db,
            )
            await db.commit()

            logger.info("Audit %s completed: score=%d, issues=%d", audit_id, score, len(issues))

        except Exception as e:
            logger.exception("Audit %s failed: %s", audit_id, str(e))
            try:
                async with async_session_factory() as error_db:
                    error_audit = await error_db.get(Audit, audit_id)
                    if error_audit:
                        error_audit.status = AuditStatus.failed
                        error_audit.error_message = str(e)
                        await error_db.commit()
            except Exception:
                pass


async def _generate_actions_from_audit_issues(
    audit_id: uuid.UUID,
    project_id: uuid.UUID,
    tenant_id: uuid.UUID,
    issues: list[AuditIssue],
    db: AsyncSession,
) -> None:
    """Convert audit issues into ActionItems."""
    from app.actions.service import generate_actions_from_audit
    await generate_actions_from_audit(
        audit_id=audit_id,
        project_id=project_id,
        tenant_id=tenant_id,
        db=db,
    )
