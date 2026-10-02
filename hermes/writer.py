"""
Writer module: turn a research brief into a complete blog draft via OpenRouter.

Nandan's voice system prompt is baked in here — edit to tune the style.
"""

import json
import logging
import re
import time
from dataclasses import dataclass, field
from datetime import date

import httpx

import config
from research import ResearchBrief

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

VALID_CATEGORIES = ("AI Engineering", "Essays", "Leadership", "Engineering", "Career")

# Low safety floor only — we reward punchy over long. This exists purely to
# catch stub/truncated outputs (a half-written post), NOT to force length.
# A tight 500-word post that says one thing well beats a padded 1500-word one.
# Kept deliberately low: a complete-but-short post should pass untouched; only a
# genuinely cut-off draft (well under this) should trigger the recovery retry.
MIN_WORDS = 380

SYSTEM_PROMPT = """You are writing as Nandan Kumar — a senior software engineer and engineering lead with deep hands-on experience in AI systems, full-stack product engineering, and scaling technical teams.

Writing style — THIS IS A BLOG, NOT A RESEARCH PAPER:
- Write like you're explaining something exciting to a smart friend over coffee — someone sharp but not necessarily an expert in this exact niche. Curious, not credentialed.
- Plain, human language. Short words over long ones. If a 10-year-old word works, use it instead of the $5 one. Read it aloud — if it sounds like a corporate memo or an academic abstract, rewrite it.
- Use analogies and everyday comparisons to make hard ideas click. Translate raw numbers into human stakes: don't just say "70% faster" — say what that means for someone's actual afternoon.
- First person, conversational, warm. Contractions are good. The occasional direct address to the reader ("you've probably hit this") is good.
- Fun and enjoyable to read. Dry wit, a well-placed aside, genuine enthusiasm where it's earned. You're allowed to have a personality.
- Short, punchy sentences are your default. Mix in a longer one for rhythm. Vary it. White space is your friend — short paragraphs.
- You're still substantive and opinionated — you take clear positions from real experience. "Simple" means clear, not shallow. Explain the complex thing simply, then show you actually understand its depth.
- Honest about trade-offs and failure modes. Skepticism reads as human; hype reads as a press release.

Grounding rules (NON-NEGOTIABLE — these override everything else):
- Every major claim must be anchored to a CONCRETE fact from the research below: a number, date, benchmark score, price, or direct detail. If the research doesn't support a point, cut the point — never pad with adjectives.
- Cite your sources inline as Markdown links, e.g. "[scored 69.2% on SWE-Bench Pro](https://…)". Use the SOURCE URLs provided in the research. The link text must be the actual WORDS OF THE CLAIM — NEVER a bare "[source]"/"[link]", and NEVER a publication or brand name like "[LinkedIn]" or "[Zippia]". Do NOT attribute a claim to a named outlet unless that exact outlet is the URL you are linking. One URL supports one claim: never reuse the same URL as the citation for several different stats, and never credit two different-sounding publishers to the same link. If you only have one source for a figure, link the figure once and state the rest plainly without inventing attributions.
- NEVER fabricate. Do not invent API parameters, method names, SDK/package names, code snippets, config keys, version numbers, dates, or benchmark figures that are not explicitly in the research below. Inventing a plausible-looking but unverified fact is the WORST failure — worse than being vague. If the research doesn't state it, you do not know it: omit it or say it's unconfirmed.
- Only include a code snippet if the research below contains real, verifiable API/code usage. If it does not, DO NOT write code — illustrate with prose or a concrete scenario instead. A fabricated code example is a serious failure.
- Respect the timeline. If the research says something already shipped/released on a date, write about it as released — not as "upcoming" or "on its way".
- Prefer specifics over abstractions: "$5 per million input tokens" beats "affordable"; "69.2% vs 64.3%" beats "significantly better".
- NEVER do arithmetic. Do not derive, compute, or infer any figure — no ratios, multipliers, "Nx faster", percentages, sums, or averages. Only state numbers that appear VERBATIM in the research, exactly as written. If the research gives "1 ms" and "100 ms", do NOT claim "100x faster" (or "25x", or anything) unless that exact multiplier is stated in the research. A number you calculated can contradict the source's own figure — that reads as a self-contradiction and is treated as fabrication. When in doubt, quote the raw figures and let them speak.
- Somewhere in the flow, state at least ONE claim a smart reader could disagree with, and admit at least ONE caveat or limitation. These belong INSIDE your prose as normal sentences — they are NOT sections. NEVER label them: do not write a heading like "## The Falsifiable Thesis", "## My Take", "## One Caveat", "## Hook", "## Why It Matters", or "## So What". Those are notes-to-self, not headings a reader should ever see.
- BANNED words/phrases (do not use, ever): game-changer, game changer, revolutionize, revolutionary, leap forward, seamless, seamlessly, unlock, unleash, transform, "set to", "promises to", "is poised to", "in today's fast-paced", "the future of", "harness the power".

Loose shape (a guide, not a checklist — don't be formulaic):
1. Hook — a concrete observation, a surprising number, or a "huh, that's weird" moment. Never "In this post I will…"
2. Why it matters — the real problem or tension, framed in human terms
3. Your take, stated plainly in one sentence — the thing a reader could disagree with
4. The good part — a concrete example, a real number, or a small story that proves it. Make the abstract tangible.
5. So what — what this means for the reader's actual work, with one thing they could go do
6. A clean landing — one takeaway, not a summary of everything you just said

Format rules:
- MDX (Markdown with JSX support)
- Aim for ~600–900 tight, lively words. Punchy beats long — say the one thing well and stop. Never pad to hit a number. If it genuinely needs more room to land, take it, but earn every paragraph.
- H2 headings (##) to structure sections, H3 (###) for sub-points. Headings must be REAL, content-specific section titles (e.g. "## Where the latency actually goes"), never the name of a structural beat ("Hook", "The Falsifiable Thesis", "Caveat", "So What", "Conclusion"). If a heading would just describe the post's mechanics rather than its subject, delete it.
- Code blocks with language identifiers where helpful (```typescript, ```python, etc.)
- Rich elements — use them to add texture, but SPARINGLY (at most one or two per post, and only when they genuinely earn their place; a wall of boxes is worse than none). The ONLY components that exist are these three — never invent others:
    • <Callout>a key insight or takeaway</Callout>
    • <PullQuote cite="who said it">a punchy line worth pulling out — ideally a striking sentence already in your post, or a real quote from the research (cite optional)</PullQuote>
    • <Stat value="May 2026" label="rollout begins" /> — one genuinely important number or date from the research, with a short label. The value MUST be a real figure from the research, never invented.
  Plain Markdown blockquotes (> …) are also fine for quoting a source.
- Do NOT include an H1 title in the content — that's rendered from metadata
- Do NOT include frontmatter in the markdown body

Output format (STRICTLY follow this):
1. First output a JSON block with metadata (```json ... ```)
2. Then a blank line
3. Then the full MDX content starting directly with the first paragraph

The JSON block must contain exactly these keys:
{
  "title": "The post title",
  "slug": "url-friendly-slug-no-date",
  "description": "One sentence, max 160 chars, for SEO. MUST be distinct from the dek.",
  "dek": "One sentence article subtitle shown under the title. A sharp hook — NOT a paraphrase of the description.",
  "category": "one of: AI Engineering, Essays, Leadership, Engineering, Career",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}"""


@dataclass
class DraftPost:
    slug: str
    title: str
    description: str
    dek: str
    category: str
    tags: list[str]
    date: str
    reading_time: str
    toc: list[dict]
    content: str


def _build_research_context(brief: ResearchBrief) -> str:
    """Format research brief as a readable context block for the LLM."""
    parts = [
        f"TOPIC: {brief.topic.title}",
        f"MAIN URL: {brief.topic.url}",
        "",
    ]

    if getattr(brief, "key_facts", None):
        parts.append("KEY FACTS — cite these specific numbers/dates verbatim, with links:")
        for fact in brief.key_facts:
            parts.append(f"  • {fact}")
        parts.append("")

    if brief.tavily_answer:
        parts.append("RESEARCH SUMMARY (from web search):")
        parts.append(brief.tavily_answer[:2500])
        parts.append("")

    for i, src in enumerate(brief.sources[:4], 1):
        parts.append(f"--- SOURCE {i}: {src.title} ---")
        parts.append(f"URL: {src.url}")
        content = src.content.strip()
        if len(content) > 3500:
            content = content[:3500] + "\n[truncated]"
        parts.append(content)
        parts.append("")

    return "\n".join(parts)


_INLINE_LINK_RE = re.compile(r'\]\(https?://')

# Hype words/phrases we never ship. Mirrors the BANNED list in SYSTEM_PROMPT —
# enforced programmatically because models occasionally ignore the instruction.
BANNED_PHRASES = (
    "game-changer", "game changer", "revolutionize", "revolutionary",
    "leap forward", "seamless", "seamlessly", "unlock", "unleash", "transform",
    "set to", "promises to", "is poised to", "in today's fast-paced",
    "the future of", "harness the power",
)
_BANNED_RE = re.compile(
    "|".join(r"\b" + re.escape(p) + r"\b" for p in BANNED_PHRASES), re.IGNORECASE
)


def _find_banned(content: str) -> list[str]:
    """Return the distinct banned hype phrases present in the content."""
    found = {m.group(0).lower() for m in _BANNED_RE.finditer(content)}
    return sorted(found)


def _count_inline_links(content: str) -> int:
    """Count Markdown inline links [text](http...) in the body."""
    return len(_INLINE_LINK_RE.findall(content))


# Generic, low-value anchor labels. The link text should be the words of the
# claim ("[disagree 67% of the time](url)"), never a bare "[source]"/"[here]".
_GENERIC_ANCHOR_RE = re.compile(
    r"\[\s*(?:source|sources|link|links|here|click here|read more|more|this|"
    r"that|article|studies|study|papers|paper|reports|report|ref|reference|"
    r"\d+)\s*\]\(https?://",
    re.IGNORECASE,
)


def _count_bare_anchors(content: str) -> int:
    """Count inline links whose visible text is a generic placeholder."""
    return len(_GENERIC_ANCHOR_RE.findall(content))


# The ONLY JSX components the blog can render (see src/lib/mdx-components.tsx).
# Anything else is an unknown component and would crash the force-dynamic post
# page at request time, so we strip it before the draft is ever stored.
ALLOWED_COMPONENTS = frozenset({"Callout", "PullQuote", "Stat"})
# Components allowed to appear self-closing (no children / closing tag).
_SELF_CLOSING_OK = frozenset({"Stat"})
# Any capitalized JSX-style tag, opening / closing / self-closing.
_JSX_TAG_RE = re.compile(r"</?([A-Z][A-Za-z0-9]*)\b[^>]*?/?>")


def _sanitize_components(content: str) -> str:
    """
    Defend the render path. MDX treats any Capitalized tag as a component; if
    it isn't in the components map the RSC render throws and the live page 500s.

    1. Strip every capitalized JSX tag whose component isn't on the allowlist
       (keep the inner text — we lose styling, not content).
    2. For allowed block components, if opening/closing tags are unbalanced,
       strip that component's tags entirely (a half-open tag breaks the compile).
    """
    names = {m.group(1) for m in _JSX_TAG_RE.finditer(content)}
    for name in names:
        if name in ALLOWED_COMPONENTS:
            continue
        logger.warning(f"Stripping unknown MDX component <{name}> from draft")
        content = re.sub(rf"</?{re.escape(name)}\b[^>]*?/?>", "", content)

    for name in ALLOWED_COMPONENTS - _SELF_CLOSING_OK:
        opens = len(re.findall(rf"<{name}\b[^>]*?(?<!/)>", content))
        closes = len(re.findall(rf"</{name}>", content))
        if opens != closes:
            logger.warning(f"Unbalanced <{name}> tags ({opens} open / {closes} close) — stripping them")
            content = re.sub(rf"</?{name}\b[^>]*?/?>", "", content)

    return content


# Structural "beat" labels that sometimes leak from the prompt into the body as
# literal headings (e.g. "## The Falsifiable Thesis"). A reader should never see
# the post's mechanics named — strip the heading line, keep the prose under it.
_SCAFFOLD_HEADINGS = frozenset({
    "falsifiable thesis", "thesis", "hook", "why it matters", "why this matters",
    "so what", "so what now", "take", "hot take", "caveat", "caveats",
    "limitation", "limitations", "time to act", "call to action",
    "introduction", "intro", "conclusion", "in conclusion", "the good part",
})
_HEADING_LINE_RE = re.compile(r"^(#{2,3})\s+(.+?)\s*$", re.MULTILINE)
# Leading articles/possessives to ignore when matching ("The Take" -> "take").
_HEADING_LEAD_RE = re.compile(r"^(?:the|a|an|one|my|your|our)\s+", re.IGNORECASE)


def _strip_scaffold_headings(content: str) -> str:
    """Remove heading lines that merely name a structural beat, keeping the
    body text beneath them. Defends against prompt scaffolding leaking as H2s."""
    def _drop(m: re.Match) -> str:
        title = m.group(2).strip().rstrip(":.!?")
        norm = _HEADING_LEAD_RE.sub("", title).strip().lower()
        if norm in _SCAFFOLD_HEADINGS:
            logger.warning(f"Stripping scaffold heading '{m.group(2).strip()}' from draft")
            return ""  # drop the heading line; prose under it remains
        return m.group(0)

    cleaned = _HEADING_LINE_RE.sub(_drop, content)
    # Collapse any 3+ blank lines left behind into a clean paragraph break.
    return re.sub(r"\n{3,}", "\n\n", cleaned).strip() + "\n"


def _append_sources(content: str, brief: ResearchBrief) -> str:
    """
    Append a '## Sources' section built from the research brief, so every post
    has verifiable references even if the model failed to cite inline.
    Idempotent: skips if the content already has a Sources heading.
    """
    if re.search(r'(?im)^#{2,3}\s+sources\b', content):
        return content
    seen: set[str] = set()
    items: list[str] = []
    for src in brief.sources:
        url = (src.url or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        title = (src.title or url).strip()
        items.append(f"- [{title}]({url})")
    if not items:
        return content
    return content.rstrip() + "\n\n## Sources\n\n" + "\n".join(items) + "\n"


def _calc_read_time(content: str) -> str:
    words = len(content.split())
    mins = max(1, round(words / 200))
    return f"{mins} min read"


def _extract_toc(content: str) -> list[dict]:
    """Parse H2/H3 headings into TOC entries."""
    toc = []
    for line in content.splitlines():
        m = re.match(r'^(#{2,3})\s+(.+)', line)
        if m:
            label = m.group(2).strip()
            # Slugify: lowercase, strip punctuation, spaces → hyphens
            slug = re.sub(r'[^\w\s-]', '', label.lower()).strip()
            slug = re.sub(r'[\s]+', '-', slug)
            toc.append({"id": slug, "label": label})
    return toc


def _slugify(title: str) -> str:
    slug = re.sub(r'[^\w\s-]', '', title.lower()).strip()
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug[:60].rstrip('-')


def _generate(messages: list[dict]) -> str:
    """
    Generate text. If an OpenAI key is configured, use it as the primary
    provider (high quality, paid). Otherwise — or if OpenAI fails — fall
    through to the OpenRouter free-model chain.
    """
    # 1. OpenAI direct (primary, if configured)
    if config.OPENAI_API_KEY:
        try:
            return _call_openai(messages)
        except Exception as e:
            logger.warning(f"OpenAI provider failed ({e}); falling back to OpenRouter chain")

    # 2. OpenRouter free-model chain (fallback / default)
    return _call_openrouter(messages)


def _call_openai(messages: list[dict]) -> str:
    """Call OpenAI's API directly with retries on 429/5xx."""
    headers = {
        "Authorization": f"Bearer {config.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    last_error: Exception | None = None
    for attempt in range(config.MODEL_RETRIES):
        resp = httpx.post(
            OPENAI_URL,
            headers=headers,
            json={
                "model": config.OPENAI_MODEL,
                "messages": messages,
                "max_tokens": 4096,
                "temperature": 0.7,
            },
            timeout=120,
        )
        if resp.status_code in (429, 500, 502, 503):
            logger.warning(f"OpenAI {config.OPENAI_MODEL}: {resp.status_code}, attempt {attempt + 1}/{config.MODEL_RETRIES}")
            last_error = httpx.HTTPStatusError(str(resp.status_code), request=resp.request, response=resp)
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        logger.info(f"Used OpenAI model: {config.OPENAI_MODEL}")
        return resp.json()["choices"][0]["message"]["content"]
    raise last_error or RuntimeError("OpenAI call failed")


def _call_openrouter(messages: list[dict]) -> str:
    """
    Call OpenRouter, walking a fallback chain of free models.
    Free-tier models occasionally return 429 (overloaded); we retry the
    primary a few times, then fall through to the next model in the chain.
    """
    headers = {
        "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nandankumar.com",
        "X-Title": "Hermes Blog Agent",
    }

    # Primary (from config) first, then the rest of the chain (deduped)
    chain = [config.WRITER_MODEL] + [m for m in config.FALLBACK_MODELS if m != config.WRITER_MODEL]

    last_error: Exception | None = None
    for model in chain:
        for attempt in range(config.MODEL_RETRIES):
            try:
                resp = httpx.post(
                    OPENROUTER_URL,
                    headers=headers,
                    json={
                        "model": model,
                        "messages": messages,
                        "max_tokens": 4096,
                        "temperature": 0.7,
                    },
                    timeout=120,
                )
                if resp.status_code == 429:
                    logger.warning(f"{model}: 429 (overloaded), attempt {attempt + 1}/{config.MODEL_RETRIES}")
                    last_error = httpx.HTTPStatusError("429", request=resp.request, response=resp)
                    time.sleep(2 ** attempt)  # 1s, 2s, 4s back-off
                    continue
                resp.raise_for_status()
                if model != config.WRITER_MODEL:
                    logger.info(f"Used fallback model: {model}")
                return resp.json()["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                last_error = e
                # Non-429 HTTP errors (402/404/etc.): skip to next model immediately
                if e.response is not None and e.response.status_code != 429:
                    logger.warning(f"{model}: HTTP {e.response.status_code}, trying next model")
                    break
            except Exception as e:
                last_error = e
                logger.warning(f"{model}: {e}, attempt {attempt + 1}/{config.MODEL_RETRIES}")
                time.sleep(1)

        logger.warning(f"{model} exhausted — falling through to next model")

    raise RuntimeError(f"All writer models failed. Last error: {last_error}")


def _parse_output(raw: str, brief: ResearchBrief, today: str) -> DraftPost:
    """Parse the LLM output into a DraftPost."""
    # Extract JSON metadata block
    json_match = re.search(r'```json\s*\n(.*?)\n```', raw, re.DOTALL | re.IGNORECASE)
    if not json_match:
        raise ValueError("Writer output missing JSON metadata block (```json...```)")

    try:
        meta = json.loads(json_match.group(1))
    except json.JSONDecodeError as e:
        raise ValueError(f"Writer output has invalid JSON: {e}")

    # Everything after the JSON block is the MDX content
    content = raw[json_match.end():].strip()

    # Strip any leftover ``` artifacts at the very start
    content = re.sub(r'^```\w*\s*\n?', '', content).strip()

    if len(content) < 200:
        raise ValueError(f"Writer returned too little content ({len(content)} chars)")

    title = meta.get("title") or brief.topic.title
    base_slug = meta.get("slug") or _slugify(title)
    # Append date to guarantee uniqueness in the DB
    slug = f"{base_slug}-{today}"

    category = meta.get("category", "AI Engineering")
    if category not in VALID_CATEGORIES:
        category = "AI Engineering"

    return DraftPost(
        slug=slug,
        title=title,
        description=meta.get("description", ""),
        dek=meta.get("dek", ""),
        category=category,
        tags=meta.get("tags", []),
        date=today,
        reading_time=_calc_read_time(content),
        toc=_extract_toc(content),
        content=content,
    )


def write_post(brief: ResearchBrief) -> DraftPost:
    """Call OpenRouter to write a complete blog post from the research brief."""
    logger.info(f"Writing post for: {brief.topic.title}")

    context = _build_research_context(brief)
    today = date.today().isoformat()

    user_msg = (
        f"Here is the research for today's post. Write a complete essay following your style guide.\n\n"
        f"{context}\n"
        f"Today's date: {today}\n\n"
        f"Before you finish, self-check against your NON-NEGOTIABLE grounding rules:\n"
        f"  1. Reads like a human explaining something to a friend — plain words, analogies, no academic tone. Punchy, not padded (~600–900 words is plenty).\n"
        f"  2. Every major claim anchored to a number/date/benchmark from the research above — and every number is VERBATIM from the research, never computed or derived (no 'Nx faster' math).\n"
        f"  3. At least 2 inline Markdown links to the SOURCE URLs above, with descriptive anchor text (never a bare '[source]').\n"
        f"  4. Zero banned hype words. A falsifiable thesis. At least one caveat.\n"
        f"  5. dek is distinct from description.\n\n"
        f"Remember: JSON block first (```json...```), then a blank line, then the MDX content."
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ]
    raw = _generate(messages)
    draft = _parse_output(raw, brief, today)

    # Enforce inline citations: if the model wrote zero links, retry once with
    # a blunt reminder. Cheap models routinely skip this on the first pass.
    if _count_inline_links(draft.content) == 0 and brief.sources:
        logger.warning("Draft had 0 inline links — retrying once with a citation reminder")
        retry_messages = messages + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": (
                "Your draft has zero inline source links. Rewrite it, this time "
                "linking specific claims to the SOURCE URLs from the research using "
                "Markdown links [text](url). Do not invent facts or URLs. "
                "Same output format: JSON block, blank line, then MDX."
            )},
        ]
        try:
            raw_retry = _generate(retry_messages)
            retry_draft = _parse_output(raw_retry, brief, today)
            if _count_inline_links(retry_draft.content) > 0:
                draft, raw = retry_draft, raw_retry
        except Exception as e:
            logger.warning(f"Citation retry failed ({e}); keeping first draft")

    # Stub recovery only: if the body is suspiciously short (truncated / half a
    # post), ask once for a complete version. This is NOT a push for length —
    # a finished 600-word post is fine; we just don't want a 200-word stub.
    if len(draft.content.split()) < MIN_WORDS:
        logger.warning(f"Draft only {len(draft.content.split())} words — looks truncated, retrying once")
        expand_messages = messages + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": (
                f"This draft is only {len(draft.content.split())} words — it reads like it got cut off "
                "before it finished making its point. Finish it. If it already has a conclusion, deepen "
                "the EXISTING body sections (a sharper example, the trade-off spelled out) — do NOT add "
                "a second conclusion, a new closing section, or trailing paragraphs after the ending. "
                "One ending only. Stay punchy and human — do NOT pad, repeat yourself, or add filler. "
                "Do NOT invent facts, numbers, API details, or code — only include a code snippet if "
                "real API/code usage appears in the research. Keep all existing inline links and add "
                "more where they fit. Same output format: JSON block, blank line, then MDX."
            )},
        ]
        try:
            raw_expand = _generate(expand_messages)
            expand_draft = _parse_output(raw_expand, brief, today)
            # Accept only if it's actually longer and didn't lose citations
            if (len(expand_draft.content.split()) > len(draft.content.split())
                    and _count_inline_links(expand_draft.content) >= _count_inline_links(draft.content)):
                draft, raw = expand_draft, raw_expand
        except Exception as e:
            logger.warning(f"Length-expansion retry failed ({e}); keeping shorter draft")

    # Strip banned hype words: models occasionally use one despite the rule.
    # Retry once asking for surgical removal (don't rewrite the whole post).
    banned = _find_banned(draft.content)
    if banned:
        logger.warning(f"Draft used banned hype words {banned} — retrying once to remove them")
        debanned_messages = messages + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": (
                f"Your draft uses these banned hype words/phrases: {', '.join(banned)}. "
                "Remove every instance by rewriting only those sentences in plain, concrete "
                "language — do not touch anything else, and keep all inline links, facts, and "
                "structure exactly as they are. Same output format: JSON block, blank line, then MDX."
            )},
        ]
        try:
            raw_deb = _generate(debanned_messages)
            deb_draft = _parse_output(raw_deb, brief, today)
            # Accept only if it actually removed banned words and kept citations
            if (not _find_banned(deb_draft.content)
                    and _count_inline_links(deb_draft.content) >= _count_inline_links(draft.content)):
                draft, raw = deb_draft, raw_deb
            else:
                logger.warning(f"De-banning retry still had issues (banned={_find_banned(deb_draft.content)}); keeping original")
        except Exception as e:
            logger.warning(f"De-banning retry failed ({e}); keeping original draft")

    # Fix generic "[source]" / "[here]" anchors: the link text should be the
    # words of the claim. Models regress to bare anchors despite the prompt.
    if _count_bare_anchors(draft.content):
        n = _count_bare_anchors(draft.content)
        logger.warning(f"Draft has {n} generic '[source]'-style anchors — retrying once for descriptive link text")
        anchor_messages = messages + [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": (
                "Your draft uses generic link text like \"[source]\", \"[here]\", or \"[link]\". "
                "Rewrite ONLY the link anchors so the clickable text is the actual words of the "
                "claim it supports — e.g. instead of \"the models disagree [source](url)\", write "
                "\"[the models disagree 67% of the time](url)\". Keep the exact same URLs, facts, "
                "and structure; change nothing else. Same output format: JSON block, blank line, then MDX."
            )},
        ]
        try:
            raw_anc = _generate(anchor_messages)
            anc_draft = _parse_output(raw_anc, brief, today)
            # Accept only if it reduced bare anchors without losing links or
            # reintroducing banned words.
            if (_count_bare_anchors(anc_draft.content) < _count_bare_anchors(draft.content)
                    and _count_inline_links(anc_draft.content) >= _count_inline_links(draft.content)
                    and not _find_banned(anc_draft.content)):
                draft, raw = anc_draft, raw_anc
            else:
                logger.warning("Anchor-text retry didn't improve cleanly; keeping original draft")
        except Exception as e:
            logger.warning(f"Anchor-text retry failed ({e}); keeping draft")

    # Strip any non-renderable JSX so a stray component can't 500 the live page.
    draft.content = _sanitize_components(draft.content)
    # Remove any leaked structural-beat headings ("## The Falsifiable Thesis").
    draft.content = _strip_scaffold_headings(draft.content)

    # Always append a verifiable Sources section from the brief, then recompute
    # TOC + reading time so they reflect the final content.
    draft.content = _append_sources(draft.content, brief)
    draft.toc = _extract_toc(draft.content)
    draft.reading_time = _calc_read_time(draft.content)

    leftover_banned = _find_banned(draft.content)
    logger.info(
        f"Draft ready: '{draft.title}' | {len(draft.content.split())} words | "
        f"{draft.reading_time} | {_count_inline_links(draft.content)} inline links | "
        f"{len(draft.toc)} TOC entries | category={draft.category} | "
        f"banned={leftover_banned or 'none'}"
    )
    return draft


def revise_post(current: dict, notes: str) -> DraftPost:
    """
    Revise an existing draft based on the editor's notes.

    `current` is the post dict from the API (title, content, slug, etc.).
    Returns a new DraftPost with the same slug (so the update targets the
    same DB row) but revised content/metadata.
    """
    logger.info(f"Revising draft: '{current.get('title')}' with notes")

    today = date.today().isoformat()

    # Preserve the existing Sources block verbatim so revisions can't drop or
    # fabricate references. Feed the model the body without it.
    orig_content = current.get("content", "")
    sources_match = re.search(r'(?ims)\n(#{2,3}\s+sources\b.*)\Z', orig_content)
    sources_block = sources_match.group(1).strip() if sources_match else ""
    current = {**current, "content": _strip_sources(orig_content)}

    user_msg = (
        "Here is the CURRENT draft of a blog post you wrote, followed by the editor's "
        "revision notes. Rewrite the post incorporating the notes. Keep what works; "
        "change what the notes ask for. Preserve your voice and the output format.\n\n"
        f"--- CURRENT TITLE ---\n{current.get('title', '')}\n\n"
        f"--- CURRENT DEK ---\n{current.get('dek', '')}\n\n"
        f"--- CURRENT CONTENT (MDX) ---\n{current.get('content', '')}\n\n"
        f"--- EDITOR'S NOTES ---\n{notes}\n\n"
        "Output the JSON metadata block first (```json...```), then a blank line, then "
        "the full revised MDX content. Keep the same category unless the notes say otherwise."
    )

    raw = _generate([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ])

    # Extract JSON + content (reuse parser logic without slug-dating)
    json_match = re.search(r'```json\s*\n(.*?)\n```', raw, re.DOTALL | re.IGNORECASE)
    if not json_match:
        raise ValueError("Revision output missing JSON metadata block")
    meta = json.loads(json_match.group(1))
    content = raw[json_match.end():].strip()
    content = re.sub(r'^```\w*\s*\n?', '', content).strip()
    if len(content) < 200:
        raise ValueError(f"Revision returned too little content ({len(content)} chars)")

    category = meta.get("category", current.get("category", "AI Engineering"))
    if category not in VALID_CATEGORIES:
        category = "AI Engineering"

    # Strip any non-renderable JSX before storing.
    content = _sanitize_components(content)
    # Remove any leaked structural-beat headings ("## The Falsifiable Thesis").
    content = _strip_scaffold_headings(content)

    # Re-attach the preserved Sources block (drop any the model re-emitted).
    if sources_block:
        content = _strip_sources(content) + "\n\n" + sources_block + "\n"

    return DraftPost(
        # Keep the existing slug so we update the same row
        slug=current.get("slug", ""),
        title=meta.get("title") or current.get("title", ""),
        description=meta.get("description", current.get("description", "")),
        dek=meta.get("dek", current.get("dek", "")),
        category=category,
        tags=meta.get("tags", current.get("tags", [])),
        date=current.get("date", today),
        reading_time=_calc_read_time(content),
        toc=_extract_toc(content),
        content=content,
    )


def _strip_sources(content: str) -> str:
    """Remove a trailing '## Sources' section (re-appended fresh each revision)."""
    return re.sub(r'(?ims)\n#{2,3}\s+sources\b.*\Z', '', content).rstrip()
