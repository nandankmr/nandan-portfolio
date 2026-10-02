"""
Research module: deep-fetch and analyse sources for a chosen topic.

Steps:
  1. Fetch the main article in full via trafilatura
  2. Run a Tavily advanced search for related context
  3. Fetch full text of the top related sources
"""

import logging
import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

import trafilatura
from tavily import TavilyClient

import config
from discovery import Topic

logger = logging.getLogger(__name__)

# Low-signal domains we never want as cited sources for a technical post:
# social media, video, forums, and SEO content farms.
JUNK_DOMAINS = frozenset({
    "facebook.com", "instagram.com", "threads.net", "tiktok.com",
    "twitter.com", "x.com", "t.co", "reddit.com", "redd.it",
    "youtube.com", "youtu.be", "pinterest.com", "quora.com",
    "linkedin.com", "medium.com",  # medium = mostly reposts/opinion
})


def _domain(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return ""


def _is_quality_source(url: str) -> bool:
    """True unless the URL is on a junk domain (or a subdomain of one)."""
    host = _domain(url)
    if not host:
        return False
    return not any(host == d or host.endswith("." + d) for d in JUNK_DOMAINS)


@dataclass
class Source:
    url: str
    title: str
    content: str = field(default="")


@dataclass
class ResearchBrief:
    topic: Topic
    sources: list[Source]
    tavily_answer: str       # Tavily's synthesised answer for the search query
    key_facts: list[str] = field(default_factory=list)  # concrete, citable facts


def _fetch_article(url: str, max_chars: int = 8000) -> str:
    """Fetch and clean article text with trafilatura."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return ""
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=True,
            favor_precision=True,
            no_fallback=False,
        )
        return (text or "")[:max_chars]
    except Exception as e:
        logger.warning(f"trafilatura failed for {url}: {e}")
        return ""


def _tavily_deep(query: str) -> tuple[str, list[Source]]:
    """Tavily advanced search — returns synthesised answer + rich sources."""
    client = TavilyClient(api_key=config.TAVILY_API_KEY)
    try:
        result = client.search(
            query=query,
            search_depth="advanced",
            # Over-fetch so we still have enough after junk-domain filtering
            max_results=config.MAX_SOURCES_PER_TOPIC + 4,
            include_answer=True,
            exclude_domains=list(JUNK_DOMAINS),
        )
        answer = result.get("answer", "")
        sources = [
            Source(
                url=r["url"],
                title=r.get("title", ""),
                content=r.get("content", "")[:4000],
            )
            for r in result.get("results", [])
            if r.get("url") and _is_quality_source(r["url"])
        ]
        return answer, sources
    except Exception as e:
        logger.error(f"Tavily advanced search failed: {e}")
        return "", []


# Signals that a sentence carries a concrete, citable fact.
_FACT_TOKENS = re.compile(
    r"(\d+\.?\d*\s?%|\$\s?\d|\d+\.?\d*\s?[×x]\b|\bbenchmark|\bscore[ds]?\b|"
    r"\btokens?\b|\bfaster\b|\bcheaper\b|\bSWE-?bench|\bMMLU|\bGPQA|"
    r"\brelease[ds]?\b|\blaunch(?:ed|es)?\b|\bversion\b|\bper million\b|"
    r"\b\d{4}\b|\b\d+\s?(?:million|billion|k|M|B)\b)",
    re.IGNORECASE,
)


def _extract_facts(sources: list[Source], limit: int = 18) -> list[str]:
    """
    Pull concrete, fact-bearing sentences (numbers, benchmarks, prices, dates)
    out of the source text so the writer has hard specifics to cite — instead
    of paraphrasing into vague adjectives.
    """
    facts: list[str] = []
    seen: set[str] = set()
    for src in sources:
        # Split into rough sentences
        for raw in re.split(r"(?<=[.!?])\s+|\n+", src.content):
            s = raw.strip()
            if not (40 <= len(s) <= 280):
                continue
            if not _FACT_TOKENS.search(s):
                continue
            # Must actually contain a digit somewhere
            if not re.search(r"\d", s):
                continue
            key = re.sub(r"\s+", " ", s.lower())
            if key in seen:
                continue
            seen.add(key)
            facts.append(s)
            if len(facts) >= limit:
                return facts
    return facts


def research_topic(topic: Topic) -> ResearchBrief:
    """Return a rich research brief for the given topic."""
    logger.info(f"Researching: {topic.title}")

    # 1. Fetch main article
    main_text = _fetch_article(topic.url) if topic.url else ""

    # 2. Deep Tavily search
    search_query = f"{topic.title} technical implementation details analysis"
    tavily_answer, related_sources = _tavily_deep(search_query)

    # 3. Enrich related sources that only have snippet text
    for src in related_sources[:3]:
        if len(src.content) < 500 and src.url != topic.url:
            full = _fetch_article(src.url, max_chars=5000)
            if full:
                src.content = full

    # 4. Assemble sources list (main article first), dropping junk domains
    sources: list[Source] = []
    if main_text:
        sources.append(Source(url=topic.url, title=topic.title, content=main_text))

    for src in related_sources:
        if src.url == topic.url:
            continue  # don't duplicate the main article
        if not _is_quality_source(src.url):
            logger.info(f"Dropping low-quality source: {src.url}")
            continue
        sources.append(src)

    sources = sources[:config.MAX_SOURCES_PER_TOPIC]

    # 5. Mine concrete facts (numbers, benchmarks, prices, dates) to cite
    key_facts = _extract_facts(sources)

    total_chars = sum(len(s.content) for s in sources)
    logger.info(
        f"Research complete: {len(sources)} sources, "
        f"~{total_chars // 1000}k chars, "
        f"{len(key_facts)} key facts, "
        f"answer={'yes' if tavily_answer else 'no'}"
    )

    return ResearchBrief(
        topic=topic,
        sources=sources,
        tavily_answer=tavily_answer,
        key_facts=key_facts,
    )
