WEIGHTS = {
    "technical": 0.25,
    "on_page": 0.25,
    "content": 0.25,
    "performance": 0.15,
    "mobile": 0.10,
}

ISSUE_CATEGORY_MAP = {
    "meta_tags": "on_page",
    "headings": "on_page",
    "content": "content",
    "images": "performance",
    "links": "technical",
    "schema": "on_page",
    "performance": "performance",
    "mobile": "mobile",
    "security": "technical",
    "crawlability": "technical",
    "indexability": "technical",
}

SEVERITY_PENALTY = {
    "critical": 5,
    "high": 3,
    "medium": 1,
    "low": 0,
}


def compute_score(issues: list) -> tuple[int, dict]:
    """
    Compute overall SEO score and per-category breakdown from a list of issues.

    Returns:
        (overall_score, category_scores_dict)
    """
    category_scores = {k: 100 for k in WEIGHTS}

    for issue in issues:
        category = issue.category if isinstance(issue.category, str) else issue.category.value
        severity = issue.severity if isinstance(issue.severity, str) else issue.severity.value
        bucket = ISSUE_CATEGORY_MAP.get(category, "technical")
        penalty = SEVERITY_PENALTY.get(severity, 0)
        category_scores[bucket] = max(0, category_scores[bucket] - penalty)

    total = sum(category_scores[k] * WEIGHTS[k] for k in WEIGHTS)
    score = max(0, min(100, round(total)))
    return score, category_scores
