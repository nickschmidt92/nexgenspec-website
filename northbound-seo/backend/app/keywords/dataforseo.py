import httpx
from app.config import settings
from dataclasses import dataclass


@dataclass
class KeywordData:
    keyword: str
    search_volume: int | None
    keyword_difficulty: int | None
    cpc: float | None
    competition: float | None


class DataForSEOClient:
    BASE_URL = "https://api.dataforseo.com/v3"

    def __init__(self):
        self._auth = (settings.dataforseo_login, settings.dataforseo_password)

    async def get_keyword_data(
        self,
        keywords: list[str],
        location_code: int = 2840,
        language_code: str = "en",
    ) -> list[KeywordData]:
        """Get search volume, difficulty, CPC for a list of keywords."""
        payload = [{
            "keywords": keywords,
            "location_code": location_code,
            "language_code": language_code,
        }]
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE_URL}/keywords_data/google_ads/search_volume/live",
                json=payload,
                auth=self._auth,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for task in data.get("tasks", []):
            for item in (task.get("result") or []):
                results.append(KeywordData(
                    keyword=item.get("keyword", ""),
                    search_volume=item.get("search_volume"),
                    keyword_difficulty=item.get("keyword_difficulty"),
                    cpc=item.get("cpc"),
                    competition=item.get("competition"),
                ))
        return results

    async def get_keyword_suggestions(
        self,
        seed_keyword: str,
        location_code: int = 2840,
    ) -> list[KeywordData]:
        """Get keyword suggestions from a seed keyword."""
        payload = [{
            "keyword": seed_keyword,
            "location_code": location_code,
            "language_code": "en",
            "include_seed_keyword": True,
            "limit": 100,
        }]
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE_URL}/dataforseo_labs/google/keyword_suggestions/live",
                json=payload,
                auth=self._auth,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for task in data.get("tasks", []):
            for item in (task.get("result") or []):
                for kw in (item.get("items") or []):
                    results.append(KeywordData(
                        keyword=kw.get("keyword", ""),
                        search_volume=kw.get("keyword_info", {}).get("search_volume"),
                        keyword_difficulty=kw.get("keyword_properties", {}).get("keyword_difficulty"),
                        cpc=kw.get("keyword_info", {}).get("cpc"),
                        competition=kw.get("keyword_info", {}).get("competition"),
                    ))
        return results

    async def get_domain_keywords(
        self,
        domain: str,
        location_code: int = 2840,
    ) -> list[KeywordData]:
        """Get keywords a domain ranks for."""
        payload = [{
            "target": domain,
            "location_code": location_code,
            "language_code": "en",
            "limit": 200,
        }]
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE_URL}/dataforseo_labs/google/ranked_keywords/live",
                json=payload,
                auth=self._auth,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for task in data.get("tasks", []):
            for item in (task.get("result") or []):
                for kw in (item.get("items") or []):
                    keyword_info = kw.get("keyword_data", {}).get("keyword_info", {})
                    results.append(KeywordData(
                        keyword=kw.get("keyword_data", {}).get("keyword", ""),
                        search_volume=keyword_info.get("search_volume"),
                        keyword_difficulty=kw.get("keyword_data", {}).get(
                            "keyword_properties", {}
                        ).get("keyword_difficulty"),
                        cpc=keyword_info.get("cpc"),
                        competition=keyword_info.get("competition"),
                    ))
        return results
