import json
import logging
import anthropic
from app.config import settings
from app.ai.prompts import (
    KEYWORD_CLUSTERING_PROMPT,
    CONTENT_PLAN_PROMPT,
    COMPETITOR_GAP_PROMPT,
)

logger = logging.getLogger("northbound.ai")

MODEL = "claude-sonnet-4-6"


class AIClient:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def _call(self, prompt: str, max_tokens: int = 4096) -> str:
        """Make a synchronous call to the Anthropic API (runs in background tasks)."""
        message = self.client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    def _parse_json(self, text: str) -> any:
        """Parse JSON from AI response, stripping any markdown fences."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines (```json and ```)
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
        return json.loads(text)

    async def cluster_keywords(self, keywords: list[dict]) -> list[dict]:
        """Group keywords into topical clusters with intent labels."""
        if not keywords:
            return []

        keywords_json = json.dumps(keywords[:200], indent=2)
        prompt = KEYWORD_CLUSTERING_PROMPT.format(keywords_json=keywords_json)

        try:
            response_text = self._call(prompt, max_tokens=4096)
            clusters = self._parse_json(response_text)
            if not isinstance(clusters, list):
                logger.warning("AI cluster_keywords returned non-list: %s", type(clusters))
                return []
            return clusters
        except (json.JSONDecodeError, Exception) as e:
            logger.exception("AI cluster_keywords failed: %s", str(e))
            # Return a single fallback cluster
            return [{
                "name": "General Keywords",
                "intent": "informational",
                "keywords": [kw["keyword"] for kw in keywords[:50]],
            }]

    async def generate_content_plan(
        self,
        project_info: dict,
        keywords: list[dict],
        gaps: list[dict],
        issues: list[dict],
    ) -> dict:
        """Generate a 30/60/90 day content roadmap."""
        prompt = CONTENT_PLAN_PROMPT.format(
            project_info=json.dumps(project_info, indent=2),
            keywords_json=json.dumps(keywords[:50], indent=2),
            gaps_json=json.dumps(gaps[:20], indent=2),
            issues_json=json.dumps(issues[:20], indent=2),
        )

        try:
            response_text = self._call(prompt, max_tokens=8192)
            plan = self._parse_json(response_text)
            if not isinstance(plan, dict):
                logger.warning("AI generate_content_plan returned non-dict: %s", type(plan))
                return {"phase_30_day": [], "phase_60_day": [], "phase_90_day": []}
            # Ensure all phases exist
            plan.setdefault("phase_30_day", [])
            plan.setdefault("phase_60_day", [])
            plan.setdefault("phase_90_day", [])
            return plan
        except (json.JSONDecodeError, Exception) as e:
            logger.exception("AI generate_content_plan failed: %s", str(e))
            return {"phase_30_day": [], "phase_60_day": [], "phase_90_day": []}

    async def analyze_competitor_gaps(
        self,
        your_keywords: list[str],
        competitor_data: list[dict],
    ) -> list[dict]:
        """Identify and prioritize content/keyword gaps vs competitors."""
        if not competitor_data:
            return []

        prompt = COMPETITOR_GAP_PROMPT.format(
            your_keywords_json=json.dumps(your_keywords[:100], indent=2),
            competitor_data_json=json.dumps(competitor_data, indent=2),
        )

        try:
            response_text = self._call(prompt, max_tokens=4096)
            gaps = self._parse_json(response_text)
            if not isinstance(gaps, list):
                logger.warning("AI analyze_competitor_gaps returned non-list: %s", type(gaps))
                return []
            return gaps
        except (json.JSONDecodeError, Exception) as e:
            logger.exception("AI analyze_competitor_gaps failed: %s", str(e))
            return []
