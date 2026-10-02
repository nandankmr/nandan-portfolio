// Writer — ports hermes/writer.py: turns a research brief into a finished MDX
// draft, with the full guardrail pipeline (citations, stub recovery, banned-word
// removal, bare-anchor fix, component sanitizing, scaffold-heading stripping).

import type { ChatMessage } from './llm';
import { generate } from './llm';
import { SYSTEM_PROMPT } from './prompt';
import type { ResearchBrief } from './research';

const VALID_CATEGORIES = ['AI Engineering', 'Essays', 'Leadership', 'Engineering', 'Career'];

// Low safety floor only — catches stub/truncated outputs, NOT a push for length.
const MIN_WORDS = 380;

export interface DraftPost {
  slug: string;
  title: string;
  description: string;
  dek: string;
  category: string;
  tags: string[];
  date: string;
  readingTime: string;
  toc: { id: string; label: string }[];
  content: string;
}

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

function buildResearchContext(brief: ResearchBrief): string {
  const parts = [`TOPIC: ${brief.topic.title}`, `MAIN URL: ${brief.topic.url}`, ''];
  if (brief.keyFacts.length) {
    parts.push('KEY FACTS — cite these specific numbers/dates verbatim, with links:');
    for (const fact of brief.keyFacts) parts.push(`  • ${fact}`);
    parts.push('');
  }
  if (brief.tavilyAnswer) {
    parts.push('RESEARCH SUMMARY (from web search):');
    parts.push(brief.tavilyAnswer.slice(0, 2500));
    parts.push('');
  }
  brief.sources.slice(0, 4).forEach((src, idx) => {
    parts.push(`--- SOURCE ${idx + 1}: ${src.title} ---`);
    parts.push(`URL: ${src.url}`);
    let content = src.content.trim();
    if (content.length > 3500) content = content.slice(0, 3500) + '\n[truncated]';
    parts.push(content);
    parts.push('');
  });
  return parts.join('\n');
}

// ── Guardrail helpers (ported verbatim) ───────────────────────────────

const INLINE_LINK_RE = /\]\(https?:\/\//g;
const countInlineLinks = (c: string) => (c.match(INLINE_LINK_RE) ?? []).length;

const BANNED_PHRASES = [
  'game-changer', 'game changer', 'revolutionize', 'revolutionary',
  'leap forward', 'seamless', 'seamlessly', 'unlock', 'unleash', 'transform',
  'set to', 'promises to', 'is poised to', "in today's fast-paced",
  'the future of', 'harness the power',
];
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BANNED_RE = new RegExp(BANNED_PHRASES.map((p) => `\\b${escapeRe(p)}\\b`).join('|'), 'gi');

function findBanned(content: string): string[] {
  const found = new Set<string>();
  for (const m of content.matchAll(BANNED_RE)) found.add(m[0].toLowerCase());
  return [...found].sort();
}

const GENERIC_ANCHOR_RE =
  /\[\s*(?:source|sources|link|links|here|click here|read more|more|this|that|article|studies|study|papers|paper|reports|report|ref|reference|\d+)\s*\]\(https?:\/\//gi;
const countBareAnchors = (c: string) => (c.match(GENERIC_ANCHOR_RE) ?? []).length;

const ALLOWED_COMPONENTS = new Set(['Callout', 'PullQuote', 'Stat']);
const SELF_CLOSING_OK = new Set(['Stat']);
const JSX_TAG_RE = /<\/?([A-Z][A-Za-z0-9]*)\b[^>]*?\/?>/g;

function sanitizeComponents(content: string): string {
  let out = content;
  const names = new Set<string>();
  for (const m of out.matchAll(JSX_TAG_RE)) names.add(m[1]);
  for (const name of names) {
    if (ALLOWED_COMPONENTS.has(name)) continue;
    out = out.replace(new RegExp(`</?${escapeRe(name)}\\b[^>]*?/?>`, 'g'), '');
  }
  for (const name of ALLOWED_COMPONENTS) {
    if (SELF_CLOSING_OK.has(name)) continue;
    const opens = (out.match(new RegExp(`<${name}\\b[^>]*?(?<!/)>`, 'g')) ?? []).length;
    const closes = (out.match(new RegExp(`</${name}>`, 'g')) ?? []).length;
    if (opens !== closes) out = out.replace(new RegExp(`</?${name}\\b[^>]*?/?>`, 'g'), '');
  }
  return out;
}

// A mermaid block that doesn't begin with a known diagram type renders as a
// broken mermaid.ink image — drop those entirely rather than ship a broken figure.
const MERMAID_TYPE_RE =
  /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|C4Context)\b/;

function sanitizeMermaid(content: string): string {
  return content.replace(/```mermaid\s*\n([\s\S]*?)```/g, (full, body: string) => {
    const firstLine = body.trim().split('\n')[0]?.trim() ?? '';
    return MERMAID_TYPE_RE.test(firstLine) ? full : '';
  });
}

const SCAFFOLD_HEADINGS = new Set([
  'falsifiable thesis', 'thesis', 'hook', 'why it matters', 'why this matters',
  'so what', 'so what now', 'take', 'hot take', 'caveat', 'caveats',
  'limitation', 'limitations', 'time to act', 'call to action',
  'introduction', 'intro', 'conclusion', 'in conclusion', 'the good part',
]);
const HEADING_LINE_RE = /^(#{2,3})\s+(.+?)\s*$/gm;
const HEADING_LEAD_RE = /^(?:the|a|an|one|my|your|our)\s+/i;

function stripScaffoldHeadings(content: string): string {
  const cleaned = content.replace(HEADING_LINE_RE, (full, _hashes, title: string) => {
    const norm = title.trim().replace(/[:.!?]+$/, '').replace(HEADING_LEAD_RE, '').trim().toLowerCase();
    return SCAFFOLD_HEADINGS.has(norm) ? '' : full;
  });
  return cleaned.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function appendSources(content: string, brief: ResearchBrief): string {
  if (/^#{2,3}\s+sources\b/im.test(content)) return content;
  const seen = new Set<string>();
  const items: string[] = [];
  for (const src of brief.sources) {
    const url = (src.url || '').trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push(`- [${(src.title || url).trim()}](${url})`);
  }
  if (!items.length) return content;
  return content.replace(/\s+$/, '') + '\n\n## Sources\n\n' + items.join('\n') + '\n';
}

function stripSources(content: string): string {
  return content.replace(/\n#{2,3}\s+sources\b[\s\S]*$/i, '').replace(/\s+$/, '');
}

const calcReadTime = (c: string) => `${Math.max(1, Math.round(wordCount(c) / 200))} min read`;

function extractToc(content: string): { id: string; label: string }[] {
  const toc: { id: string; label: string }[] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (m) {
      const label = m[2].trim();
      const id = label.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      toc.push({ id, label });
    }
  }
  return toc;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ParsedMeta {
  title?: string;
  slug?: string;
  description?: string;
  dek?: string;
  category?: string;
  tags?: string[];
}

function parseMetaAndContent(raw: string): { meta: ParsedMeta; content: string } {
  const jsonMatch = raw.match(/```json\s*\n([\s\S]*?)\n```/i);
  if (!jsonMatch) throw new Error('Writer output missing JSON metadata block (```json...```)');
  let meta: ParsedMeta;
  try {
    meta = JSON.parse(jsonMatch[1]);
  } catch (e) {
    throw new Error(`Writer output has invalid JSON: ${(e as Error).message}`);
  }
  let content = raw.slice((jsonMatch.index ?? 0) + jsonMatch[0].length).trim();
  content = content.replace(/^```\w*\s*\n?/, '').trim();
  if (content.length < 200) throw new Error(`Writer returned too little content (${content.length} chars)`);
  return { meta, content };
}

function parseOutput(raw: string, brief: ResearchBrief, day: string): DraftPost {
  const { meta, content } = parseMetaAndContent(raw);
  const title = meta.title || brief.topic.title;
  const baseSlug = meta.slug || slugify(title);
  const category = meta.category && VALID_CATEGORIES.includes(meta.category) ? meta.category : 'AI Engineering';
  return {
    slug: `${baseSlug}-${day}`,
    title,
    description: meta.description ?? '',
    dek: meta.dek ?? '',
    category,
    tags: meta.tags ?? [],
    date: day,
    readingTime: calcReadTime(content),
    toc: extractToc(content),
    content,
  };
}

// ── write_post ────────────────────────────────────────────────────────

export async function writePost(brief: ResearchBrief): Promise<DraftPost> {
  const context = buildResearchContext(brief);
  const day = today();

  const userMsg =
    `Here is the research for today's post. Write a complete essay following your style guide.\n\n` +
    `${context}\n` +
    `Today's date: ${day}\n\n` +
    `Before you finish, self-check against your NON-NEGOTIABLE grounding rules:\n` +
    `  1. Reads like a human explaining something to a friend — plain words, analogies, no academic tone. Punchy, not padded (~600–900 words is plenty).\n` +
    `  2. Every major claim anchored to a number/date/benchmark from the research above — and every number is VERBATIM from the research, never computed or derived (no 'Nx faster' math).\n` +
    `  3. At least 2 inline Markdown links to the SOURCE URLs above, with descriptive anchor text (never a bare '[source]').\n` +
    `  4. Zero banned hype words. A falsifiable thesis. At least one caveat.\n` +
    `  5. dek is distinct from description.\n\n` +
    `Remember: JSON block first (\`\`\`json...\`\`\`), then a blank line, then the MDX content.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMsg },
  ];

  let raw = await generate(messages);
  let draft = parseOutput(raw, brief, day);

  // Citation retry
  if (countInlineLinks(draft.content) === 0 && brief.sources.length) {
    try {
      const rawRetry = await generate([
        ...messages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content:
            'Your draft has zero inline source links. Rewrite it, this time linking specific claims to the SOURCE URLs from the research using Markdown links [text](url). Do not invent facts or URLs. Same output format: JSON block, blank line, then MDX.',
        },
      ]);
      const retryDraft = parseOutput(rawRetry, brief, day);
      if (countInlineLinks(retryDraft.content) > 0) {
        draft = retryDraft;
        raw = rawRetry;
      }
    } catch { /* keep first draft */ }
  }

  // Stub-recovery retry
  if (wordCount(draft.content) < MIN_WORDS) {
    try {
      const rawExpand = await generate([
        ...messages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content:
            `This draft is only ${wordCount(draft.content)} words — it reads like it got cut off before it finished making its point. Finish it. If it already has a conclusion, deepen the EXISTING body sections (a sharper example, the trade-off spelled out) — do NOT add a second conclusion, a new closing section, or trailing paragraphs after the ending. One ending only. Stay punchy and human — do NOT pad, repeat yourself, or add filler. Do NOT invent facts, numbers, API details, or code — only include a code snippet if real API/code usage appears in the research. Keep all existing inline links and add more where they fit. Same output format: JSON block, blank line, then MDX.`,
        },
      ]);
      const expandDraft = parseOutput(rawExpand, brief, day);
      if (
        wordCount(expandDraft.content) > wordCount(draft.content) &&
        countInlineLinks(expandDraft.content) >= countInlineLinks(draft.content)
      ) {
        draft = expandDraft;
        raw = rawExpand;
      }
    } catch { /* keep shorter draft */ }
  }

  // De-banning retry
  const banned = findBanned(draft.content);
  if (banned.length) {
    try {
      const rawDeb = await generate([
        ...messages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content:
            `Your draft uses these banned hype words/phrases: ${banned.join(', ')}. Remove every instance by rewriting only those sentences in plain, concrete language — do not touch anything else, and keep all inline links, facts, and structure exactly as they are. Same output format: JSON block, blank line, then MDX.`,
        },
      ]);
      const debDraft = parseOutput(rawDeb, brief, day);
      if (!findBanned(debDraft.content).length && countInlineLinks(debDraft.content) >= countInlineLinks(draft.content)) {
        draft = debDraft;
        raw = rawDeb;
      }
    } catch { /* keep original */ }
  }

  // Bare-anchor retry
  if (countBareAnchors(draft.content)) {
    try {
      const rawAnc = await generate([
        ...messages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content:
            'Your draft uses generic link text like "[source]", "[here]", or "[link]". Rewrite ONLY the link anchors so the clickable text is the actual words of the claim it supports — e.g. instead of "the models disagree [source](url)", write "[the models disagree 67% of the time](url)". Keep the exact same URLs, facts, and structure; change nothing else. Same output format: JSON block, blank line, then MDX.',
        },
      ]);
      const ancDraft = parseOutput(rawAnc, brief, day);
      if (
        countBareAnchors(ancDraft.content) < countBareAnchors(draft.content) &&
        countInlineLinks(ancDraft.content) >= countInlineLinks(draft.content) &&
        !findBanned(ancDraft.content).length
      ) {
        draft = ancDraft;
        raw = rawAnc;
      }
    } catch { /* keep draft */ }
  }

  // Final defenses + recompute derived fields
  draft.content = sanitizeComponents(draft.content);
  draft.content = sanitizeMermaid(draft.content);
  draft.content = stripScaffoldHeadings(draft.content);
  draft.content = appendSources(draft.content, brief);
  draft.toc = extractToc(draft.content);
  draft.readingTime = calcReadTime(draft.content);
  return draft;
}

// ── revise_post ───────────────────────────────────────────────────────

export interface CurrentDraft {
  slug?: string;
  title?: string;
  dek?: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
  content?: string;
}

export async function revisePost(current: CurrentDraft, notes: string): Promise<DraftPost> {
  const day = today();
  const origContent = current.content ?? '';
  const sourcesMatch = origContent.match(/\n(#{2,3}\s+sources\b[\s\S]*)$/i);
  const sourcesBlock = sourcesMatch ? sourcesMatch[1].trim() : '';
  const bodyWithoutSources = stripSources(origContent);

  const userMsg =
    'Here is the CURRENT draft of a blog post you wrote, followed by the editor\'s revision notes. Rewrite the post incorporating the notes. Keep what works; change what the notes ask for. Preserve your voice and the output format.\n\n' +
    `--- CURRENT TITLE ---\n${current.title ?? ''}\n\n` +
    `--- CURRENT DEK ---\n${current.dek ?? ''}\n\n` +
    `--- CURRENT CONTENT (MDX) ---\n${bodyWithoutSources}\n\n` +
    `--- EDITOR'S NOTES ---\n${notes}\n\n` +
    'Output the JSON metadata block first (```json...```), then a blank line, then the full revised MDX content. Keep the same category unless the notes say otherwise.';

  const raw = await generate([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMsg },
  ]);

  const { meta, content: parsedContent } = parseMetaAndContent(raw);
  const category =
    meta.category && VALID_CATEGORIES.includes(meta.category)
      ? meta.category
      : current.category && VALID_CATEGORIES.includes(current.category)
        ? current.category
        : 'AI Engineering';

  let content = sanitizeComponents(parsedContent);
  content = sanitizeMermaid(content);
  content = stripScaffoldHeadings(content);
  if (sourcesBlock) content = stripSources(content) + '\n\n' + sourcesBlock + '\n';

  return {
    slug: current.slug ?? '',
    title: meta.title || current.title || '',
    description: meta.description ?? current.description ?? '',
    dek: meta.dek ?? current.dek ?? '',
    category,
    tags: meta.tags ?? current.tags ?? [],
    date: current.date ?? day,
    readingTime: calcReadTime(content),
    toc: extractToc(content),
    content,
  };
}
