from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright
import asyncio
import httpx


@dataclass
class PageData:
    url: str
    status_code: int
    title: str | None
    meta_description: str | None
    meta_robots: str | None
    canonical_url: str | None
    h1_tags: list[str]
    h2_tags: list[str]
    h3_tags: list[str]
    internal_links: list[str]
    external_links: list[str]
    broken_links: list[str]
    images: list[dict]
    structured_data: list[dict]
    word_count: int
    has_viewport_meta: bool
    og_title: str | None
    og_description: str | None
    load_time_ms: int
    html_size_bytes: int


@dataclass
class CrawlResult:
    base_url: str
    pages: list[PageData]
    sitemap_found: bool
    robots_txt_found: bool
    robots_txt_content: str | None


def _normalize_url(link: str, base_url: str, base_domain: str) -> str | None:
    """Normalize a link to an absolute URL, returning None if not on base domain."""
    try:
        if not link or link.startswith("#") or link.startswith("mailto:") or link.startswith("tel:"):
            return None
        if link.startswith("//"):
            link = "https:" + link
        if link.startswith("/"):
            parsed_base = urlparse(base_url)
            link = f"{parsed_base.scheme}://{parsed_base.netloc}{link}"
        if not link.startswith("http"):
            link = urljoin(base_url, link)
        parsed = urlparse(link)
        # Strip fragments and normalize
        normalized = parsed._replace(fragment="").geturl()
        if parsed.netloc == base_domain:
            return normalized
        return None
    except Exception:
        return None


async def _check_robots_txt(base_url: str) -> str | None:
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(robots_url)
            if resp.status_code == 200:
                return resp.text
    except Exception:
        pass
    return None


async def _check_sitemap(base_url: str) -> bool:
    parsed = urlparse(base_url)
    sitemap_url = f"{parsed.scheme}://{parsed.netloc}/sitemap.xml"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(sitemap_url)
            return resp.status_code == 200
    except Exception:
        return False


async def crawl_site(url: str, max_pages: int = 50) -> CrawlResult:
    """BFS crawl starting from url, stays within same domain, max_pages limit."""
    parsed_base = urlparse(url)
    base_domain = parsed_base.netloc
    visited: set[str] = set()
    queue: list[str] = [url]
    pages: list[PageData] = []

    # Check robots.txt and sitemap concurrently
    robots_txt_content, sitemap_found = await asyncio.gather(
        _check_robots_txt(url),
        _check_sitemap(url),
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; NorthboundSEOBot/1.0)",
            viewport={"width": 1280, "height": 720},
        )

        while queue and len(pages) < max_pages:
            current_url = queue.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)

            page_data = await _crawl_page(context, current_url, url, base_domain)
            pages.append(page_data)

            for link in page_data.internal_links:
                normalized = _normalize_url(link, url, base_domain)
                if normalized and normalized not in visited and normalized not in queue:
                    queue.append(normalized)

        await browser.close()

    return CrawlResult(
        base_url=url,
        pages=pages,
        sitemap_found=sitemap_found,
        robots_txt_found=robots_txt_content is not None,
        robots_txt_content=robots_txt_content,
    )


async def _crawl_page(context, url: str, base_url: str, base_domain: str) -> PageData:
    page = await context.new_page()
    start_time = asyncio.get_event_loop().time()

    try:
        response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        load_time = int((asyncio.get_event_loop().time() - start_time) * 1000)
        status_code = response.status if response else 0

        data = await page.evaluate("""() => {
            const getAll = (sel, attr) =>
                [...document.querySelectorAll(sel)]
                    .map(el => attr ? el.getAttribute(attr) : el.textContent?.trim())
                    .filter(Boolean);

            return {
                title: document.title || null,
                metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
                metaRobots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null,
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
                h1: getAll('h1'),
                h2: getAll('h2'),
                h3: getAll('h3'),
                links: getAll('a[href]', 'href'),
                images: [...document.querySelectorAll('img')].map(img => ({
                    src: img.src,
                    alt: img.getAttribute('alt'),
                    loading: img.getAttribute('loading'),
                    format: img.src.split('.').pop()?.split('?')[0]?.toLowerCase() || null
                })),
                structuredData: [...document.querySelectorAll('script[type="application/ld+json"]')]
                    .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
                    .filter(Boolean),
                hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
                ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null,
                ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null,
                wordCount: (document.body?.innerText || '').split(/\\s+/).filter(w => w.length > 2).length,
                htmlSize: document.documentElement.outerHTML.length,
            };
        }""")

        # Separate internal vs external links
        internal_links: list[str] = []
        external_links: list[str] = []
        for link in data.get("links", []):
            if not link:
                continue
            if link.startswith("/") or base_domain in link:
                internal_links.append(link)
            elif link.startswith("http"):
                external_links.append(link)

        return PageData(
            url=url,
            status_code=status_code,
            title=data.get("title"),
            meta_description=data.get("metaDescription"),
            meta_robots=data.get("metaRobots"),
            canonical_url=data.get("canonical"),
            h1_tags=data.get("h1", []),
            h2_tags=data.get("h2", []),
            h3_tags=data.get("h3", []),
            internal_links=internal_links,
            external_links=external_links,
            broken_links=[],
            images=data.get("images", []),
            structured_data=data.get("structuredData", []),
            word_count=data.get("wordCount", 0),
            has_viewport_meta=data.get("hasViewportMeta", False),
            og_title=data.get("ogTitle"),
            og_description=data.get("ogDescription"),
            load_time_ms=load_time,
            html_size_bytes=data.get("htmlSize", 0),
        )
    except Exception:
        return PageData(
            url=url,
            status_code=0,
            title=None,
            meta_description=None,
            meta_robots=None,
            canonical_url=None,
            h1_tags=[],
            h2_tags=[],
            h3_tags=[],
            internal_links=[],
            external_links=[],
            broken_links=[],
            images=[],
            structured_data=[],
            word_count=0,
            has_viewport_meta=False,
            og_title=None,
            og_description=None,
            load_time_ms=0,
            html_size_bytes=0,
        )
    finally:
        await page.close()
