"""
Discovery module: find trending AI/engineering topics worth writing about.

Sources:
  1. Hacker News top stories (filtered for relevance)
  2. Tavily search for recent AI/engineering news
"""

import asyncio
import datetime
import logging
from dataclasses import dataclass, field

import httpx
from tavily import TavilyClient

import config

logger = logging.getLogger(__name__)

HN_API = "https://hacker-news.firebaseio.com/v0"

# Two pools of search themes, both anchored to Nandan's role (senior full-stack
# & AI engineer, agent builder, team lead). Each run pulls a rotating few from
# BOTH pools, so the topic list always carries the broader human/craft/career
# angle alongside the hands-on technical one — never only hardcore tech.
TECHNICAL_QUERIES = [
    "LLM agents orchestration patterns lessons",
    "building voice AI agents real-time latency",
    "RAG vector database production tradeoffs",
    "full-stack TypeScript Node React architecture 2026",
    "shipping AI features to production pitfalls",
    "multi-agent systems design in practice",
]
CRAFT_QUERIES = [
    "how AI is changing the software engineer's job essay",
    "engineering leadership in the age of AI",
    "what makes a good senior engineer now",
    "lessons from building AI products opinion",
    "technical hiring and interviews in the AI era",
    "managing a small engineering team well",
    "developer experience AI coding assistants reflection",
    "career advice for engineers building with AI",
]

# Keywords that indicate a story relevant to Nandan's role. Beyond the raw
# tech terms, this now also catches the craft/leadership/career angle.
_HN_KEYWORDS = frozenset({
    # Core tech
    "ai", "llm", "ml", "gpt", "claude", "gemini", "model", "agent", "vector",
    "embedding", "inference", "transformer", "rag", "fine-tun", "diffusion",
    "engineering", "platform", "system", "backend", "frontend", "api",
    "architecture", "scale", "distributed", "kubernetes", "docker", "deploy",
    "performance", "latency", "rust", "golang", "typescript", "python",
    "open source", "framework", "library", "tool", "database", "postgres",
    "microservice", "serverless", "edge", "realtime", "voice", "speech",
    # Craft, leadership, career, product — the broader role context
    "developer", "engineer", "career", "hiring", "interview", "team",
    "leadership", "management", "manager", "productivity", "startup",
    "founder", "product", "remote", "burnout", "mentorship", "craft",
    "writing", "learning", "saas", "fintech",
})


def _rotating(pool: list[str], n: int) -> list[str]:
    if not pool:
        return []
    offset = datetime.date.today().toordinal() % len(pool)
    rotated = pool[offset:] + pool[:offset]
    return rotated[:n]


def _todays_queries() -> list[str]:
    """Pick a daily window drawn from BOTH pools so variety stays high and the
    broader role/craft angle always shows up — not just technical news."""
    return _rotating(TECHNICAL_QUERIES, 3) + _rotating(CRAFT_QUERIES, 3)


@dataclass
class Topic:
    title: str
    url: str
    score: int
    source: str  # "hn" | "tavily"
    snippet: str = field(default="")


async def _fetch_hn_stories(client: httpx.AsyncClient, limit: int = 20) -> list[Topic]:
    """Fetch HN top stories, filter by keyword relevance."""
    try:
        resp = await client.get(f"{HN_API}/topstories.json", timeout=10)
        resp.raise_for_status()
        ids = resp.json()[:60]
    except Exception as e:
        logger.warning(f"HN topstories failed: {e}")
        return []

    async def fetch_item(item_id: int) -> dict | None:
        try:
            r = await client.get(f"{HN_API}/item/{item_id}.json", timeout=8)
            r.raise_for_status()
            return r.json()
        except Exception:
            return None

    items = await asyncio.gather(*[fetch_item(i) for i in ids])
    items = [
        i for i in items
        if i and i.get("type") == "story" and i.get("url") and i.get("score", 0) > 20
    ]

    relevant = []
    for item in items:
        text = (item.get("title", "") + " " + item.get("text", "")).lower()
        if any(kw in text for kw in _HN_KEYWORDS):
            relevant.append(Topic(
                title=item["title"],
                url=item["url"],
                score=item.get("score", 0),
                source="hn",
            ))

    relevant.sort(key=lambda t: t.score, reverse=True)
    return relevant[:limit]


def _search_tavily(queries: list[str]) -> list[Topic]:
    """Tavily search for recent, role-relevant news and essays."""
    client = TavilyClient(api_key=config.TAVILY_API_KEY)
    topics: list[Topic] = []

    for query in queries:
        try:
            results = client.search(
                query=query,
                search_depth="basic",
                max_results=4,
                # A wider window than HN: leadership/craft pieces aren't daily news.
                days=7,
            )
            for r in results.get("results", []):
                if not r.get("url"):
                    continue
                topics.append(Topic(
                    title=r.get("title", ""),
                    url=r["url"],
                    score=int(r.get("score", 0) * 100),
                    source="tavily",
                    snippet=r.get("content", "")[:400],
                ))
        except Exception as e:
            logger.warning(f"Tavily search failed for '{query}': {e}")

    return topics


async def discover_topics() -> list[Topic]:
    """Return the top candidate topics for today's post, deduplicated."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        hn_topics = await _fetch_hn_stories(client)

    tavily_topics = _search_tavily(_todays_queries())

    # Deduplicate by URL, keeping the first (source-preserving) occurrence.
    seen: set[str] = set()
    hn_unique: list[Topic] = []
    tavily_unique: list[Topic] = []
    for t in hn_topics + tavily_topics:
        norm_url = t.url.rstrip("/").lower()
        if norm_url in seen:
            continue
        seen.add(norm_url)
        (hn_unique if t.source == "hn" else tavily_unique).append(t)

    hn_unique.sort(key=lambda t: t.score, reverse=True)
    tavily_unique.sort(key=lambda t: t.score, reverse=True)

    # Interleave HN (community-validated tech) with Tavily (broader role/craft
    # angles) so the list always carries variety rather than HN-only tech.
    result: list[Topic] = []
    i = j = 0
    while len(result) < config.MAX_TOPICS and (i < len(hn_unique) or j < len(tavily_unique)):
        if i < len(hn_unique):
            result.append(hn_unique[i])
            i += 1
        if len(result) >= config.MAX_TOPICS:
            break
        if j < len(tavily_unique):
            result.append(tavily_unique[j])
            j += 1

    logger.info(f"Discovered {len(result)} topics")
    for t in result:
        logger.info(f"  [{t.source}] score={t.score} — {t.title[:80]}")

    return result
