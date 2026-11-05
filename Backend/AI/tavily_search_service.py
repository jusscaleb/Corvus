import os
import time
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# Lightweight in-memory cache to prevent redundant Tavily API calls (TTL: 10 minutes)
_SEARCH_CACHE = {}
_CACHE_TTL = 600  # seconds

ZIMBABWE_GEOGRAPHIC_TERMS = {
    "zimbabwe", "zim", "harare", "bulawayo", "chitungwiza", "mutare", "gweru",
    "kwekwe", "kadoma", "masvingo", "chinhoyi", "marondera", "hwange", "beitbridge",
    "vic falls", "victoria falls", "zesa", "zimra", "rbz", "potraz", "zupco"
}


def _get_tavily_key() -> str:
    try:
        if settings.configured:
            val = getattr(settings, 'TAVILY_API_KEY', None)
            if val:
                return val
    except Exception:
        pass
    return os.getenv('TAVILY_API_KEY') or ""


def normalize_zimbabwe_query(query: str) -> str:
    """
    Enforces a strict Zimbabwe geographical and editorial scope on all search queries.
    If the query does not already contain a known Zimbabwean city, entity, or term,
    'Zimbabwe' is automatically appended.
    """
    cleaned = (query or "").strip()
    if not cleaned:
        return ""
    
    words = set(cleaned.lower().split())
    has_zim_context = any(term in words or term in cleaned.lower() for term in ZIMBABWE_GEOGRAPHIC_TERMS)
    if not has_zim_context:
        return f"{cleaned} Zimbabwe"
    return cleaned


def search_zimbabwe_web(query: str, max_results: int = 5, search_depth: str = "basic") -> list[dict]:
    """
    Executes a web search via the Tavily Search API, strictly scoped to Zimbabwe.
    
    Args:
        query (str): The search topic or headline.
        max_results (int): Maximum number of search results to return (default: 5).
        search_depth (str): 'basic' (fast) or 'advanced' (deep).
        
    Returns:
        list[dict]: List of verified search results with title, url, content, score, published_date.
    """
    api_key = _get_tavily_key()
    if not api_key:
        logger.warning("TAVILY_API_KEY is not configured. Web search unavailable.")
        return []

    norm_query = normalize_zimbabwe_query(query)
    if not norm_query:
        return []

    cache_key = f"{norm_query.lower()}:{max_results}:{search_depth}"
    now = time.monotonic()
    if cache_key in _SEARCH_CACHE:
        cached_time, cached_results = _SEARCH_CACHE[cache_key]
        if now - cached_time < _CACHE_TTL:
            return cached_results

    endpoint = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": norm_query,
        "search_depth": search_depth,
        "include_answer": False,
        "max_results": max(1, min(max_results, 10)),
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=8.0)
        if response.status_code != 200:
            logger.warning(f"Tavily search error ({response.status_code}): {response.text}")
            return []

        data = response.json()
        raw_results = data.get("results", [])

        normalized = []
        for r in raw_results:
            normalized.append({
                "title": r.get("title") or "Untitled Source",
                "url": r.get("url") or "",
                "content": (r.get("content") or "").strip(),
                "score": float(r.get("score") or 0.0),
                "published_date": r.get("published_date") or "",
            })

        _SEARCH_CACHE[cache_key] = (now, normalized)
        return normalized

    except Exception as exc:
        logger.warning(f"Tavily search request failed for '{norm_query}': {exc}")
        return []


def format_search_results_for_prompt(results: list[dict], max_chars: int = 2500) -> str:
    """
    Formats a list of Tavily search results into a clean, structured context block
    suitable for injection into LLM prompts.
    """
    if not results:
        return "No external web findings available."

    lines = []
    total_chars = 0
    for idx, r in enumerate(results, 1):
        title = r.get("title", "")
        url = r.get("url", "")
        date = r.get("published_date", "")
        date_str = f" ({date})" if date else ""
        content = r.get("content", "")

        entry = f"[{idx}] {title}{date_str}\n    URL: {url}\n    Summary: {content}\n"
        if total_chars + len(entry) > max_chars and lines:
            break
        lines.append(entry)
        total_chars += len(entry)

    return "\n".join(lines).strip()
