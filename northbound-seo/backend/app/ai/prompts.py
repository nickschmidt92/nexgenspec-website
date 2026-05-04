KEYWORD_CLUSTERING_PROMPT = """You are an expert SEO strategist. You will receive a list of keywords with their search volumes, difficulty scores, and CPCs.

Your task is to group these keywords into topical clusters. Each cluster should:
1. Have a clear, descriptive name (2-5 words)
2. Have a single dominant search intent: informational, transactional, navigational, or commercial
3. Contain closely related keywords that could be targeted by the same page
4. Be actionable from an SEO content strategy perspective

Respond ONLY with a valid JSON array of cluster objects. Do not include any explanation or markdown.

Required JSON format:
[
  {
    "name": "Cluster Name",
    "intent": "informational|transactional|navigational|commercial",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Keywords to cluster:
{keywords_json}"""


CONTENT_PLAN_PROMPT = """You are a senior SEO content strategist. Your job is to create a prioritized 30/60/90 day content plan for a business based on keyword opportunities, competitor gaps, and audit issues.

## Business Context
{project_info}

## Keyword Opportunities (keywords with no current page targeting them)
{keywords_json}

## Competitor Content Gaps
{gaps_json}

## Current Site Issues
{issues_json}

## Instructions
Create a 30/60/90 day content roadmap with 5-8 items per phase. For each phase:
- 30-day: High-impact, lower-effort wins (fix existing content, optimize pages, quick technical fixes expressed as content)
- 60-day: Medium-complexity content pieces targeting keyword opportunities
- 90-day: Longer-form content, pillar pages, comprehensive guides

For each content item provide:
- title: compelling, keyword-rich title
- content_type: one of blog_post, landing_page, faq_page, pillar_page, comparison_page, how_to_guide, case_study
- target_keywords: list of 2-4 primary target keywords
- target_intent: informational, transactional, navigational, or commercial
- suggested_url: SEO-friendly URL slug (e.g., /blog/keyword-topic)
- word_count_min: minimum recommended word count
- word_count_max: maximum recommended word count
- outline: object with "sections" array, each with "heading" and "key_points" list
- internal_links: list of 2-3 suggested internal link targets (existing site pages to link to/from)
- priority: P0 (critical), P1 (high), P2 (medium), P3 (low)
- impact_score: 1-10 (SEO traffic potential)
- effort_score: 1-10 (production effort required)

Respond ONLY with valid JSON. No explanation or markdown.

Required format:
{
  "phase_30_day": [...content items...],
  "phase_60_day": [...content items...],
  "phase_90_day": [...content items...]
}"""


COMPETITOR_GAP_PROMPT = """You are an expert SEO competitive analyst. Analyze the keyword and content gaps between a target website and its competitors.

## Target Site Keywords (what they currently rank for)
{your_keywords_json}

## Competitor Data
{competitor_data_json}

## Your Task
Identify the most important gaps and opportunities. Focus on:
1. Keywords competitors rank for but the target site does not (keyword gaps)
2. Content topics/formats competitors cover but the target site lacks (content gaps)
3. Technical patterns that give competitors an advantage

For each gap, assess:
- How achievable it is for the target site
- The potential traffic/business impact
- A specific, actionable recommendation

Respond ONLY with valid JSON. No explanation or markdown.

Required format:
[
  {
    "competitor_id": "uuid-string-of-the-competitor",
    "gap_type": "keyword|content|technical",
    "title": "Clear title describing the gap",
    "description": "Detailed explanation of the gap and why it matters",
    "competitor_value": "What the competitor has (e.g., 'Ranks #3 for X keyword')",
    "your_value": "What the target site has (e.g., 'No page targeting this keyword')",
    "opportunity_score": 8,
    "keyword": "primary keyword if applicable",
    "search_volume": 2400
  }
]

Focus on the top 15-20 most impactful gaps. Order by opportunity_score descending."""
