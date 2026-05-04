from urllib.parse import urlparse
from app.audits.crawler import CrawlResult, PageData
from app.audits.schemas import AuditIssueCreate
from app.audits.models import IssueSeverity, IssueCategory


def analyze_crawl(crawl_result: CrawlResult) -> list[AuditIssueCreate]:
    """Analyze a crawl result and return a list of SEO issues."""
    issues: list[AuditIssueCreate] = []
    pages = crawl_result.pages

    if not pages:
        return issues

    homepage = pages[0]

    # ----------------------------------------------------------------
    # SECURITY
    # ----------------------------------------------------------------
    if crawl_result.base_url.startswith("http://"):
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.critical,
            category=IssueCategory.security,
            title="Site not served over HTTPS",
            description="Your site is served over HTTP rather than HTTPS. This is a significant security risk and a negative ranking signal for Google.",
            affected_url=crawl_result.base_url,
            current_value="http://",
            recommended="Migrate the entire site to HTTPS and set up 301 redirects from all HTTP URLs.",
            impact_score=10,
            effort_score=4,
        ))

    # ----------------------------------------------------------------
    # CRAWLABILITY
    # ----------------------------------------------------------------
    if not crawl_result.sitemap_found:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.high,
            category=IssueCategory.crawlability,
            title="No sitemap.xml found",
            description="No sitemap.xml was detected at the root of your domain. Sitemaps help search engines discover and index your pages efficiently.",
            affected_url=None,
            current_value="Not found",
            recommended="Create and submit an XML sitemap at /sitemap.xml and register it in Google Search Console.",
            impact_score=7,
            effort_score=3,
        ))

    if not crawl_result.robots_txt_found:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.medium,
            category=IssueCategory.crawlability,
            title="No robots.txt found",
            description="No robots.txt file was found. While not mandatory, it signals to crawlers how to navigate your site and can prevent unwanted areas from being indexed.",
            affected_url=None,
            current_value="Not found",
            recommended="Create a robots.txt file at the root of your domain with appropriate crawl directives and a Sitemap reference.",
            impact_score=4,
            effort_score=2,
        ))

    # ----------------------------------------------------------------
    # MOBILE
    # ----------------------------------------------------------------
    pages_without_viewport = [p for p in pages if not p.has_viewport_meta]
    if pages_without_viewport:
        for page in pages_without_viewport:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.critical,
                category=IssueCategory.mobile,
                title="Missing viewport meta tag",
                description="This page does not have a viewport meta tag, which is required for proper rendering on mobile devices and is a Google ranking factor.",
                affected_url=page.url,
                current_value="Not present",
                recommended='Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head> of every page.',
                impact_score=9,
                effort_score=2,
            ))

    # ----------------------------------------------------------------
    # META TAGS
    # ----------------------------------------------------------------
    # Missing meta description
    for page in pages:
        is_homepage = page.url == crawl_result.base_url or page.url.rstrip("/") == crawl_result.base_url.rstrip("/")
        if page.meta_description is None:
            severity = IssueSeverity.critical if is_homepage else IssueSeverity.high
            issues.append(AuditIssueCreate(
                severity=severity,
                category=IssueCategory.meta_tags,
                title="Missing meta description",
                description=f"This page has no meta description. Meta descriptions are used in search results and significantly influence click-through rates.",
                affected_url=page.url,
                current_value="Not present",
                recommended="Add a unique, keyword-rich meta description of 120-160 characters for this page.",
                impact_score=8 if is_homepage else 6,
                effort_score=2,
            ))
        elif len(page.meta_description) < 50:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.medium,
                category=IssueCategory.meta_tags,
                title="Meta description too short",
                description=f"The meta description on this page is only {len(page.meta_description)} characters. Short descriptions miss the opportunity to attract clicks.",
                affected_url=page.url,
                current_value=page.meta_description,
                recommended="Expand the meta description to 120-160 characters with relevant keywords and a compelling call-to-action.",
                impact_score=5,
                effort_score=2,
            ))
        elif len(page.meta_description) > 160:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.medium,
                category=IssueCategory.meta_tags,
                title="Meta description too long",
                description=f"The meta description on this page is {len(page.meta_description)} characters, which exceeds the 160-character limit and will be truncated in search results.",
                affected_url=page.url,
                current_value=page.meta_description[:100] + "...",
                recommended="Trim the meta description to 120-160 characters while preserving the most important information.",
                impact_score=4,
                effort_score=2,
            ))

    # Missing title
    for page in pages:
        if not page.title:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.critical,
                category=IssueCategory.meta_tags,
                title="Missing title tag",
                description="This page has no title tag, which is one of the most important on-page SEO elements.",
                affected_url=page.url,
                current_value="Not present",
                recommended="Add a unique, descriptive title tag of 50-60 characters including the primary keyword.",
                impact_score=10,
                effort_score=2,
            ))

    # Duplicate title tags
    title_map: dict[str, list[str]] = {}
    for page in pages:
        if page.title:
            title_map.setdefault(page.title, []).append(page.url)
    for title, urls in title_map.items():
        if len(urls) > 1:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.high,
                category=IssueCategory.meta_tags,
                title="Duplicate title tags detected",
                description=f"The title \"{title}\" is shared across {len(urls)} pages. Duplicate titles confuse search engines about which page to rank.",
                affected_url=urls[0],
                current_value=f"Used on: {', '.join(urls[:3])}{'...' if len(urls) > 3 else ''}",
                recommended="Write unique, descriptive title tags for each page that accurately reflect the page content.",
                impact_score=7,
                effort_score=3,
            ))

    # OG tags
    for page in pages:
        if not page.og_title or not page.og_description:
            missing = []
            if not page.og_title:
                missing.append("og:title")
            if not page.og_description:
                missing.append("og:description")
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.medium,
                category=IssueCategory.meta_tags,
                title=f"Missing Open Graph tags: {', '.join(missing)}",
                description="Open Graph tags control how your page appears when shared on social media. Missing tags result in poor social previews.",
                affected_url=page.url,
                current_value="Not present",
                recommended=f"Add {', '.join(missing)} meta tags to optimize social sharing previews for this page.",
                impact_score=4,
                effort_score=2,
            ))

    # ----------------------------------------------------------------
    # HEADINGS
    # ----------------------------------------------------------------
    for page in pages:
        if not page.h1_tags:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.high,
                category=IssueCategory.headings,
                title="Missing H1 tag",
                description="This page has no H1 heading. The H1 is a primary on-page signal that tells search engines what the page is about.",
                affected_url=page.url,
                current_value="Not present",
                recommended="Add a single H1 heading that clearly describes the page topic and includes the primary keyword.",
                impact_score=8,
                effort_score=2,
            ))
        elif len(page.h1_tags) > 1:
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.medium,
                category=IssueCategory.headings,
                title="Multiple H1 tags on page",
                description=f"This page has {len(page.h1_tags)} H1 headings. Multiple H1s dilute the heading hierarchy and can confuse search engines.",
                affected_url=page.url,
                current_value=f"{len(page.h1_tags)} H1 tags found",
                recommended="Keep only one H1 per page. Convert additional H1s to H2 or H3 headings.",
                impact_score=5,
                effort_score=2,
            ))
        else:
            # Check for empty H1
            if not page.h1_tags[0].strip():
                issues.append(AuditIssueCreate(
                    severity=IssueSeverity.high,
                    category=IssueCategory.headings,
                    title="Empty H1 tag",
                    description="This page has an H1 tag that contains no visible text. Empty headings provide no SEO value.",
                    affected_url=page.url,
                    current_value="<h1></h1>",
                    recommended="Fill the H1 tag with a descriptive, keyword-rich heading.",
                    impact_score=7,
                    effort_score=2,
                ))

    # ----------------------------------------------------------------
    # CONTENT
    # ----------------------------------------------------------------
    very_thin_pages = [p for p in pages if p.word_count < 100]
    thin_pages = [p for p in pages if 100 <= p.word_count < 300]

    for page in very_thin_pages:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.critical,
            category=IssueCategory.content,
            title="Very thin content page",
            description=f"This page has only {page.word_count} words, which is far below the minimum threshold for quality content. Search engines may penalize or ignore thin content pages.",
            affected_url=page.url,
            current_value=f"{page.word_count} words",
            recommended="Expand page content to at least 300-500 words with original, useful information that serves user intent.",
            impact_score=9,
            effort_score=6,
        ))

    if len(thin_pages) > 3:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.high,
            category=IssueCategory.content,
            title=f"Thin content on {len(thin_pages)} pages",
            description=f"{len(thin_pages)} pages have fewer than 300 words. Thin content is a known negative signal in Google's quality assessment.",
            affected_url=None,
            current_value=f"{len(thin_pages)} pages with <300 words",
            recommended="Audit thin content pages. Either expand them with valuable information or consolidate them with related pages.",
            impact_score=7,
            effort_score=7,
        ))

    # ----------------------------------------------------------------
    # IMAGES
    # ----------------------------------------------------------------
    pages_with_missing_alt: list[tuple[str, int]] = []
    pages_without_lazy: list[tuple[str, int]] = []
    pages_with_non_webp: list[tuple[str, int]] = []

    for page in pages:
        missing_alt = sum(1 for img in page.images if img.get("alt") is None)
        no_lazy = sum(1 for img in page.images if img.get("loading") != "lazy")
        non_webp = sum(
            1 for img in page.images
            if img.get("format") in ("png", "jpg", "jpeg", "bmp", "gif")
        )
        if missing_alt:
            pages_with_missing_alt.append((page.url, missing_alt))
        if no_lazy:
            pages_without_lazy.append((page.url, no_lazy))
        if non_webp:
            pages_with_non_webp.append((page.url, non_webp))

    for url, count in pages_with_missing_alt:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.medium,
            category=IssueCategory.images,
            title="Images missing alt text",
            description=f"{count} image(s) on this page are missing alt attributes. Alt text is critical for accessibility and helps search engines understand image content.",
            affected_url=url,
            current_value=f"{count} images without alt text",
            recommended="Add descriptive alt text to all images. Use relevant keywords naturally. Use empty alt=\"\" for purely decorative images.",
            impact_score=6,
            effort_score=3,
        ))

    if pages_without_lazy:
        total_no_lazy = sum(c for _, c in pages_without_lazy)
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.low,
            category=IssueCategory.images,
            title="Images not using lazy loading",
            description=f"{total_no_lazy} images across {len(pages_without_lazy)} pages are not using lazy loading. Lazy loading improves page load time and Core Web Vitals.",
            affected_url=pages_without_lazy[0][0] if pages_without_lazy else None,
            current_value=f"{total_no_lazy} images without loading=\"lazy\"",
            recommended='Add loading="lazy" attribute to all images below the fold.',
            impact_score=4,
            effort_score=2,
        ))

    if pages_with_non_webp:
        total_non_webp = sum(c for _, c in pages_with_non_webp)
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.low,
            category=IssueCategory.images,
            title="Images not in next-gen format (WebP/AVIF)",
            description=f"{total_non_webp} images across {len(pages_with_non_webp)} pages are in PNG/JPEG format instead of WebP or AVIF. Modern formats are significantly smaller.",
            affected_url=pages_with_non_webp[0][0] if pages_with_non_webp else None,
            current_value=f"{total_non_webp} PNG/JPEG images",
            recommended="Convert images to WebP or AVIF format to reduce file sizes by 25-50% with equivalent quality.",
            impact_score=5,
            effort_score=4,
        ))

    # ----------------------------------------------------------------
    # LINKS
    # ----------------------------------------------------------------
    broken_pages = [p for p in pages if p.status_code in range(400, 600)]
    if broken_pages:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.high,
            category=IssueCategory.links,
            title=f"Broken internal links detected ({len(broken_pages)} pages)",
            description=f"{len(broken_pages)} internal pages returned 4xx/5xx status codes. Broken links waste crawl budget and hurt user experience.",
            affected_url=broken_pages[0].url,
            current_value=f"{len(broken_pages)} pages with errors: {', '.join(str(p.status_code) for p in broken_pages[:3])}",
            recommended="Fix or redirect all broken URLs. Use 301 redirects for permanently moved pages.",
            impact_score=8,
            effort_score=4,
        ))

    # ----------------------------------------------------------------
    # SCHEMA MARKUP
    # ----------------------------------------------------------------
    all_schema_types: set[str] = set()
    has_any_schema = False
    for page in pages:
        for schema in page.structured_data:
            has_any_schema = True
            schema_type = schema.get("@type", "")
            if isinstance(schema_type, list):
                all_schema_types.update(schema_type)
            elif schema_type:
                all_schema_types.add(schema_type)

    if not has_any_schema:
        issues.append(AuditIssueCreate(
            severity=IssueSeverity.critical,
            category=IssueCategory.schema,
            title="No structured data (Schema.org) found",
            description="No JSON-LD structured data was found on any page. Schema markup enables rich results in search and helps Google understand your content.",
            affected_url=None,
            current_value="No structured data found",
            recommended="Add JSON-LD structured data to all key pages. Start with Organization, WebSite, and relevant page-type schemas.",
            impact_score=8,
            effort_score=5,
        ))
    else:
        org_types = {"Organization", "LocalBusiness", "Corporation", "NGO"}
        if not all_schema_types.intersection(org_types):
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.high,
                category=IssueCategory.schema,
                title="Missing Organization schema markup",
                description="No Organization or LocalBusiness schema was found. This schema helps search engines understand your business identity and enables Knowledge Panel features.",
                affected_url=homepage.url,
                current_value="Not present",
                recommended="Add Organization or LocalBusiness JSON-LD schema to your homepage with name, URL, logo, contactPoint, and sameAs properties.",
                impact_score=7,
                effort_score=3,
            ))

        # Check for FAQ schema on FAQ/support pages
        faq_pages = [
            p for p in pages
            if any(kw in p.url.lower() for kw in ["faq", "support", "help", "questions"])
        ]
        faq_schema_types = {"FAQPage", "QAPage"}
        if faq_pages and not all_schema_types.intersection(faq_schema_types):
            issues.append(AuditIssueCreate(
                severity=IssueSeverity.medium,
                category=IssueCategory.schema,
                title="Missing FAQ schema on FAQ/support pages",
                description=f"{len(faq_pages)} FAQ/support page(s) were found without FAQPage structured data. FAQ schema can generate rich results that increase SERP real estate.",
                affected_url=faq_pages[0].url,
                current_value="No FAQPage schema found",
                recommended="Add FAQPage JSON-LD schema to all FAQ and support pages, listing question-answer pairs.",
                impact_score=6,
                effort_score=3,
            ))

    return issues
